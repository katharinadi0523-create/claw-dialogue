(() => {
  const { steps, todoItems, artifacts, draftDocumentArtifact, recentTasks } = window.DEMO_DATA;
  const totalSteps = steps.length;
  const INTAKE_CLARIFY_START = 2;
  const INTAKE_CLARIFY_END = 4;
  const CLARIFY_EXIT_DELAY_MS = 220;

  const state = {
    currentStep: 0,
    sessions: recentTasks.map((task) => ({ ...task })),
    sessionMenuId: null,
    renamingSessionId: null,
    renameDraft: "",
    answers: {},
    runtime: {},
    hitl: {},
    clarify: {
      exitingStep: null
    }
  };

  const timers = {
    transition: null,
    clarifyAdvance: null
  };

  const nodes = {
    body: document.body,
    stream: document.getElementById("messageStream"),
    noticeStack: document.getElementById("noticeStack"),
    sessionTitle: document.querySelector(".session-title-group h1"),
    recentTaskList: document.getElementById("recentTaskList"),
    executionStrip: document.getElementById("executionStrip"),
    progressList: document.getElementById("progressList"),
    progressCount: document.getElementById("progressCount"),
    fileList: document.getElementById("fileList"),
    fileCount: document.getElementById("fileCount"),
    contextList: document.getElementById("contextList"),
    contextCount: document.getElementById("contextCount"),
    composerTextarea: document.getElementById("composerTextarea"),
    skillPicker: document.getElementById("skillPicker"),
    skillPickerScroll: document.getElementById("skillPickerScroll"),
    skillPickerList: document.getElementById("skillPickerList"),
    skillPickerHint: document.getElementById("skillPickerHint"),
    skillHoverTip: document.getElementById("skillHoverTip"),
    skillHoverTipText: document.getElementById("skillHoverTipText"),
    skillPickerBtn: document.getElementById("skillPickerBtn")
  };

  const COMPOSER_SKILLS = [
    {
      id: "ppt",
      blurb: "演示稿",
      detail: "创建网页幻灯片与动画演示,也可对接 PowerPoint 工作流."
    },
    { id: "xlsx", blurb: "表格", detail: "分析、筛选与带公式的可编辑工作簿." },
    { id: "docx", blurb: "文档", detail: "长文档撰写、版式与交付级 Word 类产出." },
    { id: "slides", blurb: "PPTX", detail: "生成可编辑的 .pptx,适合套模板与改稿." },
    { id: "spreadsheets", blurb: "表格进阶", detail: "xlsx 公式、图表、数据表与多 Sheet 组织." },
    { id: "excalidraw-diagram", blurb: "图示", detail: "Excalidraw 架构/流程/白板,便于在对话里传图改图." },
    { id: "presentation-materials", blurb: "材料", detail: "多源合成汇报包、技术分享与宣讲稿." },
    { id: "frontend-design", blurb: "前端", detail: "生产级 Web 界面,遵循既有设计语言与组件节奏." },
    { id: "skill-creator", blurb: "造技能", detail: "为 Agent 定义技能说明、资源边界与可复用调用方式." },
    { id: "whitepaper-revision", blurb: "白皮书", detail: "在保留结构的前提下修订与对齐术语的企业白皮书." },
    { id: "user-manual", blurb: "手册", detail: "多章节用户手册,含操作路径与版式级截图位." },
    { id: "standard-operations-material", blurb: "标作", detail: "标准作业说明,流程与责任边界可评审." },
    { id: "cecloud-ai-design", blurb: "主题", detail: "企业 B 端风格与品牌蓝,列表/表单/大留白布局." }
  ];

  const skillUI = {
    open: false,
    fromSlash: false,
    slashStart: -1,
    query: "",
    buttonMode: false,
    active: 0
  };

  function getSkillById(id) {
    return COMPOSER_SKILLS.find((s) => s.id === id) || null;
  }

  function getSkillDescription(skillId) {
    const s = getSkillById(skillId);
    return s ? s.detail || s.blurb || "" : "";
  }

  function init() {
    bindEvents();
    initSkillPicker();
    render();
  }

  function bindEvents() {
    nodes.stream.addEventListener("click", (event) => {
      const hitlButton = event.target.closest("[data-hitl-action]");
      if (!hitlButton) return;
      event.preventDefault();
      event.stopPropagation();
      if (hitlButton.dataset.hitlAction === "clarify-custom-submit") {
        submitClarifyCustomAnswer();
        return;
      }
      handleHitlAction(hitlButton.dataset.hitlAction, hitlButton.dataset.choice);
    });

    nodes.stream.addEventListener("keydown", (event) => {
      const clarifyInput = event.target.closest("[data-clarify-custom-input]");
      if (!clarifyInput) return;
      if (event.key !== "Enter") return;
      event.preventDefault();
      submitClarifyCustomAnswer();
    });

    nodes.recentTaskList.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-session-menu-trigger]");
      if (trigger) {
        event.preventDefault();
        event.stopPropagation();
        toggleSessionMenu(trigger.getAttribute("data-session-menu-trigger"));
        return;
      }

      const action = event.target.closest("[data-session-action]");
      if (action) {
        event.preventDefault();
        event.stopPropagation();
        handleSessionAction(action.getAttribute("data-session-action"), action.getAttribute("data-session-id"));
        return;
      }

      const row = event.target.closest("[data-session-row]");
      if (!row || event.target.closest(".recent-rename-input")) return;
      setActiveSession(row.getAttribute("data-session-row"));
      closeSessionMenu();
    });

    nodes.recentTaskList.addEventListener("input", (event) => {
      const input = event.target.closest("[data-session-rename-input]");
      if (!input) return;
      state.renameDraft = input.value;
    });

    nodes.recentTaskList.addEventListener("keydown", (event) => {
      const input = event.target.closest("[data-session-rename-input]");
      if (!input) return;
      if (event.key === "Enter") {
        event.preventDefault();
        commitSessionRename(input.getAttribute("data-session-rename-input"));
      } else if (event.key === "Escape") {
        event.preventDefault();
        cancelSessionRename();
      }
    });

    nodes.recentTaskList.addEventListener("focusout", (event) => {
      const input = event.target.closest("[data-session-rename-input]");
      if (!input) return;
      window.setTimeout(() => {
        if (state.renamingSessionId === input.getAttribute("data-session-rename-input")) {
          commitSessionRename(input.getAttribute("data-session-rename-input"));
        }
      }, 0);
    });

    document.addEventListener("keydown", (event) => {
      const tag = event.target.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (event.key === "ArrowRight") {
        advance();
      } else if (event.key === "ArrowLeft") {
        prev();
      }
    });

    document.addEventListener("mousedown", (event) => {
      if (!state.sessionMenuId && !state.renamingSessionId) return;
      if (event.target.closest("#recentTaskList")) return;
      closeSessionMenu();
      if (state.renamingSessionId) commitSessionRename(state.renamingSessionId);
    });
  }

  function parseSlashContext(text, caret) {
    if (caret == null) return null;
    const before = text.slice(0, caret);
    const slash = before.lastIndexOf("/");
    if (slash < 0) return null;
    if (slash > 0) {
      const p = before[slash - 1];
      if (p !== " " && p !== "\n" && p !== "\t") return null;
    }
    const after = before.slice(slash + 1);
    if (after.includes(" ") || after.includes("\n") || after.includes("\t")) return null;
    if (!/^[a-zA-Z0-9._-]*$/.test(after)) return null;
    return { start: slash, query: after };
  }

  function filterSkills(query) {
    const q = (query || "").toLowerCase();
    if (!q) return COMPOSER_SKILLS.slice();
    return COMPOSER_SKILLS.filter(
      (s) => s.id.toLowerCase().includes(q) || (s.blurb && s.blurb.toLowerCase().includes(q))
    );
  }

  function getVisibleSkills() {
    if (skillUI.fromSlash) return filterSkills(skillUI.query);
    return filterSkills("");
  }

  function renderSkillRowButton(s, i) {
    const act = i === skillUI.active ? " is-active" : "";
    return `<li class="skill-picker-line" role="presentation">
      <button
        type="button"
        class="skill-picker-item${act}"
        data-skill-id="${escapeAttr(s.id)}"
        data-index="${i}"
        role="option"
        aria-selected="${i === skillUI.active ? "true" : "false"}"
      >
        <span class="skill-picker-icon" aria-hidden="true"><svg><use href="#icon-skill"></use></svg></span>
        <span class="skill-picker-name">${escapeHTML(s.id.toLowerCase())}</span>
      </button>
    </li>`;
  }

  function renderSkillPickerList() {
    const items = getVisibleSkills();
    if (nodes.skillPickerHint) {
      nodes.skillPickerHint.hidden = !skillUI.open || !skillUI.fromSlash;
    }
    if (items.length === 0) {
      nodes.skillPickerList.innerHTML = `<li class="skill-picker-empty" role="presentation">没有匹配的技能</li>`;
      if (nodes.skillPickerBtn) nodes.skillPickerBtn.setAttribute("aria-expanded", "true");
      hideDetailTooltip();
      return;
    }
    if (skillUI.active >= items.length) skillUI.active = 0;
    nodes.skillPickerList.innerHTML = items.map((s, i) => renderSkillRowButton(s, i)).join("");
    if (nodes.skillPickerBtn) nodes.skillPickerBtn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      if (!skillUI.open) return;
      alignDetailTooltipToActive();
    });
  }

  function openSkillPickerFromButton() {
    skillUI.fromSlash = false;
    skillUI.slashStart = -1;
    skillUI.buttonMode = true;
    skillUI.query = "";
    skillUI.open = true;
    skillUI.active = 0;
    nodes.skillPicker.hidden = false;
    if (nodes.skillPickerHint) nodes.skillPickerHint.hidden = true;
    renderSkillPickerList();
  }

  function tryOpenFromSlash() {
    const el = nodes.composerTextarea;
    const pos = el.selectionStart;
    const ctx = parseSlashContext(el.value, pos);
    if (!ctx) {
      if (skillUI.open && skillUI.fromSlash) {
        closeSkillPicker();
      }
      return;
    }
    skillUI.open = true;
    skillUI.fromSlash = true;
    skillUI.slashStart = ctx.start;
    skillUI.query = ctx.query;
    skillUI.buttonMode = false;
    nodes.skillPicker.hidden = false;
    if (nodes.skillPickerHint) nodes.skillPickerHint.hidden = false;
    renderSkillPickerList();
  }

  function closeSkillPicker() {
    skillUI.open = false;
    skillUI.fromSlash = false;
    skillUI.slashStart = -1;
    skillUI.buttonMode = false;
    skillUI.query = "";
    skillUI.active = 0;
    nodes.skillPicker.hidden = true;
    nodes.skillPickerList.innerHTML = "";
    if (nodes.skillPickerBtn) nodes.skillPickerBtn.setAttribute("aria-expanded", "false");
    if (nodes.skillPickerHint) nodes.skillPickerHint.hidden = true;
    hideDetailTooltip();
  }

  function applySkillInsert(skillId) {
    const el = nodes.composerTextarea;
    const val = el.value;
    const end = el.selectionEnd;
    const ins = `/${skillId} `;
    if (skillUI.fromSlash && skillUI.slashStart >= 0) {
      const start = skillUI.slashStart;
      const before = val.slice(0, start);
      const after = val.slice(end);
      el.value = before + ins + after;
      el.selectionStart = el.selectionEnd = (before + ins).length;
    } else if (skillUI.buttonMode) {
      const p = el.selectionStart;
      const a = val.slice(0, p);
      const b = val.slice(p);
      const gap = a.length > 0 && !/\s$/.test(a) ? " " : "";
      el.value = a + gap + ins + b;
      el.selectionStart = el.selectionEnd = a.length + gap.length + ins.length;
    } else {
      return;
    }
    closeSkillPicker();
    el.focus();
  }

  function hideDetailTooltip() {
    if (!nodes.skillHoverTip) return;
    nodes.skillHoverTip.hidden = true;
    const tipBody = nodes.skillHoverTip.querySelector(".skill-hover-tip-body");
    if (tipBody) tipBody.classList.remove("is-left");
  }

  function positionDetailTooltip(anchorEl) {
    if (!nodes.skillHoverTip || !nodes.skillHoverTipText || !anchorEl) {
      hideDetailTooltip();
      return;
    }
    const id = anchorEl.getAttribute("data-skill-id");
    const text = getSkillDescription(id);
    if (!text) {
      hideDetailTooltip();
      return;
    }
    const tip = nodes.skillHoverTip;
    const tipBody = tip.querySelector(".skill-hover-tip-body");
    if (!tipBody) return;
    nodes.skillHoverTipText.textContent = text;
    tipBody.classList.remove("is-left");
    tip.removeAttribute("hidden");
    tip.style.position = "fixed";
    tip.style.zIndex = "200";
    tip.style.left = "-9999px";
    tip.style.top = "0";
    const margin = 8;
    const pad = 4;
    const tw = tipBody.offsetWidth;
    const th = tipBody.offsetHeight;
    const r = anchorEl.getBoundingClientRect();
    let left = r.right + margin;
    if (left + tw + pad > window.innerWidth) {
      left = r.left - margin - tw;
      tipBody.classList.add("is-left");
    }
    if (left < pad) {
      left = Math.min(pad, window.innerWidth - tw - pad);
    }
    if (left + tw + pad > window.innerWidth) {
      left = Math.max(pad, window.innerWidth - tw - pad);
    }
    let top = r.top + (r.height - th) / 2;
    if (top < pad) {
      top = pad;
    }
    if (top + th + pad > window.innerHeight) {
      top = Math.max(pad, window.innerHeight - th - pad);
    }
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;
  }

  function alignDetailTooltipToActive() {
    const btn = nodes.skillPickerList?.querySelector(".skill-picker-item.is-active");
    if (btn) positionDetailTooltip(btn);
    else hideDetailTooltip();
  }

  function moveActive(delta) {
    const items = getVisibleSkills();
    if (!items.length) return;
    skillUI.active = (skillUI.active + delta + items.length) % items.length;
    renderSkillPickerList();
  }

  function initSkillPicker() {
    if (!nodes.composerTextarea || !nodes.skillPicker) return;

    const onSlash = () => {
      tryOpenFromSlash();
    };

    nodes.composerTextarea.addEventListener("input", onSlash);
    nodes.composerTextarea.addEventListener("click", () => setTimeout(onSlash, 0));
    nodes.composerTextarea.addEventListener("keyup", (e) => {
      if (e.key === "/" || e.key.length === 1) onSlash();
    });

    nodes.composerTextarea.addEventListener("keydown", (e) => {
      if (!skillUI.open) return;
      const list = getVisibleSkills();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (list.length) moveActive(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        if (list.length) moveActive(-1);
      } else if (e.key === "Enter" && !e.shiftKey) {
        if (list[skillUI.active]) {
          e.preventDefault();
          applySkillInsert(list[skillUI.active].id);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        closeSkillPicker();
      } else if (e.key === "Tab") {
        closeSkillPicker();
      }
    });

    nodes.skillPickerBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (skillUI.open && !skillUI.fromSlash) {
        closeSkillPicker();
        return;
      }
      if (skillUI.open && skillUI.fromSlash) {
        openSkillPickerFromButton();
        return;
      }
      openSkillPickerFromButton();
    });

    nodes.skillPickerList.addEventListener("mousedown", (e) => {
      const opt = e.target.closest("[data-skill-id]");
      if (opt) e.preventDefault();
    });

    nodes.skillPickerList.addEventListener("click", (e) => {
      const opt = e.target.closest("[data-skill-id]");
      if (!opt) return;
      e.stopPropagation();
      applySkillInsert(opt.getAttribute("data-skill-id"));
    });

    if (nodes.skillPickerScroll) {
      nodes.skillPickerScroll.addEventListener("mouseover", (e) => {
        const t = e.target.closest(".skill-picker-item");
        if (t) positionDetailTooltip(t);
      });
      nodes.skillPickerScroll.addEventListener("scroll", () => hideDetailTooltip());
    }
    if (nodes.skillPicker) {
      nodes.skillPicker.addEventListener("mouseleave", (e) => {
        const to = e.relatedTarget;
        if (to && typeof to.closest === "function" && to.closest("#skillPicker")) return;
        hideDetailTooltip();
      });
    }
    window.addEventListener("scroll", () => hideDetailTooltip(), true);

    document.addEventListener("mousedown", (e) => {
      if (!skillUI.open) return;
      if (e.target.closest("#skillPicker, #skillPickerBtn, #composerTextarea")) return;
      closeSkillPicker();
    });
  }

  function goTo(step) {
    stopTransitionTimer();
    stopClarifyAdvanceTimer();
    state.clarify.exitingStep = null;
    state.currentStep = clamp(step, 0, totalSteps);
    prepareRuntime();
    render();
    scheduleTransition();
  }

  function prev() {
    goTo(state.currentStep - 1);
  }

  function advance() {
    if (state.clarify.exitingStep) return;
    if (state.currentStep >= totalSteps) {
      return;
    }

    const current = steps[state.currentStep - 1];
    if (current?.hitl) {
      resolveHitl(current.hitl, "next");
      return;
    }

    goTo(state.currentStep + 1);
  }

  function resolveHitl(kind, source) {
    const current = steps[state.currentStep - 1];
    const clarifyItem = current?.items?.find((item) => item.kind === "clarify");
    if (clarifyItem?.questionKey && !state.answers[clarifyItem.questionKey]) {
      const fallback = clarifyItem.options?.[0]?.value || "default";
      state.answers[clarifyItem.questionKey] = fallback;
    }
    state.hitl[kind] = source || "default";
    goTo(state.currentStep + 1);
  }

  function handleHitlAction(action, choice) {
    if (state.clarify.exitingStep) return;
    switch (action) {
      case "clarify-answer": {
        const current = steps[state.currentStep - 1];
        const clarifyItem = current?.items?.find((item) => item.kind === "clarify");
        if (clarifyItem?.questionKey) {
          state.answers[clarifyItem.questionKey] = choice || clarifyItem.options?.[0]?.value || "custom";
        }
        state.hitl[current?.hitl || "clarify"] = choice || "default";
        queueClarifyAdvance(() => goTo(state.currentStep + 1));
        break;
      }
      case "allow-once":
      case "always-allow":
        state.hitl.permission = action;
        goTo(state.currentStep + 1);
        break;
      case "deny-permission":
        state.hitl.permission = action;
        render();
        break;
      case "retry":
        state.hitl.retry = "retry";
        goTo(state.currentStep + 1);
        break;
      case "skip":
        state.hitl.retry = "skip";
        render();
        break;
      case "confirm-destructive":
        {
          const current = steps[state.currentStep - 1];
          const destructiveItem = current?.items?.find((item) => item.status === "destructive");
          const advanceBy = destructiveItem?.confirmAdvanceSteps || 2;
          state.hitl.destructive = "confirmed";
          goTo(state.currentStep + advanceBy);
        }
        break;
      case "edit-destructive":
      case "cancel-destructive":
        state.hitl.destructive = action;
        render();
        break;
      default:
        break;
    }
  }

  function stopClarifyAdvanceTimer() {
    if (!timers.clarifyAdvance) return;
    window.clearTimeout(timers.clarifyAdvance);
    timers.clarifyAdvance = null;
  }

  function queueClarifyAdvance(onDone) {
    stopClarifyAdvanceTimer();
    state.clarify.exitingStep = state.currentStep;
    render();
    timers.clarifyAdvance = window.setTimeout(() => {
      timers.clarifyAdvance = null;
      state.clarify.exitingStep = null;
      onDone();
    }, CLARIFY_EXIT_DELAY_MS);
  }

  function getCurrentClarifyItem() {
    const current = steps[state.currentStep - 1];
    return current?.items?.find((item) => item.kind === "clarify") || null;
  }

  function isCustomAnswer(value) {
    return Boolean(value) && typeof value === "object" && value.type === "custom";
  }

  function getCustomAnswerText(questionKey) {
    const answer = state.answers[questionKey];
    return isCustomAnswer(answer) ? answer.text || "" : "";
  }

  function submitClarifyCustomAnswer() {
    if (state.clarify.exitingStep) return;
    const current = steps[state.currentStep - 1];
    const clarifyItem = getCurrentClarifyItem();
    if (!clarifyItem?.questionKey) return;
    const input = nodes.stream.querySelector("[data-clarify-custom-input]");
    const text = input?.value?.trim();
    if (!text) {
      input?.focus();
      return;
    }
    state.answers[clarifyItem.questionKey] = { type: "custom", text };
    state.hitl[current?.hitl || "clarify"] = "custom";
    queueClarifyAdvance(() => goTo(state.currentStep + 1));
  }

  function prepareRuntime() {
    Object.keys(state.runtime).forEach((key) => {
      if (Number(key) > state.currentStep) delete state.runtime[key];
    });

    steps.forEach((step) => {
      if (!step.autoSuccess) return;
      if (state.currentStep > step.id) {
        state.runtime[step.id] = "success";
      } else if (state.currentStep < step.id) {
        delete state.runtime[step.id];
      } else if (!state.runtime[step.id]) {
        state.runtime[step.id] = "running";
      }
    });
  }

  function scheduleTransition() {
    const step = steps[state.currentStep - 1];
    if (!step?.autoSuccess) return;
    if (state.runtime[step.id] === "success") return;

    timers.transition = window.setTimeout(() => {
      state.runtime[step.id] = "success";
      render();
    }, 1500);
  }

  function stopTransitionTimer() {
    if (timers.transition) {
      window.clearTimeout(timers.transition);
      timers.transition = null;
    }
  }

  function render() {
    renderNotices();
    renderRecentTasks();
    renderMessages();
    renderRightPanel();
    renderExecutionStrip();
    scrollStreamToBottom();
  }

  function renderNotices() {
    const notices = getNotices(state.currentStep);
    nodes.noticeStack.innerHTML = notices.map((notice) => {
      return `<div class="notice-banner ${notice.severity}">
        ${icon(notice.severity === "danger" ? "warning" : "info")}
        <span>${escapeHTML(notice.text)}</span>
      </div>`;
    }).join("");
  }

  function renderRecentTasks() {
    if (!nodes.recentTaskList) return;
    const pinned = state.sessions.filter((task) => task.pinned);
    const recents = state.sessions.filter((task) => !task.pinned);
    nodes.recentTaskList.innerHTML = [
      renderSessionGroup("Pinned", pinned, { empty: "Drag to pin", showPinHint: true }),
      renderSessionGroup("Recents", recents, { meta: recents.length ? `${recents.length}` : "" })
    ].join("");
    syncActiveSessionTitle();
  }

  function renderSessionGroup(title, tasks, options = {}) {
    return `<section class="session-group">
      <div class="session-group-header">
        <div class="session-group-title">
          ${options.showPinHint ? icon("pin") : ""}
          <span>${escapeHTML(title)}</span>
        </div>
        ${options.meta ? `<span class="session-group-meta">${escapeHTML(String(options.meta))}</span>` : ""}
      </div>
      ${tasks.length
        ? `<div class="session-list">${tasks.map((task) => renderSessionRow(task)).join("")}</div>`
        : `<div class="session-group-empty">${options.showPinHint ? icon("pin") : ""}<span>${escapeHTML(options.empty || "暂无会话")}</span></div>`}
    </section>`;
  }

  function renderSessionRow(task) {
    const renaming = state.renamingSessionId === task.id;
    const menuOpen = state.sessionMenuId === task.id;
    return `<div class="recent-card ${task.active ? "active" : ""} ${renaming ? "renaming" : ""}" data-session-row="${escapeAttr(task.id)}" data-menu-open="${menuOpen ? "true" : "false"}">
      <div class="recent-main">
        <span class="recent-status ${escapeAttr(task.status)}">${recentStatusIcon(task.status)}</span>
        <div class="recent-title-wrap">
          ${renaming
            ? `<input class="recent-rename-input" data-session-rename-input="${escapeAttr(task.id)}" value="${escapeAttr(state.renameDraft)}" maxlength="40" />`
            : `<span class="recent-title">${escapeHTML(task.title)}</span>`}
        </div>
      </div>
      <div class="recent-side">
        <button class="recent-menu-trigger" type="button" aria-label="会话操作" data-session-menu-trigger="${escapeAttr(task.id)}">
          ${icon("more")}
        </button>
      </div>
      ${menuOpen ? renderSessionMenu(task) : ""}
    </div>`;
  }

  function renderSessionMenu(task) {
    return `<div class="recent-menu">
      <button class="recent-menu-item" type="button" data-session-action="pin" data-session-id="${escapeAttr(task.id)}">
        ${icon("pin")}
        <span>${task.pinned ? "取消置顶" : "置顶"}</span>
      </button>
      <button class="recent-menu-item" type="button" data-session-action="rename" data-session-id="${escapeAttr(task.id)}">
        ${icon("edit")}
        <span>重命名</span>
      </button>
      <button class="recent-menu-item danger" type="button" data-session-action="delete" data-session-id="${escapeAttr(task.id)}">
        ${icon("trash")}
        <span>删除</span>
      </button>
    </div>`;
  }

  function renderMessages() {
    const html = getVisibleSteps().map((step) => renderStepItems(step)).join("");
    nodes.stream.innerHTML = html;
  }

  function getVisibleSteps() {
    return steps.slice(0, state.currentStep).filter((step) => {
      if (step.id < INTAKE_CLARIFY_START || step.id > INTAKE_CLARIFY_END) return true;
      return state.currentStep >= INTAKE_CLARIFY_START && state.currentStep <= INTAKE_CLARIFY_END
        ? step.id === state.currentStep
        : false;
    });
  }

  function renderStepItems(step) {
    if (step.id === 9 && state.currentStep >= 10) return "";

    return step.items.map((item) => {
      if (item.id === "tool-pending-001" && state.currentStep > 10) return "";
      if (item.id === "tool-erp-write-running" && state.currentStep >= 19) return "";
      if (item.id === "tool-erp-error" && state.currentStep >= 20) return "";
      if (item.id === "tool-oa-destructive" && state.currentStep >= 22) return "";
      if (item.id === "tool-docx-generate-running" && state.currentStep >= 25) return "";
      if (item.id === "tool-local-delete-destructive" && state.currentStep >= 30) return "";
      if (item.id === "artifacts-001" && state.currentStep >= 32) return "";
      return renderItem(item, step);
    }).join("");
  }

  function renderItem(item, step) {
    switch (item.kind) {
      case "user_message":
        return renderUserMessage(item);
      case "narration":
        return renderNarration(item);
      case "thinking":
        return renderThinking(item);
      case "skill_chip":
        return renderSkillChip(item);
      case "plan_card":
        return renderPlanCard(item);
      case "todo_list":
        return renderTodoList(item);
      case "tool_call":
        return renderToolCall(item, step);
      case "clarify":
        return renderClarify(item, step);
      case "clarify_summary":
        return renderClarifySummary(item);
      case "subagent_group":
        return renderSubagentGroup(item);
      case "final_summary":
        return renderFinalSummary(item);
      case "artifact_list":
        return renderArtifacts(item);
      default:
        return "";
    }
  }

  function renderUserMessage(item) {
    const attachments = Array.isArray(item.attachments) ? item.attachments : [];
    return `<div class="message-row user">
      <article class="user-message">
        ${attachments.length
          ? `<div class="attachment-row">
          ${attachments.map((file) => `<span class="attachment-pill">${icon("attach")}<span>${escapeHTML(file)}</span></span>`).join("")}
        </div>`
          : ""}
        <div class="message-text">${escapeHTML(item.text)}</div>
      </article>
    </div>`;
  }

  function renderNarration(item) {
    return `<div class="message-row">
      <div class="narration">
        ${icon("spark")}
        <span>${escapeHTML(item.text)}</span>
      </div>
    </div>`;
  }

  function renderThinking(item) {
    return `<div class="message-row">
      <details class="thinking">
        <summary>思考了 ${escapeHTML(String(item.duration))} 秒 ${icon("chevron")}</summary>
        <div class="thinking-content">${escapeHTML(item.content)}</div>
      </details>
    </div>`;
  }

  function formatJsonHighlighted(value, indent = 0) {
    const pad = (d) => "  ".repeat(d);
    if (value === null) return `<span class="json-lit">null</span>`;
    if (typeof value === "boolean") return `<span class="json-lit">${value ? "true" : "false"}</span>`;
    if (typeof value === "number") return `<span class="json-lit">${escapeHTML(String(value))}</span>`;
    if (typeof value === "string") return `<span class="json-str">${escapeHTML(JSON.stringify(value))}</span>`;
    if (Array.isArray(value)) {
      if (value.length === 0) return "[]";
      const inner = value
        .map((v) => `${pad(indent + 1)}${formatJsonHighlighted(v, indent + 1)}`)
        .join(",\n");
      return `[\n${inner}\n${pad(indent)}]`;
    }
    if (typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 0) return "{}";
      const inner = keys
        .map(
          (k) =>
            `${pad(indent + 1)}<span class="json-key">${escapeHTML(JSON.stringify(k))}</span>: ${formatJsonHighlighted(
              value[k],
              indent + 1
            )}`
        )
        .join(",\n");
      return `{\n${inner}\n${pad(indent)}}`;
    }
    return escapeHTML(String(value));
  }

  function renderSkillChip(item) {
    const req =
      item.request && typeof item.request === "object"
        ? item.request
        : { skill: item.annotation?.schema?.skill_id || "skill" };
    const resText =
      typeof item.response === "string"
        ? item.response
        : item.response != null
          ? formatJSON(item.response)
          : `Launching skill: ${typeof req.skill === "string" ? req.skill : formatJSON(req)}`;

    return `<div class="message-row">
      <article class="skill-call-card">
        <details class="skill-call-details">
          <summary class="skill-call-summary" aria-label="展开或收起请求与响应">
            <span class="skill-call-icon" aria-hidden="true">${icon("skill")}</span>
            <span class="skill-call-title">技能：${escapeHTML(item.skill)}</span>
            <span class="skill-call-summary-chev" aria-hidden="true">${icon("chevron")}</span>
          </summary>
          <div class="skill-call-panel">
            <div class="skill-call-block">
              <div class="skill-call-block-label">Request</div>
              <pre class="skill-call-pre skill-call-pre--json">${formatJsonHighlighted(req)}</pre>
            </div>
            <div class="skill-call-block">
              <div class="skill-call-block-label">Response</div>
              <pre class="skill-call-pre skill-call-pre--plain">${escapeHTML(resText)}</pre>
            </div>
          </div>
        </details>
      </article>
    </div>`;
  }

  function renderPlanCard(item) {
    return `<div class="message-row">
      <article class="plan-card">
        <div class="card-head">
          <h2 class="card-title">执行计划</h2>
          <span class="status-pill success">${escapeHTML(item.status || "已建立")}</span>
        </div>
        <ol class="plan-list">
          ${item.items.map((plan) => `<li>
            <div class="plan-line">
              <strong>${escapeHTML(plan.title)}</strong>
              <span>预计工具: ${escapeHTML(plan.tool)} · 预计耗时: ${escapeHTML(plan.eta)}</span>
            </div>
          </li>`).join("")}
        </ol>
      </article>
    </div>`;
  }

  function renderTodoList(item) {
    return `<div class="message-row">
      <article class="todo-card">
        <div class="card-head">
          <h2 class="card-title">任务推进</h2>
          <span class="status-pill success">执行中</span>
        </div>
        <div class="todo-list">
          ${item.items.map((todo, index) => renderTodoItem(todo, index)).join("")}
        </div>
      </article>
    </div>`;
  }

  function renderTodoItem(todo, index) {
    const status = getTodoStatus(index);
    const labels = { done: "已完成", in_progress: "进行中", pending: "待处理", blocked: "受阻" };
    return `<div class="todo-item ${status}">
      <span class="todo-check">${status === "done" ? icon("check") : ""}</span>
      <div class="todo-main">
        <strong>${escapeHTML(todo.title)}</strong>
        <span>${escapeHTML(todo.detail)}</span>
      </div>
      <span class="todo-state">${labels[status]}</span>
    </div>`;
  }

  function toolCallDetailsOpenByDefault(status) {
    if (status === "success_collapsed" || status === "pending") return false;
    return true;
  }

  function renderToolCall(item, step) {
    const status = normalizedToolStatus(item, step);
    const cssStatus = toolCssStatus(status);
    const body = renderToolBody(item, status);
    const title =
      typeof item.headline === "string" && item.headline.trim().length > 0
        ? item.headline.trim()
        : `${item.action} · ${item.target}`;

    const panelBody = body.trim()
      ? body
      : `<div class="tool-summary">暂无请求 / 响应记录。</div>`;
    const openAttr = toolCallDetailsOpenByDefault(status) ? " open" : "";

    return `<div class="message-row">
      <details class="tool-call tool-call-details category-${escapeHTML(item.category || "file")} ${cssStatus}"${openAttr}>
        <summary class="tool-call-head" aria-label="展开或收起请求与响应">
          <div class="tool-call-icon">${toolIcon(item)}</div>
          <div class="tool-call-title">
            <strong>${escapeHTML(title)}</strong>
          </div>
          <span class="tool-call-toggle" aria-hidden="true">${icon("chevron")}</span>
          ${renderStatusBadge(status)}
          <span class="tool-call-elapsed">${escapeHTML(item.elapsed || "")}</span>
        </summary>
        <div class="tool-call-io">
          <div class="skill-call-panel tool-call-io-panel">${panelBody}</div>
        </div>
      </details>
    </div>`;
  }

  function renderToolBody(item, status) {
    if (item.presentation === "local_file_create") {
      return renderLocalFileCreateBody(item, status);
    }
    if (item.presentation === "local_file_delete") {
      return renderLocalFileDeleteBody(item, status);
    }

    if (status === "success_collapsed" || status === "success_expanded") {
      return renderToolRequestResponse(item.args, item.output);
    }

    if (status === "pending") {
      const hasArgs = item.args && typeof item.args === "object" && Object.keys(item.args).length > 0;
      if (hasArgs) return renderToolRequestResponse(item.args, item.output ?? null);
      return `<div class="tool-summary">排队中,尚未开始执行。</div>`;
    }

    if (status === "running") {
      return `<div class="stream-box">
        ${(item.stream || []).map((line) => `<div class="stream-line">${escapeHTML(line)}</div>`).join("")}
        <div class="skeleton"></div>
        <div class="skeleton" style="width: 82%"></div>
        <div class="skeleton" style="width: 64%"></div>
      </div>`;
    }

    if (status === "needs_approval") {
      const permissionFeedback = item.feedbackMessages || {
        "deny-permission": "已拒绝连接器授权,当前流程暂停。"
      };
      return `<div class="tool-summary">${escapeHTML(item.summary)}</div>
        ${renderToolRequestResponse(item.args, null)}
        ${getHitlFeedback("permission", permissionFeedback)}
        <div class="hitl-actions tool-call-hitl-actions">
          <button class="primary-button" type="button" data-hitl-action="allow-once">允许一次</button>
          <button class="secondary-button" type="button" data-hitl-action="always-allow">本会话始终允许</button>
          <button class="danger-button" type="button" data-hitl-action="deny-permission">拒绝</button>
        </div>`;
    }

    if (status === "destructive") {
      const feedbackMessages = {
        "edit-destructive": "已暂停提交,可返回 ERP 草稿调整后再确认。",
        "cancel-destructive": "已取消本次提交确认,草稿仍保留。",
        ...(item.feedbackMessages || {})
      };
      return `<div class="tool-summary">${escapeHTML(item.summary)}</div>
        <ul class="destructive-line-list">
          ${(item.impact || []).map((line) => `<li>${escapeHTML(line)}</li>`).join("")}
        </ul>
        <div class="destructive-path-block">
          ${(item.paths || []).map((path) => `<div class="destructive-path-line">${escapeHTML(path)}</div>`).join("")}
        </div>
        ${getHitlFeedback("destructive", feedbackMessages)}
        <div class="hitl-actions tool-call-hitl-actions">
          <button class="danger-button" type="button" data-hitl-action="confirm-destructive">${escapeHTML(item.confirmLabel || "确认提交")}</button>
          ${item.showEdit === false ? "" : `<button class="secondary-button" type="button" data-hitl-action="edit-destructive">${escapeHTML(item.editLabel || "编辑")}</button>`}
          <button class="ghost-button" type="button" data-hitl-action="cancel-destructive">${escapeHTML(item.cancelLabel || "取消")}</button>
        </div>`;
    }

    if (status === "error") {
      if (item.autoRetry) {
        return `<div class="error-detail">
            <strong>${escapeHTML(item.summary)}</strong>
            <span>错误码: ${escapeHTML(item.output?.code || "UNKNOWN_ERROR")}</span>
          </div>
          <div class="tool-summary" style="margin-top: 10px">${escapeHTML(item.retryMessage || "系统已自动重试。")}</div>`;
      }
      return `<div class="error-detail">
          <strong>${escapeHTML(item.summary)}</strong>
          <span>错误码: ${escapeHTML(item.output?.code || "UNKNOWN_ERROR")}</span>
        </div>
        ${getHitlFeedback("retry", { skip: "已选择跳过失败步骤,建议仅用于非关键任务。" })}
        <div class="hitl-actions tool-call-hitl-actions">
          <button class="primary-button" type="button" data-hitl-action="retry">重试</button>
          <button class="ghost-button" type="button" data-hitl-action="skip">跳过</button>
        </div>`;
    }

    if (status === "cancelled") {
      return `<div class="tool-summary">用户已中断,保留部分结果。${escapeHTML(item.summary)}</div>`;
    }

    if (status === "computer_use") {
      return `<div class="computer-shot-grid">
          <div class="shot-box">
            <div class="shot-label">Before</div>
            <div class="fake-shot">
              <div class="fake-shot-line wide"></div>
              <div class="fake-shot-line mid"></div>
              <div class="fake-shot-line short"></div>
            </div>
          </div>
          <div class="shot-box">
            <div class="shot-label">After</div>
            <div class="fake-shot after">
              <div class="fake-shot-line wide"></div>
              <div class="fake-shot-line wide"></div>
              <div class="fake-shot-line mid"></div>
            </div>
          </div>
        </div>`;
    }

    return "";
  }

  function renderLocalFileCreateBody(item, status) {
    const fileName = item.output?.file_name || item.target || item.headline?.replace(/^已完成：|^正在创建：/, "") || "文件";
    if (status === "running") {
      return `<div class="local-file-box">
        <div class="local-file-line">${escapeHTML(item.headline || `正在创建：${fileName}`)}</div>
        <div class="local-file-meta">${escapeHTML(item.summary || "")}</div>
      </div>`;
    }

    if (status === "success_collapsed" || status === "success_expanded") {
      return `<div class="local-file-box">
        <div class="local-file-line">${escapeHTML(item.headline || `已完成：${fileName}`)}</div>
        <div class="local-file-meta">${escapeHTML(item.summary || "")}</div>
        ${item.output?.path ? `<div class="local-file-path">${escapeHTML(item.output.path)}</div>` : ""}
      </div>`;
    }

    return `<div class="local-file-box">
      <div class="local-file-line">${escapeHTML(item.headline || fileName)}</div>
      <div class="local-file-meta">${escapeHTML(item.summary || "")}</div>
    </div>`;
  }

  function renderLocalFileDeleteBody(item, status) {
    const fileName = item.output?.file_name || item.target || "文件";
    return `<div class="local-file-box">
      <div class="local-file-line">${escapeHTML(item.headline || `已删除：${fileName}`)}</div>
      <div class="local-file-meta">${escapeHTML(item.summary || "")}</div>
      ${item.output?.path ? `<div class="local-file-path">${escapeHTML(item.output.path)}</div>` : ""}
    </div>`;
  }

  function renderToolRequestResponse(args, output) {
    const blocks = [];
    blocks.push(`<div class="skill-call-block">
      <div class="skill-call-block-label">Request</div>
      <pre class="skill-call-pre skill-call-pre--json">${formatJsonHighlighted(args || {})}</pre>
    </div>`);
    if (output !== null && output !== undefined) {
      blocks.push(`<div class="skill-call-block">
        <div class="skill-call-block-label">Response</div>
        <pre class="skill-call-pre skill-call-pre--json">${formatJsonHighlighted(output)}</pre>
      </div>`);
    }
    return blocks.join("");
  }

  function renderStatusBadge(status) {
    const config = {
      pending: { label: "即将运行", cls: "", prefix: "›" },
      running: { label: "运行中", cls: "running", prefix: '<span class="spinner"></span>' },
      success_collapsed: { label: "成功", cls: "success", prefix: icon("check") },
      success_expanded: { label: "成功", cls: "success", prefix: icon("check") },
      needs_approval: { label: "需要授权", cls: "warning", prefix: icon("warning") },
      destructive: { label: "需确认", cls: "danger", prefix: icon("warning") },
      error: { label: "失败", cls: "danger", prefix: icon("x") },
      cancelled: { label: "已取消", cls: "", prefix: icon("x") },
      computer_use: { label: "桌面控制", cls: "warning", prefix: icon("mouse") }
    }[status] || { label: status, cls: "", prefix: "" };

    return `<span class="status-dot ${config.cls}">${config.prefix}<span>${config.label}</span></span>`;
  }

  function renderClarify(item, step) {
    const exiting = state.clarify.exitingStep === step.id;
    const currentAnswer = state.answers[item.questionKey];
    const selectedValue = isCustomAnswer(currentAnswer) ? "" : currentAnswer;
    const customValue = getCustomAnswerText(item.questionKey);
    return `<div class="message-row">
      <article class="clarify-card${exiting ? " is-exiting" : ""}">
        <div class="clarify-question">${escapeHTML(item.question)}</div>
        <div class="clarify-actions">
          ${item.options
            .map((option) => `<button
              type="button"
              class="clarify-option-button${selectedValue === option.value ? " is-selected" : ""}"
              data-hitl-action="clarify-answer"
              data-choice="${escapeAttr(option.value)}"
              ${exiting ? "disabled" : ""}
            >${escapeHTML(option.label)}</button>`)
            .join("")}
          ${item.freeInputLabel ? `<div class="clarify-custom-row">
            <input
              type="text"
              class="clarify-custom-input"
              data-clarify-custom-input
              placeholder="其他说明"
              aria-label="${escapeAttr(item.freeInputLabel)}"
              value="${escapeAttr(customValue)}"
              ${exiting ? "readonly" : ""}
            />
            <button
              type="button"
              class="clarify-custom-submit"
              data-hitl-action="clarify-custom-submit"
              ${exiting ? "disabled" : ""}
            >提交</button>
          </div>` : ""}
        </div>
      </article>
    </div>`;
  }

  function renderClarifySummary(item) {
    return `<div class="message-row">
      <article class="clarify-summary-card">
        <div class="clarify-summary-list">
          ${item.entries.map((entry) => {
            const answer = resolveAnswerLabel(entry);
            return `<div class="clarify-summary-item">
              <strong>${escapeHTML(entry.question)}</strong>
              <span>${escapeHTML(answer)}</span>
            </div>`;
          }).join("")}
        </div>
      </article>
    </div>`;
  }

  function normalizeSubagentTasks(item) {
    if (Array.isArray(item.tasks) && item.tasks.length) return item.tasks;
    if (!Array.isArray(item.agents)) return [];
    return item.agents.map((agent) => ({
      title: agent.name,
      detail: agent.text,
      status: agent.status === "success" ? "success" : agent.status === "running" ? "running" : "pending",
      elapsed: agent.elapsed
    }));
  }

  function renderSubagentTaskStatus(status) {
    if (status === "success") {
      return `<span class="multiagent-task-status multiagent-task-status--done">${icon("check")}<span>已完成</span></span>`;
    }
    if (status === "running") {
      return `<span class="multiagent-task-status multiagent-task-status--run"><span class="spinner" aria-hidden="true"></span><span>进行中</span></span>`;
    }
    return `<span class="multiagent-task-status multiagent-task-status--pending"><span>待开始</span></span>`;
  }

  function renderSubagentGroup(item) {
    const tasks = normalizeSubagentTasks(item);
    const principalName = escapeHTML(item.principalAgent || "子代理");
    const principalAct = escapeHTML(item.principalAction || item.title || "并行执行任务");
    const taskRows = tasks
      .map(
        (task) => `<li class="multiagent-task">
        <div class="multiagent-task-main">
          <span class="multiagent-task-title">${escapeHTML(task.title)}</span>
          ${task.detail ? `<span class="multiagent-task-detail">${escapeHTML(task.detail)}</span>` : ""}
        </div>
        <div class="multiagent-task-meta">
          ${renderSubagentTaskStatus(task.status || "pending")}
          ${task.elapsed ? `<span class="multiagent-task-elapsed">${escapeHTML(task.elapsed)}</span>` : ""}
        </div>
      </li>`
      )
      .join("");

    return `<div class="message-row">
      <div class="multiagent-block">
        <div class="multiagent-principal">
          <span class="multiagent-principal-icon" aria-hidden="true">${icon("multiagent")}</span>
          <p class="multiagent-principal-text">并行启用子代理 <strong>${principalName}</strong>（${principalAct}）</p>
        </div>
        <ul class="multiagent-task-list">${taskRows}</ul>
      </div>
    </div>`;
  }

  function renderFinalSummary(item) {
    return `<div class="message-row">
      <article class="final-summary">
        <p>${escapeHTML(item.text)}</p>
        <div class="metric-grid">
          ${item.metrics.map((metric) => `<div class="metric-card">
            <span>${escapeHTML(metric.label)}</span>
            <strong>${escapeHTML(metric.value)}</strong>
          </div>`).join("")}
        </div>
      </article>
    </div>`;
  }

  function renderArtifacts(item) {
    return `<div class="message-row">
      <article class="artifact-list-card">
        ${item.artifacts.map((artifact) => `<div class="artifact-row">
          <div class="artifact-icon">${icon("file")}</div>
          <div class="artifact-meta">
            <strong>${escapeHTML(artifact.name)}</strong>
            <span>${escapeHTML(artifact.path)} · ${escapeHTML(artifact.size)}</span>
          </div>
          <div class="artifact-actions">
            <button type="button" title="预览">${icon("eye")}</button>
            <button type="button" title="下载">${icon("download")}</button>
            <button type="button" title="推送到云盘">${icon("cloud")}</button>
            <button type="button" title="分享">${icon("share")}</button>
          </div>
        </div>`).join("")}
      </article>
    </div>`;
  }

  function renderRightPanel() {
    renderProgressPanel();
    renderFilePanel();
    renderContextPanel();
  }

  function renderProgressPanel() {
    const statuses = todoItems.map((_, index) => getTodoStatus(index));
    const done = statuses.filter((status) => status === "done").length;
    nodes.progressCount.textContent = `${done}/${todoItems.length}`;
    nodes.progressList.innerHTML = todoItems.map((item, index) => {
      const status = statuses[index];
      const labels = { done: "已完成", in_progress: "进行中", pending: "待处理", blocked: "等待确认" };
      return `<div class="progress-panel-item ${status}">
        <span class="panel-status">${status === "done" ? icon("check") : ""}</span>
        <div>
          <strong>${escapeHTML(item.title)}</strong>
          <span>${labels[status]}</span>
        </div>
      </div>`;
    }).join("");
  }

  function renderFilePanel() {
    const files = [];
    const draftCreated = state.currentStep > 15 || state.runtime[15] === "success";
    const localDraftDeleted = state.currentStep >= 32;
    if (state.currentStep >= 1) {
      files.push(
        { name: "上海机票行程单.pdf", meta: "输入附件 · PDF" },
        { name: "酒店发票.jpg", meta: "输入附件 · 图片" },
        { name: "打车发票-03-18.png", meta: "输入附件 · 图片" }
      );
    }
    if (draftCreated) files.push({ name: "BX-DRAFT-7781", meta: "ERP 草稿" });
    if (state.currentStep >= 25 && !localDraftDeleted) files.push({ name: draftDocumentArtifact.name, meta: `产物 · ${draftDocumentArtifact.size}` });
    if (state.currentStep >= 27) artifacts.slice(1).forEach((artifact) => files.push({ name: artifact.name, meta: `产物 · ${artifact.size}` }));

    nodes.fileCount.textContent = String(files.length);
    nodes.fileList.innerHTML = files.length
      ? files.map((file) => `<div class="file-item">${icon("file")}<div><strong>${escapeHTML(file.name)}</strong><span>${escapeHTML(file.meta)}</span></div></div>`).join("")
      : `<div class="panel-empty">暂无文件</div>`;
  }

  function renderContextPanel() {
    const contexts = [];
    const draftCreated = state.currentStep > 15 || state.runtime[15] === "success";
    if (state.currentStep >= 8) contexts.push({ icon: "skill", name: "技能: 差旅报销", meta: "已载入" });
    if (state.currentStep >= 11) contexts.push({ icon: "file", name: "File Read", meta: "机票行程单字段" });
    if (state.currentStep >= 12) contexts.push({ icon: "doc", name: "OCR 识别", meta: "酒店与打车票据" });
    if (state.currentStep >= 15) {
      contexts.push({ icon: "globe", name: "ERP 连接器", meta: draftCreated ? "草稿创建完成" : "正在创建草稿" });
    }
    if (state.currentStep >= 16) contexts.push({ icon: "branch", name: "子任务结果", meta: "组织信息与差旅标准" });
    if (state.currentStep >= 17) contexts.push({ icon: "globe", name: "ERP 写入授权", meta: "等待或完成授权" });
    if (state.currentStep >= 22) contexts.push({ icon: "globe", name: "OA 审批", meta: "提交成功" });
    if (state.currentStep >= 24) contexts.push({ icon: "doc", name: "本地文档生成", meta: state.currentStep >= 32 ? "草稿已删除" : "差旅申请草稿.docx" });
    if (state.currentStep >= 29) contexts.push({ icon: "file", name: "破坏性确认", meta: state.currentStep >= 30 ? "本地文件删除完成" : "等待删除确认" });

    nodes.contextCount.textContent = String(contexts.length);
    nodes.contextList.innerHTML = contexts.length
      ? contexts.map((item) => `<div class="context-item">${icon(item.icon)}<div><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.meta)}</span></div></div>`).join("")
      : `<div class="panel-empty">暂无工具</div>`;
  }

  function renderExecutionStrip() {
    const step = steps[state.currentStep - 1];
    const isRunningTransition = step?.autoSuccess && state.runtime[step.id] === "running";
    const hasRunningTool = step?.items?.some((item) => item.kind === "tool_call" && normalizedToolStatus(item, step) === "running");
    nodes.executionStrip.classList.toggle("active", Boolean(isRunningTransition || hasRunningTool));
  }

  function getTodoStatus(index) {
    const step = state.currentStep;
    if (step < 10) return "pending";

    if (index === 0) {
      if (step >= 13) return "done";
      return "in_progress";
    }
    if (index === 1) {
      if (step >= 14) return "done";
      if (step >= 11) return "in_progress";
      return "pending";
    }
    if (index === 2) {
      if (step >= 20) return "done";
      if (step === 17 || step === 19) return "blocked";
      if (step >= 15) return "in_progress";
      return "pending";
    }
    if (index === 3) {
      if (step >= 16) return "done";
      return "pending";
    }
    if (index === 4) {
      if (step >= 25) return "done";
      if (step >= 21) return "in_progress";
      return "pending";
    }
    return "pending";
  }

  function getNotices(step) {
    const notices = [];
    if (step >= 19 && step <= 20) {
      notices.push({
        id: "network-pause",
        label: "NOTICE[network]",
        severity: "danger",
        triggerStep: 19,
        text: "连接不稳,已暂停 · 重试"
      });
    }
    if (step >= 26) {
      notices.push({
        id: "usage-limit",
        label: "NOTICE[quota]",
        severity: "danger",
        triggerStep: 26,
        text: "本月用量接近上限 · 升级"
      });
    }
    return notices;
  }

  function normalizedToolStatus(item, step) {
    if (item.status !== "running_to_success") return item.status;
    if (state.currentStep > step.id || state.runtime[step.id] === "success") return "success_expanded";
    return "running";
  }

  function toolCssStatus(status) {
    if (status === "success_collapsed" || status === "success_expanded") return "success";
    return status;
  }

  function getHitlFeedback(kind, messages) {
    const key = state.hitl[kind];
    if (!key || !messages[key]) return "";
    return `<div class="tool-summary" style="margin-top: 10px">${escapeHTML(messages[key])}</div>`;
  }

  function toolIcon(item) {
    if (item.category === "connector") {
      const label = item.connector || "MCP";
      return `<span>${escapeHTML(label.slice(0, 3))}</span>`;
    }
    const map = {
      shell: "terminal",
      file: "file",
      web: "globe",
      code: "code",
      doc: "doc",
      subagent: "branch",
      computer: "mouse"
    };
    return icon(map[item.category] || "file");
  }

  function icon(name) {
    return `<svg aria-hidden="true"><use href="#icon-${escapeAttr(name)}"></use></svg>`;
  }

  function recentStatusIcon(status) {
    const map = {
      idle: "",
      running: "",
      awaiting: icon("clock"),
      completed: icon("check"),
      error: icon("warning")
    };
    return map[status] || "";
  }

  function resolveAnswerLabel(entry) {
    const raw = state.answers[entry.answerKey];
    if (isCustomAnswer(raw)) {
      return raw.text || entry.customLabel || "用户自定义输入";
    }
    const resolved = raw || entry.fallbackValue || "";
    const option = entry.options?.find((item) => item.value === resolved);
    return option?.summary || option?.label || resolved;
  }

  function formatJSON(value) {
    return JSON.stringify(value, null, 2);
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function escapeAttr(value) {
    return escapeHTML(value).replaceAll("`", "&#96;");
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function scrollStreamToBottom() {
    window.requestAnimationFrame(() => {
      nodes.stream.scrollTop = nodes.stream.scrollHeight;
    });
  }

  function toggleSessionMenu(id) {
    if (state.renamingSessionId && state.renamingSessionId !== id) {
      commitSessionRename(state.renamingSessionId);
    }
    state.sessionMenuId = state.sessionMenuId === id ? null : id;
    renderRecentTasks();
  }

  function closeSessionMenu(shouldRender = true) {
    if (!state.sessionMenuId) return;
    state.sessionMenuId = null;
    if (shouldRender) renderRecentTasks();
  }

  function handleSessionAction(action, id) {
    const task = findSession(id);
    if (!task) return;

    if (action === "pin") {
      task.pinned = !task.pinned;
      state.sessionMenuId = null;
      renderRecentTasks();
      return;
    }

    if (action === "rename") {
      state.sessionMenuId = null;
      state.renamingSessionId = id;
      state.renameDraft = task.title;
      renderRecentTasks();
      focusRenameInput(id);
      return;
    }

    if (action === "delete") {
      deleteSession(id);
    }
  }

  function focusRenameInput(id) {
    window.requestAnimationFrame(() => {
      const input = nodes.recentTaskList.querySelector(`[data-session-rename-input="${id}"]`);
      if (!input) return;
      input.focus();
      input.select();
    });
  }

  function commitSessionRename(id) {
    const task = findSession(id);
    if (!task) {
      cancelSessionRename();
      return;
    }
    const nextTitle = state.renameDraft.trim();
    if (nextTitle) task.title = nextTitle;
    state.renamingSessionId = null;
    state.renameDraft = "";
    renderRecentTasks();
  }

  function cancelSessionRename() {
    if (!state.renamingSessionId && !state.renameDraft) return;
    state.renamingSessionId = null;
    state.renameDraft = "";
    renderRecentTasks();
  }

  function deleteSession(id) {
    const wasActive = state.sessions.some((task) => task.id === id && task.active);
    state.sessions = state.sessions.filter((task) => task.id !== id);
    state.sessionMenuId = null;
    state.renamingSessionId = null;
    state.renameDraft = "";
    if (wasActive && state.sessions.length) {
      state.sessions.forEach((task, index) => {
        task.active = index === 0;
      });
    }
    renderRecentTasks();
  }

  function setActiveSession(id) {
    let changed = false;
    state.sessions.forEach((task) => {
      const nextActive = task.id === id;
      if (task.active !== nextActive) changed = true;
      task.active = nextActive;
    });
    if (changed) renderRecentTasks();
  }

  function syncActiveSessionTitle() {
    if (!nodes.sessionTitle) return;
    const active = state.sessions.find((task) => task.active);
    if (active) nodes.sessionTitle.textContent = active.title;
  }

  function findSession(id) {
    return state.sessions.find((task) => task.id === id) || null;
  }

  init();
})();
