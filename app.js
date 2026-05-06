(() => {
  const {
    steps,
    todoItems,
    artifacts,
    draftDocumentArtifact,
    recentTasks,
    enterpriseAgentCategoryTabs: rawEnterpriseAgentCategoryTabs,
    enterpriseAgents: rawEnterpriseAgents,
    enterpriseFlowPresets: rawEnterpriseFlowPresets
  } = window.DEMO_DATA;
  const enterpriseAgentCategoryTabs = Array.isArray(rawEnterpriseAgentCategoryTabs) ? rawEnterpriseAgentCategoryTabs : [];
  const enterpriseAgents = Array.isArray(rawEnterpriseAgents) ? rawEnterpriseAgents : [];
  const enterpriseFlowPresets =
    rawEnterpriseFlowPresets && typeof rawEnterpriseFlowPresets === "object"
      ? rawEnterpriseFlowPresets
      : {
          default: {
            defaultQuery: "",
            recentTaskTitle: "企业级智能体任务",
            planningText: "正在准备执行。",
            planItems: [],
            stages: [],
            artifacts: [],
            finalMessage: "执行完成。"
          }
        };
  const totalSteps = steps.length;
  const INTAKE_CLARIFY_START = 2;
  const INTAKE_CLARIFY_END = 4;
  const CLARIFY_EXIT_DELAY_MS = 220;
  const ENTERPRISE_RUN_INTERVAL_MS = 900;
  const DEFAULT_RECENTS_VISIBLE = 4;
  const DEFAULT_HEADER = {
    title: "上海出差报销申请",
    subtitle: "会话 ID: sess-expense-20260423 · 项目: 企业差旅运营"
  };
  const SHELL_SIDEBAR_WIDTH = 240;
  const SHELL_RESIZER_WIDTH = 10;
  const DEFAULT_RIGHT_PANEL_WIDTH = 408;
  const MIN_RIGHT_PANEL_WIDTH = 280;
  const MIN_MAIN_AREA_WIDTH = 560;
  const DEFAULT_MARKDOWN_DRAFT = `# BX-DRAFT-7781

## 报销概览

- 申请人：王敏
- 出差城市：上海
- 出差日期：2026-03-18 至 2026-03-20
- 报销单号：BX20260423001

## 费用明细

1. 机票：¥1,860
2. 酒店：¥1,428
3. 打车：¥559

## 审批备注

已完成票据解析、住宿发票核验与 ERP 草稿写入，等待提交 OA 审批。

> 下一步：确认审批流和归档附件目录。`;

  const state = {
    route: "chat",
    chatMode: "expense",
    currentStep: 0,
    sessions: recentTasks.map((task) => ({ ...task })),
    automationSidebar: {
      initialized: false,
      expandedTaskIds: [],
      activeTaskId: "",
      activeRunId: ""
    },
    enterprise: {
      query: "",
      category: "all",
      draftAgentId: "",
      activeSessionId: ""
    },
    enterpriseSessions: {},
    sessionMenuId: null,
    renamingSessionId: null,
    renameDraft: "",
    answers: {},
    runtime: {},
    hitl: {},
    clarify: {
      exitingStep: null
    },
    panel: {
      width: DEFAULT_RIGHT_PANEL_WIDTH,
      activeTab: "overview",
      selectedFileId: "",
      markdownMode: "preview",
      resizing: false,
      resizeStartX: 0,
      resizeStartWidth: DEFAULT_RIGHT_PANEL_WIDTH
    },
    ui: {
      composerProgressCollapsed: false,
      workflowPaused: false,
      recentsExpanded: false
    },
    runtimeSend: {
      mode: "queue",
      menuOpen: false,
      queue: [],
      executed: [],
      steers: [],
      editingQueueId: "",
      editDraft: "",
      queueMenuId: ""
    },
    previewDrafts: {
      "bx-draft-7781-md": DEFAULT_MARKDOWN_DRAFT
    }
  };

  const timers = {
    transition: null,
    clarifyAdvance: null,
    enterpriseRun: null
  };

  const nodes = {
    body: document.body,
    appShell: document.getElementById("appShell"),
    stream: document.getElementById("messageStream"),
    noticeStack: document.getElementById("noticeStack"),
    sessionTitle: document.getElementById("sessionTitle"),
    sessionSubtitle: document.getElementById("sessionSubtitle"),
    navList: document.getElementById("navList"),
    recentTaskList: document.getElementById("recentTaskList"),
    composerProgressDock: document.getElementById("composerProgressDock"),
    composerProgressToggle: document.getElementById("composerProgressToggle"),
    composerProgressBody: document.getElementById("composerProgressBody"),
    composerProgressList: document.getElementById("composerProgressList"),
    composerProgressSummary: document.getElementById("composerProgressSummary"),
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
    skillPickerBtn: document.getElementById("skillPickerBtn"),
    composerCard: document.getElementById("composerCard"),
    runtimeQueueDock: document.getElementById("runtimeQueueDock"),
    sendModeWrap: document.getElementById("sendModeWrap"),
    sendModeButton: document.getElementById("sendModeButton"),
    sendModeMenu: document.getElementById("sendModeMenu"),
    sendModeLabel: document.getElementById("sendModeLabel"),
    rightPanel: document.getElementById("rightPanel"),
    rightPanelTabs: document.getElementById("rightPanelTabs"),
    overviewSection: document.getElementById("overviewSection"),
    previewSection: document.getElementById("previewSection"),
    previewPaneHead: document.getElementById("previewPaneHead"),
    previewToolbar: document.getElementById("previewToolbar"),
    previewBody: document.getElementById("previewBody"),
    previewMeta: document.getElementById("previewMeta"),
    panelResizer: document.getElementById("panelResizer"),
    sendButton: document.getElementById("composerSendButton")
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
    hydrateRouteFromHash();
    if (window.AutomationTasksModule?.init) {
      window.AutomationTasksModule.init({ container: nodes.stream });
    }
    syncAutomationSidebarState();
    bindEvents();
    initPanelResizer();
    initSkillPicker();
    window.__routeTo = (route) => navigate(route);
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("automation-tasks:updated", handleAutomationTasksUpdated);
    render();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const routeButton = event.target.closest("[data-route]");
      if (!routeButton) return;
      event.preventDefault();
      navigate(routeButton.getAttribute("data-route"));
    }, true);

    if (nodes.runtimeQueueDock) {
      nodes.runtimeQueueDock.addEventListener("click", (event) => {
        const runtimeAction = event.target.closest("[data-runtime-action]");
        if (!runtimeAction) return;
        event.preventDefault();
        handleRuntimeQueueAction(runtimeAction.getAttribute("data-runtime-action"), runtimeAction.getAttribute("data-runtime-message-id"));
      });

      nodes.runtimeQueueDock.addEventListener("input", (event) => {
        const queueEdit = event.target.closest("[data-runtime-queue-edit]");
        if (!queueEdit) return;
        state.runtimeSend.editDraft = queueEdit.value;
      });

      nodes.runtimeQueueDock.addEventListener("keydown", (event) => {
        const queueEdit = event.target.closest("[data-runtime-queue-edit]");
        if (!queueEdit) return;
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          saveRuntimeQueueEdit(queueEdit.getAttribute("data-runtime-queue-edit"));
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          cancelRuntimeQueueEdit();
        }
      });
    }

    nodes.stream.addEventListener("click", (event) => {
      const runtimeAction = event.target.closest("[data-runtime-action]");
      if (runtimeAction) {
        event.preventDefault();
        handleRuntimeQueueAction(runtimeAction.getAttribute("data-runtime-action"), runtimeAction.getAttribute("data-runtime-message-id"));
        return;
      }

      const enterpriseTab = event.target.closest("[data-agent-tab]");
      if (enterpriseTab) {
        event.preventDefault();
        state.enterprise.category = enterpriseTab.getAttribute("data-agent-tab") || "all";
        render();
        return;
      }

      const enterpriseChat = event.target.closest("[data-enterprise-chat]");
      if (enterpriseChat) {
        event.preventDefault();
        openEnterpriseDraft(enterpriseChat.getAttribute("data-enterprise-chat"));
        return;
      }

      const enterprisePrompt = event.target.closest("[data-enterprise-prompt]");
      if (enterprisePrompt) {
        event.preventDefault();
        const prompt = enterprisePrompt.getAttribute("data-enterprise-prompt") || "";
        nodes.composerTextarea.value = prompt;
        nodes.composerTextarea.focus();
        syncEnterpriseDraftQueryFromComposer();
        return;
      }

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

    nodes.stream.addEventListener("input", (event) => {
      const queueEdit = event.target.closest("[data-runtime-queue-edit]");
      if (queueEdit) {
        state.runtimeSend.editDraft = queueEdit.value;
        return;
      }

      const searchInput = event.target.closest("[data-agent-search]");
      if (searchInput) {
        state.enterprise.query = searchInput.value || "";
        render();
      }
    });

    nodes.stream.addEventListener("keydown", (event) => {
      const queueEdit = event.target.closest("[data-runtime-queue-edit]");
      if (queueEdit) {
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
          event.preventDefault();
          saveRuntimeQueueEdit(queueEdit.getAttribute("data-runtime-queue-edit"));
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          cancelRuntimeQueueEdit();
          return;
        }
      }

      const clarifyInput = event.target.closest("[data-clarify-custom-input]");
      if (!clarifyInput) return;
      if (event.key !== "Enter") return;
      event.preventDefault();
      submitClarifyCustomAnswer();
    });

    nodes.recentTaskList.addEventListener("click", (event) => {
      const groupToggle = event.target.closest("[data-session-group-toggle]");
      if (groupToggle) {
        event.preventDefault();
        event.stopPropagation();
        toggleSessionGroup(groupToggle.getAttribute("data-session-group-toggle"));
        return;
      }

      const automationToggle = event.target.closest("[data-automation-task-toggle]");
      if (automationToggle) {
        event.preventDefault();
        event.stopPropagation();
        toggleAutomationSidebarTask(automationToggle.getAttribute("data-automation-task-toggle"));
        return;
      }

      const automationRun = event.target.closest("[data-automation-run-row]");
      if (automationRun) {
        event.preventDefault();
        event.stopPropagation();
        openAutomationRun(
          automationRun.getAttribute("data-automation-task-id"),
          automationRun.getAttribute("data-automation-run-row")
        );
        return;
      }

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

    if (nodes.navList) {
      nodes.navList.addEventListener("click", (event) => {
        const navItem = event.target.closest("[data-route]");
        if (!navItem) return;
        event.preventDefault();
        navigate(navItem.getAttribute("data-route"));
      });
    }

    if (nodes.sendButton) {
      nodes.sendButton.addEventListener("click", (event) => {
        event.preventDefault();
        if (canSubmitRuntimeMessage()) {
          handleRuntimeComposerSubmit();
          return;
        }
        if (shouldShowComposerPauseButton()) {
          pauseComposerWorkflow();
          render();
          return;
        }
        handleComposerSubmit();
      });
    }

    if (nodes.sendModeButton) {
      nodes.sendModeButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!canShowRuntimeSendControls()) return;
        state.runtimeSend.menuOpen = !state.runtimeSend.menuOpen;
        renderRuntimeSendControls();
      });
    }

    if (nodes.sendModeMenu) {
      nodes.sendModeMenu.addEventListener("click", (event) => {
        const modeButton = event.target.closest("[data-runtime-send-mode]");
        if (!modeButton) return;
        event.preventDefault();
        state.runtimeSend.mode = modeButton.getAttribute("data-runtime-send-mode") === "steer" ? "steer" : "queue";
        state.runtimeSend.menuOpen = false;
        renderRuntimeSendControls();
        updateComposerSendButton();
        nodes.composerTextarea.focus();
      });
    }

    if (nodes.composerProgressToggle) {
      nodes.composerProgressToggle.addEventListener("click", (event) => {
        event.preventDefault();
        state.ui.composerProgressCollapsed = !state.ui.composerProgressCollapsed;
        renderComposerProgressDock();
      });
    }

    if (nodes.fileList) {
      nodes.fileList.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-preview-file]");
        if (!trigger) return;
        state.panel.selectedFileId = trigger.getAttribute("data-preview-file") || "";
        state.panel.activeTab = "preview";
        renderRightPanel();
      });
    }

    if (nodes.rightPanelTabs) {
      nodes.rightPanelTabs.addEventListener("click", (event) => {
        const tab = event.target.closest("[data-panel-tab]");
        if (!tab) return;
        const nextTab = tab.getAttribute("data-panel-tab");
        if (nextTab === "overview") {
          state.panel.activeTab = "overview";
        } else if (nextTab === "preview" && state.panel.selectedFileId) {
          state.panel.activeTab = "preview";
        }
        renderRightPanel();
      });
    }

    if (nodes.previewToolbar) {
      nodes.previewToolbar.addEventListener("click", (event) => {
        const modeButton = event.target.closest("[data-markdown-mode]");
        if (!modeButton) return;
        state.panel.markdownMode = modeButton.getAttribute("data-markdown-mode") || "preview";
        renderPreviewPanel();
      });
    }

    if (nodes.previewBody) {
      nodes.previewBody.addEventListener("input", (event) => {
        const editor = event.target.closest("[data-markdown-editor]");
        if (!editor) return;
        if (!state.panel.selectedFileId) return;
        state.previewDrafts[state.panel.selectedFileId] = editor.value;
      });
    }

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

    document.addEventListener("mousedown", (event) => {
      if (!state.runtimeSend.menuOpen) return;
      if (event.target.closest("#sendModeWrap")) return;
      state.runtimeSend.menuOpen = false;
      renderRuntimeSendControls();
    });

    document.addEventListener("mousedown", (event) => {
      if (!state.runtimeSend.queueMenuId) return;
      if (event.target.closest("#runtimeQueueDock")) return;
      state.runtimeSend.queueMenuId = "";
      renderRuntimeQueueDock();
    });

    nodes.composerTextarea.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" || event.shiftKey) return;
      if (skillUI.open) return;
      if (canSubmitRuntimeMessage()) {
        event.preventDefault();
        handleRuntimeComposerSubmit();
        return;
      }
      if (shouldShowComposerPauseButton()) {
        event.preventDefault();
        pauseComposerWorkflow();
        render();
        return;
      }
      if (shouldDisableComposerSendButton()) {
        event.preventDefault();
        return;
      }
      if (!canSubmitEnterpriseChat()) return;
      event.preventDefault();
      handleComposerSubmit();
    });

    nodes.composerTextarea.addEventListener("input", () => {
      syncEnterpriseDraftQueryFromComposer();
      updateComposerSendButton();
    });
  }

  function initPanelResizer() {
    if (!nodes.panelResizer) return;
    nodes.panelResizer.addEventListener("mousedown", startPanelResize);
    nodes.panelResizer.addEventListener("keydown", (event) => {
      if (state.route === "agents") return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setRightPanelWidth(state.panel.width + 24);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        setRightPanelWidth(state.panel.width - 24);
      }
    });
    window.addEventListener("mousemove", handlePanelResize);
    window.addEventListener("mouseup", stopPanelResize);
    window.addEventListener("mouseleave", stopPanelResize);
  }

  function startPanelResize(event) {
    if (state.route === "agents") return;
    event.preventDefault();
    state.panel.resizing = true;
    state.panel.resizeStartX = event.clientX;
    state.panel.resizeStartWidth = state.panel.width;
    nodes.body.classList.add("is-panel-resizing");
  }

  function handlePanelResize(event) {
    if (!state.panel.resizing) return;
    const delta = state.panel.resizeStartX - event.clientX;
    setRightPanelWidth(state.panel.resizeStartWidth + delta);
  }

  function stopPanelResize() {
    if (!state.panel.resizing) return;
    state.panel.resizing = false;
    nodes.body.classList.remove("is-panel-resizing");
  }

  function setRightPanelWidth(width) {
    const shellWidth = nodes.appShell?.clientWidth || window.innerWidth;
    const maxWidth = shellWidth - SHELL_SIDEBAR_WIDTH - SHELL_RESIZER_WIDTH - MIN_MAIN_AREA_WIDTH;
    const safeMax = Math.max(MIN_RIGHT_PANEL_WIDTH, maxWidth);
    state.panel.width = clamp(Math.round(width), Math.min(MIN_RIGHT_PANEL_WIDTH, safeMax), safeMax);
    syncShell();
  }

  function hydrateRouteFromHash() {
    const hash = String(window.location.hash || "").replace(/^#/, "").trim();
    if (hash === "agents") {
      state.route = "agents";
    } else if (hash === "automation") {
      state.route = "automation";
    } else {
      state.route = "chat";
    }
  }

  function handleHashChange() {
    hydrateRouteFromHash();
    render();
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

  function navigate(route) {
    const nextRoute = route === "agents" ? "agents" : route === "automation" ? "automation" : "chat";
    if (window.location.hash !== `#${nextRoute}`) {
      window.location.hash = nextRoute;
    }
    state.route = nextRoute;
    if (state.route === "agents" || state.route === "automation") {
      stopEnterpriseRunTimer();
      render();
      return;
    }

    const active = getActiveSession();
    if (active?.kind === "enterprise") {
      state.chatMode = "enterprise_session";
      state.enterprise.activeSessionId = active.id;
      const session = getEnterpriseSession(active.id);
      if (session) {
        nodes.composerTextarea.value = "";
        if (session.status === "running" && session.phase < 6) {
          startEnterpriseRun(active.id);
        }
      }
    } else if (state.enterprise.draftAgentId) {
      state.chatMode = "enterprise_draft";
      const draftAgent = getEnterpriseDraftAgent();
      nodes.composerTextarea.value = state.enterprise.query || getDefaultEnterprisePrompt(draftAgent);
    } else {
      state.chatMode = "expense";
    }
    render();
  }

  function getActiveSession() {
    return state.sessions.find((task) => task.active) || null;
  }

  function getEnterpriseSession(id) {
    return id ? state.enterpriseSessions[id] || null : null;
  }

  function getEnterpriseDraftAgent() {
    return getEnterpriseAgentById(state.enterprise.draftAgentId);
  }

  function getEnterpriseAgentById(agentId) {
    return enterpriseAgents.find((agent) => agent.id === agentId) || null;
  }

  function getEnterprisePreset(agent) {
    const key = agent?.chatFlowKey || "default";
    return enterpriseFlowPresets[key] || enterpriseFlowPresets.default;
  }

  function getDefaultEnterprisePrompt(agent) {
    if (!agent) return enterpriseFlowPresets.default.defaultQuery;
    if (Array.isArray(agent.suggestedPrompts) && agent.suggestedPrompts.length) {
      return agent.suggestedPrompts[0];
    }
    return getEnterprisePreset(agent).defaultQuery;
  }

  function openEnterpriseDraft(agentId) {
    const agent = getEnterpriseAgentById(agentId);
    if (!agent) return;
    state.ui.workflowPaused = false;
    stopEnterpriseRunTimer();
    state.route = "chat";
    state.chatMode = "enterprise_draft";
    state.enterprise.draftAgentId = agent.id;
    state.enterprise.activeSessionId = "";
    state.enterprise.query = getDefaultEnterprisePrompt(agent);
    state.sessions = state.sessions.map((task) => ({ ...task, active: false }));
    nodes.composerTextarea.value = state.enterprise.query;
    render();
    window.requestAnimationFrame(() => {
      nodes.composerTextarea.focus();
      nodes.composerTextarea.setSelectionRange(nodes.composerTextarea.value.length, nodes.composerTextarea.value.length);
    });
  }

  function syncEnterpriseDraftQueryFromComposer() {
    if (state.chatMode !== "enterprise_draft") return;
    state.enterprise.query = nodes.composerTextarea.value || "";
  }

  function canSubmitEnterpriseChat() {
    if (state.route !== "chat") return false;
    if (state.chatMode !== "enterprise_draft" && state.chatMode !== "enterprise_session") return false;
    const value = (nodes.composerTextarea.value || "").trim();
    if (!value) return false;
    if (state.chatMode === "enterprise_draft") return Boolean(getEnterpriseDraftAgent());
    const session = getEnterpriseSession(state.enterprise.activeSessionId);
    return Boolean(session?.agentId);
  }

  function handleComposerSubmit() {
    if (canSubmitRuntimeMessage()) {
      handleRuntimeComposerSubmit();
      return;
    }

    if (state.chatMode === "expense" && state.ui.workflowPaused) {
      state.ui.workflowPaused = false;
      scheduleTransition();
      render();
      return;
    }

    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      if (session?.status === "paused") {
        session.status = "running";
        updateEnterpriseSessionListState(session.id, "running");
        startEnterpriseRun(session.id);
        render();
        return;
      }
    }

    if (!canSubmitEnterpriseChat()) return;
    const message = (nodes.composerTextarea.value || "").trim();
    const baseAgent =
      state.chatMode === "enterprise_session"
        ? getEnterpriseAgentById(getEnterpriseSession(state.enterprise.activeSessionId)?.agentId)
        : getEnterpriseDraftAgent();
    if (!baseAgent) return;
    createOrRestartEnterpriseSession(baseAgent, message);
  }

  function createOrRestartEnterpriseSession(agent, query) {
    state.ui.workflowPaused = false;
    stopEnterpriseRunTimer();
    const preset = getEnterprisePreset(agent);
    const sessionId = `task-enterprise-${Date.now()}`;
    const sessionTitle = agent.name;
    const session = {
      id: sessionId,
      agentId: agent.id,
      agentName: agent.name,
      flowKey: agent.chatFlowKey || "default",
      query,
      phase: 0,
      status: "running",
      recentTaskTitle: preset.recentTaskTitle || agent.name
    };
    state.enterpriseSessions[sessionId] = session;
    state.enterprise.activeSessionId = sessionId;
    state.enterprise.draftAgentId = agent.id;
    state.enterprise.query = query;
    state.chatMode = "enterprise_session";
    state.route = "chat";

    state.sessions = [
      {
        id: sessionId,
        title: sessionTitle,
        status: "running",
        active: true,
        pinned: false,
        kind: "enterprise",
        enterpriseAgentId: agent.id
      },
      ...state.sessions.map((task) => ({ ...task, active: false }))
    ];

    nodes.composerTextarea.value = "";
    render();
    startEnterpriseRun(sessionId);
  }

  function startEnterpriseRun(sessionId) {
    stopEnterpriseRunTimer();
    timers.enterpriseRun = window.setInterval(() => {
      const session = getEnterpriseSession(sessionId);
      if (!session) {
        stopEnterpriseRunTimer();
        return;
      }
      if (session.phase >= 6) {
        session.status = "completed";
        updateEnterpriseSessionListState(sessionId, "completed");
        stopEnterpriseRunTimer();
        render();
        return;
      }
      session.phase += 1;
      if (session.phase >= 6) {
        session.status = "completed";
        updateEnterpriseSessionListState(sessionId, "completed");
        stopEnterpriseRunTimer();
      } else {
        updateEnterpriseSessionListState(sessionId, "running");
      }
      render();
    }, ENTERPRISE_RUN_INTERVAL_MS);
  }

  function stopEnterpriseRunTimer() {
    if (!timers.enterpriseRun) return;
    window.clearInterval(timers.enterpriseRun);
    timers.enterpriseRun = null;
  }

  function updateEnterpriseSessionListState(sessionId, status) {
    state.sessions = state.sessions.map((task) => {
      if (task.id !== sessionId) return task;
      return { ...task, status, title: task.title };
    });
  }

  function goTo(step) {
    state.ui.workflowPaused = false;
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
    flushRuntimeQueueIfReady();
    syncShell();
    renderNotices();
    renderRecentTasks();
    renderMessages();
    renderRightPanel();
    renderComposerProgressDock();
    renderRuntimeQueueDock();
    updateComposerSendButton();
    scrollStreamToBottom();
  }

  function syncShell() {
    nodes.appShell.classList.toggle("route-agents", state.route === "agents");
    nodes.appShell.classList.toggle("route-automation", state.route === "automation");
    nodes.appShell.classList.toggle("route-chat", state.route === "chat");
    nodes.appShell.classList.toggle("preview-focused", state.panel.activeTab === "preview");
    const shellPanelsHidden = state.route === "agents" || state.route === "automation";
    nodes.composerCard.hidden = shellPanelsHidden;
    if (nodes.composerProgressDock) nodes.composerProgressDock.hidden = shellPanelsHidden || !shouldShowComposerProgressDock();
    if (nodes.runtimeQueueDock && shellPanelsHidden) nodes.runtimeQueueDock.hidden = true;
    nodes.rightPanel.hidden = shellPanelsHidden;
    if (nodes.panelResizer) nodes.panelResizer.hidden = shellPanelsHidden;
    nodes.appShell.style.setProperty("--right-panel-width", `${state.panel.width}px`);

    const header = getHeaderMeta();
    nodes.sessionTitle.textContent = header.title;
    nodes.sessionSubtitle.textContent = header.subtitle;

    if (nodes.navList) {
      nodes.navList.querySelectorAll("[data-route]").forEach((button) => {
        button.classList.toggle("active", button.getAttribute("data-route") === state.route);
      });
    }
  }

  function getHeaderMeta() {
    if (state.route === "agents") {
      return {
        title: "企业级智能体广场",
        subtitle: "按照领域浏览企业级智能体，一键召唤专业智能体"
      };
    }

    if (state.route === "automation") {
      return {
        title: "自动化任务",
        subtitle: "管理 Agent 的定时执行任务、任务执行记录和事件触发任务"
      };
    }

    if (state.chatMode === "enterprise_draft") {
      const agent = getEnterpriseDraftAgent();
      return {
        title: agent?.name || "企业级智能体会话",
        subtitle: agent ? `企业级智能体 · 发送后自动执行 mock 会话` : "请选择一个企业级智能体开始会话"
      };
    }

    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      return {
        title: session?.agentName || "企业级智能体会话",
        subtitle: session ? `会话 ID: ${session.id} · 智能体: ${session.agentName}` : "企业级智能体会话"
      };
    }

    const active = getActiveSession();
    return {
      title: active?.title || DEFAULT_HEADER.title,
      subtitle: DEFAULT_HEADER.subtitle
    };
  }

  function renderNotices() {
    if (state.route !== "chat" || state.chatMode !== "expense") {
      nodes.noticeStack.innerHTML = "";
      return;
    }
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
    syncAutomationSidebarState();
    const pinned = state.sessions.filter((task) => task.pinned);
    const recents = state.sessions.filter((task) => !task.pinned);
    const automationTasks = getAutomationSidebarTasks();
    nodes.recentTaskList.innerHTML = [
      renderSessionGroup("置顶", pinned, { empty: "暂无置顶会话", showPinHint: true }),
      renderSessionGroup("最近", recents, {
        meta: recents.length ? `${recents.length}` : "",
        groupKey: "recents",
        collapsible: recents.length > DEFAULT_RECENTS_VISIBLE,
        expanded: state.ui.recentsExpanded,
        collapsedCount: DEFAULT_RECENTS_VISIBLE
      }),
      renderAutomationTaskGroup(automationTasks)
    ].join("");
  }

  function renderSessionGroup(title, tasks, options = {}) {
    const expanded = options.collapsible ? Boolean(options.expanded) : true;
    const collapsedCount = Math.max(1, options.collapsedCount || DEFAULT_RECENTS_VISIBLE);
    const visibleTasks = options.collapsible && !expanded ? tasks.slice(0, collapsedCount) : tasks;
    const hiddenCount = Math.max(0, tasks.length - visibleTasks.length);
    return `<section class="session-group">
      <div class="session-group-header">
        <div class="session-group-title">
          ${options.showPinHint ? icon("pin") : ""}
          <span>${escapeHTML(title)}</span>
        </div>
        <div class="session-group-actions">
          ${options.meta ? `<span class="session-group-meta">${escapeHTML(String(options.meta))}</span>` : ""}
          ${options.collapsible
            ? `<button
                class="session-group-toggle ${expanded ? "expanded" : ""}"
                type="button"
                data-session-group-toggle="${escapeAttr(options.groupKey || "")}"
                aria-expanded="${expanded ? "true" : "false"}"
              >
                <span>${expanded ? "收起" : `展开 ${hiddenCount} 条`}</span>
                <span class="session-group-toggle-icon">${icon("chevron")}</span>
              </button>`
            : ""}
        </div>
      </div>
      ${tasks.length
        ? `<div class="session-list">${visibleTasks.map((task) => renderSessionRow(task)).join("")}</div>`
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

  function renderAutomationTaskGroup(tasks) {
    return `<section class="session-group">
      <div class="session-group-header">
        <div class="session-group-title">
          ${icon("clock")}
          <span>自动化任务</span>
        </div>
        <div class="session-group-actions">
          ${tasks.length ? `<span class="session-group-meta">${escapeHTML(String(tasks.length))}</span>` : ""}
        </div>
      </div>
      ${tasks.length
        ? `<div class="automation-task-tree">${tasks.map((task) => renderAutomationTaskRow(task)).join("")}</div>`
        : `<div class="session-group-empty">${icon("clock")}<span>暂无自动化任务</span></div>`}
    </section>`;
  }

  function renderAutomationTaskRow(task) {
    const expanded = state.automationSidebar.expandedTaskIds.includes(task.id);
    return `<article class="automation-workspace-item ${expanded ? "expanded" : ""}">
      <button
        class="automation-workspace-folder"
        type="button"
        data-automation-task-toggle="${escapeAttr(task.id)}"
        aria-expanded="${expanded ? "true" : "false"}"
        title="${escapeAttr(task.workspaceName)}"
      >
        <span class="automation-workspace-folder-icon">${icon("folder")}</span>
        <span class="automation-workspace-folder-name">${escapeHTML(task.workspaceName)}</span>
      </button>
      ${expanded ? renderAutomationRunList(task) : ""}
    </article>`;
  }

  function renderAutomationRunList(task) {
    if (!task.runs.length) {
      return `<div class="automation-run-empty">TaskThread 暂无执行记录</div>`;
    }
    return `<div class="automation-run-list">
      ${task.runs.map((run) => renderAutomationRunRow(task, run)).join("")}
    </div>`;
  }

  function renderAutomationRunRow(task, run) {
    const active =
      state.route === "automation" &&
      state.automationSidebar.activeTaskId === task.id &&
      state.automationSidebar.activeRunId === run.id;
    return `<button
      class="automation-run-row ${active ? "active" : ""}"
      type="button"
      data-automation-task-id="${escapeAttr(task.id)}"
      data-automation-run-row="${escapeAttr(run.id)}"
      title="${escapeAttr(run.summary || `${run.title} · ${run.timeLabel}`)}"
    >
      <span class="automation-run-glyph ${escapeAttr(run.status)}">${automationRunStatusIcon(run.status)}</span>
      <span class="automation-run-label">${escapeHTML(run.title)}</span>
      <span class="automation-run-time">${escapeHTML(run.timeLabel)}</span>
    </button>`;
  }

  function renderMessages() {
    if (state.route === "agents") {
      nodes.stream.innerHTML = renderEnterpriseAgentsPage();
      return;
    }

    if (state.route === "automation") {
      if (window.AutomationTasksModule?.render) {
        window.AutomationTasksModule.render();
      } else {
        nodes.stream.innerHTML = `<div class="panel-empty">自动化任务模块加载失败。</div>`;
      }
      return;
    }

    if (state.chatMode === "enterprise_draft" || state.chatMode === "enterprise_session") {
      nodes.stream.innerHTML = renderEnterpriseChat();
      return;
    }

    const html = [
      getVisibleSteps().map((step) => renderStepItems(step)).join(""),
      renderRuntimeSteerMessages(),
      renderRuntimeExecutedQueueMessages()
    ].join("");
    nodes.stream.innerHTML = html;
  }

  function renderEnterpriseAgentsPage() {
    const query = state.enterprise.query.trim().toLowerCase();
    const categoryId = state.enterprise.category || "all";
    const filtered = enterpriseAgents.filter((agent) => {
      if (categoryId !== "all" && agent.category !== categoryId) return false;
      if (!query) return true;
      const blob = `${agent.name}${agent.description}`.toLowerCase();
      return blob.includes(query);
    });

    return `<section class="enterprise-plaza">
      <header class="enterprise-plaza-head">
        <div class="enterprise-plaza-copy">
          <h2>企业级智能体广场</h2>
          <p>按照领域浏览企业级智能体，一键召唤专业智能体</p>
        </div>
        <label class="enterprise-search">
          ${icon("search")}
          <input
            type="search"
            value="${escapeAttr(state.enterprise.query)}"
            data-agent-search
            placeholder="输入智能体名称检索"
            autocomplete="off"
          />
        </label>
      </header>
      <nav class="enterprise-tabs" aria-label="智能体分类">
        <div class="enterprise-tabs-scroll">
          ${enterpriseAgentCategoryTabs
            .map((tab) => `<button
              type="button"
              class="enterprise-tab${tab.id === categoryId ? " active" : ""}"
              data-agent-tab="${escapeAttr(tab.id)}"
            >${escapeHTML(tab.label)}</button>`)
            .join("")}
        </div>
      </nav>
      <section class="enterprise-grid" aria-label="智能体列表">
        ${filtered.length
          ? filtered.map((agent) => renderEnterpriseAgentCard(agent)).join("")
          : `<div class="enterprise-empty">未找到匹配的智能体，可尝试切换分类或调整关键词。</div>`}
      </section>
    </section>`;
  }

  function renderEnterpriseAgentCard(agent) {
    return `<article class="enterprise-agent-card">
      <div class="enterprise-agent-accent" aria-hidden="true"></div>
      <div class="enterprise-agent-avatar">${escapeHTML(getAgentAvatarInitial(agent.name))}</div>
      <strong class="enterprise-agent-name">${escapeHTML(agent.name)}</strong>
      <p class="enterprise-agent-desc">${escapeHTML(agent.description)}</p>
      <div class="enterprise-agent-divider"></div>
      <div class="enterprise-agent-actions">
        <button type="button" class="enterprise-agent-chat" data-enterprise-chat="${escapeAttr(agent.id)}">对话</button>
      </div>
    </article>`;
  }

  function renderEnterpriseChat() {
    const session = state.chatMode === "enterprise_session" ? getEnterpriseSession(state.enterprise.activeSessionId) : null;
    const agent = state.chatMode === "enterprise_session" ? getEnterpriseAgentById(session?.agentId) : getEnterpriseDraftAgent();
    if (!agent) {
      return `<div class="enterprise-chat-empty">
        <div class="enterprise-chat-empty-card">
          <strong>请选择一个企业级智能体</strong>
          <p>从左侧“企业级智能体”进入广场，然后点击“对话”。</p>
        </div>
      </div>`;
    }

    if (state.chatMode === "enterprise_draft") {
      return renderEnterpriseDraft(agent);
    }

    return renderEnterpriseSession(session, agent);
  }

  function renderEnterpriseDraft(agent) {
    const prompts =
      Array.isArray(agent.suggestedPrompts) && agent.suggestedPrompts.length
        ? agent.suggestedPrompts
        : [getDefaultEnterprisePrompt(agent)];
    return `<section class="enterprise-chat-home">
      <article class="enterprise-chat-intro">
        <div class="enterprise-chat-intro-main">
          <span class="enterprise-chat-intro-avatar">${escapeHTML(getAgentAvatarInitial(agent.name))}</span>
          <div>
            <strong>${escapeHTML(agent.name)}</strong>
            <p>${escapeHTML(agent.description)}</p>
          </div>
        </div>
        <div class="enterprise-chat-prompt-list">
          ${prompts
            .map(
              (prompt) => `<button type="button" class="enterprise-prompt-chip" data-enterprise-prompt="${escapeAttr(prompt)}">
                ${escapeHTML(prompt)}
              </button>`
            )
            .join("")}
        </div>
      </article>
    </section>`;
  }

  function renderEnterpriseSession(session, agent) {
    if (!session) return "";
    const preset = getEnterprisePreset(agent);
    const parts = [];
    parts.push(
      renderUserMessage({
        text: session.query,
        attachments: []
      })
    );

    if (session.phase >= 1) {
      parts.push(renderNarration({ text: preset.planningText }));
    }
    if (session.phase >= 2) {
      parts.push(
        renderPlanCard({
          statusClass: session.phase >= 5 ? "success" : "info",
          status: session.phase >= 5 ? "已完成" : "执行中",
          items: preset.planItems
        })
      );
    }

    preset.stages.forEach((stage, index) => {
      const currentPhase = index === 0 ? 3 : 4;
      if (session.phase < currentPhase) return;
      const stageStatus = session.phase === currentPhase ? "running" : "success";
      parts.push(renderEnterpriseStage(stage, stageStatus));
    });

    if (session.phase >= 5) {
      parts.push(
        renderArtifacts({
          artifacts: preset.artifacts
        })
      );
    }

    if (session.phase >= 6) {
      parts.push(renderNarration({ text: preset.finalMessage }));
    }

    parts.push(renderRuntimeSteerMessages(), renderRuntimeExecutedQueueMessages());

    return parts.join("");
  }

  function renderEnterpriseStage(stage, status) {
    const pillClass = status === "running" ? "info" : "success";
    const pillText = status === "running" ? "执行中" : "已完成";
    return `<div class="message-row">
      <article class="enterprise-stage-card">
        <div class="card-head">
          <h2 class="card-title">${escapeHTML(stage.title)}</h2>
          <span class="status-pill ${pillClass}">${escapeHTML(pillText)}</span>
        </div>
        <ul class="enterprise-stage-log-list">
          ${stage.logs.map((line) => `<li>${escapeHTML(line)}</li>`).join("")}
        </ul>
      </article>
    </div>`;
  }

  function getAgentAvatarInitial(name) {
    const text = String(name || "").trim();
    if (!text) return "?";
    const first = text[0];
    if (/[a-zA-Z]/.test(first)) {
      const match = text.match(/[a-zA-Z]+/g);
      if (match && match.length >= 2) return `${match[0][0]}${match[1][0]}`.toUpperCase();
      return first.toUpperCase();
    }
    return first;
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
    const metaLabel = typeof item.runtimeLabel === "string" ? item.runtimeLabel.trim() : "";
    return `<div class="message-row user">
      <article class="user-message">
        ${metaLabel ? `<div class="user-message-meta">${escapeHTML(metaLabel)}</div>` : ""}
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
    const statusText = item.status || "已建立";
    const statusClass = item.statusClass || (statusText === "执行中" ? "info" : "success");
    return `<div class="message-row">
      <article class="plan-card">
        <div class="card-head">
          <h2 class="card-title">执行计划</h2>
          <span class="status-pill ${escapeAttr(statusClass)}">${escapeHTML(statusText)}</span>
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

  function getComposerDraftText() {
    return (nodes.composerTextarea?.value || "").trim();
  }

  function getRuntimeScopeKey() {
    if (state.route !== "chat") return "";
    if (state.chatMode === "expense") return "expense";
    if (state.chatMode === "enterprise_session" && state.enterprise.activeSessionId) {
      return `enterprise:${state.enterprise.activeSessionId}`;
    }
    return "";
  }

  function isRuntimeExecutionPaused() {
    if (state.chatMode === "expense") return Boolean(state.ui.workflowPaused);
    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      return session?.status === "paused";
    }
    return false;
  }

  function canShowRuntimeSendControls() {
    return Boolean(getRuntimeScopeKey() && isAgentTaskExecutionWindow() && !isRuntimeExecutionPaused());
  }

  function canSubmitRuntimeMessage() {
    return Boolean(canShowRuntimeSendControls() && getComposerDraftText());
  }

  function getRuntimeAnchor() {
    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      return { kind: "enterprise", phase: session?.phase || 0 };
    }
    return { kind: "expense", step: state.currentStep };
  }

  function getRuntimeAnchorLabel(anchor = getRuntimeAnchor()) {
    if (anchor.kind === "enterprise") return `Phase ${anchor.phase}`;
    return `Step ${anchor.step}`;
  }

  function createRuntimeMessageId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function handleRuntimeComposerSubmit() {
    const text = getComposerDraftText();
    const scope = getRuntimeScopeKey();
    if (!text || !scope) return;

    const mode = state.runtimeSend.mode === "steer" ? "steer" : "queue";
    const message = {
      id: createRuntimeMessageId(`runtime-${mode}`),
      scope,
      text,
      anchor: getRuntimeAnchor(),
      createdLabel: getRuntimeAnchorLabel(),
      createdAt: Date.now()
    };

    if (mode === "steer") {
      state.runtimeSend.steers.push(message);
    } else {
      state.runtimeSend.queue.push(message);
    }

    state.runtimeSend.menuOpen = false;
    state.runtimeSend.editingQueueId = "";
    state.runtimeSend.editDraft = "";
    state.runtimeSend.queueMenuId = "";
    nodes.composerTextarea.value = "";
    render();
    nodes.composerTextarea.focus();
  }

  function getCurrentRuntimeQueue() {
    const scope = getRuntimeScopeKey();
    if (!scope) return [];
    return state.runtimeSend.queue.filter((item) => item.scope === scope);
  }

  function getCurrentRuntimeSteers() {
    const scope = getRuntimeScopeKey();
    if (!scope) return [];
    return state.runtimeSend.steers.filter((item) => item.scope === scope);
  }

  function getCurrentRuntimeExecutedQueue() {
    const scope = getRuntimeScopeKey();
    if (!scope) return [];
    return state.runtimeSend.executed.filter((item) => item.scope === scope);
  }

  function isRuntimeQueueReadyForExecution() {
    const scope = getRuntimeScopeKey();
    if (!scope || state.route !== "chat") return false;
    if (scope === "expense") return state.currentStep >= totalSteps;
    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      return Boolean(session && (session.status === "completed" || session.phase >= 6));
    }
    return false;
  }

  function flushRuntimeQueueIfReady() {
    if (!isRuntimeQueueReadyForExecution()) return;
    const scope = getRuntimeScopeKey();
    const moved = [];
    state.runtimeSend.queue = state.runtimeSend.queue.filter((item) => {
      if (item.scope !== scope) return true;
      moved.push(item);
      return false;
    });
    if (!moved.length) return;

    const baseIndex = getCurrentRuntimeExecutedQueue().length;
    state.runtimeSend.executed.push(
      ...moved.map((item, index) => ({
        ...item,
        executedQueueIndex: baseIndex + index + 1,
        executedLabel: "队列执行"
      }))
    );

    if (moved.some((item) => item.id === state.runtimeSend.editingQueueId)) {
      state.runtimeSend.editingQueueId = "";
      state.runtimeSend.editDraft = "";
    }
    if (moved.some((item) => item.id === state.runtimeSend.queueMenuId)) {
      state.runtimeSend.queueMenuId = "";
    }
  }

  function handleRuntimeQueueAction(action, id) {
    if (action === "cancel-edit") {
      cancelRuntimeQueueEdit();
      return;
    }
    if (!id) return;
    if (action === "toggle-more") {
      state.runtimeSend.queueMenuId = state.runtimeSend.queueMenuId === id ? "" : id;
      renderRuntimeQueueDock();
    } else if (action === "steer-from-queue") {
      steerRuntimeQueueMessage(id);
    } else if (action === "edit") {
      beginRuntimeQueueEdit(id);
    } else if (action === "save-edit") {
      saveRuntimeQueueEdit(id);
    } else if (action === "delete") {
      deleteRuntimeQueueMessage(id);
    } else if (action === "move-up") {
      moveRuntimeQueueMessage(id, -1);
    } else if (action === "move-down") {
      moveRuntimeQueueMessage(id, 1);
    }
  }

  function beginRuntimeQueueEdit(id) {
    const message = state.runtimeSend.queue.find((item) => item.id === id);
    if (!message) return;
    state.runtimeSend.editingQueueId = id;
    state.runtimeSend.editDraft = message.text;
    state.runtimeSend.queueMenuId = "";
    render();
    window.requestAnimationFrame(() => {
      const editor = (nodes.runtimeQueueDock || nodes.stream).querySelector(`[data-runtime-queue-edit="${id}"]`);
      if (!editor) return;
      editor.focus();
      editor.setSelectionRange(editor.value.length, editor.value.length);
    });
  }

  function saveRuntimeQueueEdit(id) {
    const text = state.runtimeSend.editDraft.trim();
    if (!text) {
      const editor = (nodes.runtimeQueueDock || nodes.stream).querySelector(`[data-runtime-queue-edit="${id}"]`);
      editor?.focus();
      return;
    }
    const message = state.runtimeSend.queue.find((item) => item.id === id);
    if (message) message.text = text;
    state.runtimeSend.editingQueueId = "";
    state.runtimeSend.editDraft = "";
    render();
  }

  function cancelRuntimeQueueEdit() {
    if (!state.runtimeSend.editingQueueId) return;
    state.runtimeSend.editingQueueId = "";
    state.runtimeSend.editDraft = "";
    render();
  }

  function deleteRuntimeQueueMessage(id) {
    state.runtimeSend.queue = state.runtimeSend.queue.filter((item) => item.id !== id);
    if (state.runtimeSend.editingQueueId === id) {
      state.runtimeSend.editingQueueId = "";
      state.runtimeSend.editDraft = "";
    }
    if (state.runtimeSend.queueMenuId === id) state.runtimeSend.queueMenuId = "";
    render();
  }

  function steerRuntimeQueueMessage(id) {
    const index = state.runtimeSend.queue.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [message] = state.runtimeSend.queue.splice(index, 1);
    state.runtimeSend.steers.push({
      ...message,
      id: createRuntimeMessageId("runtime-steer"),
      anchor: getRuntimeAnchor(),
      createdLabel: getRuntimeAnchorLabel(),
      createdAt: Date.now()
    });
    if (state.runtimeSend.editingQueueId === id) {
      state.runtimeSend.editingQueueId = "";
      state.runtimeSend.editDraft = "";
    }
    if (state.runtimeSend.queueMenuId === id) state.runtimeSend.queueMenuId = "";
    render();
  }

  function moveRuntimeQueueMessage(id, delta) {
    const scopedQueue = getCurrentRuntimeQueue();
    const scopedIndex = scopedQueue.findIndex((item) => item.id === id);
    const target = scopedQueue[scopedIndex + delta];
    if (!target) return;

    const sourceIndex = state.runtimeSend.queue.findIndex((item) => item.id === id);
    const targetIndex = state.runtimeSend.queue.findIndex((item) => item.id === target.id);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const nextQueue = state.runtimeSend.queue.slice();
    [nextQueue[sourceIndex], nextQueue[targetIndex]] = [nextQueue[targetIndex], nextQueue[sourceIndex]];
    state.runtimeSend.queue = nextQueue;
    state.runtimeSend.queueMenuId = "";
    render();
  }

  function getRuntimeSteerStatus(message) {
    if (message.anchor?.kind === "enterprise") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      const consumed = Boolean(session && session.phase > (message.anchor.phase || 0));
      return consumed
        ? { className: "consumed", label: `已在 Phase ${Math.min((message.anchor.phase || 0) + 1, 6)} 前读取` }
        : { className: "pending", label: "等待下一 Step / Tool 调用前读取" };
    }

    const anchorStep = message.anchor?.step || 0;
    const consumed = state.currentStep > anchorStep;
    return consumed
      ? { className: "consumed", label: `已在 Step ${Math.min(anchorStep + 1, totalSteps)} 前读取` }
      : { className: "pending", label: "等待下一 Step / Tool 调用前读取" };
  }

  function renderRuntimeSteerMessages() {
    const steers = getCurrentRuntimeSteers();
    if (!steers.length) return "";
    return steers.map((message) => {
      const status = getRuntimeSteerStatus(message);
      return `<div class="message-row runtime-steer-row">
        <article class="runtime-steer-message">
          <div class="runtime-steer-meta">
            <span class="runtime-steer-arrow">↳</span>
            <span>运行中插入</span>
            <span class="runtime-steer-status ${escapeAttr(status.className)}">${escapeHTML(status.label)}</span>
          </div>
          <div class="runtime-steer-text">${escapeHTML(message.text)}</div>
          <div class="runtime-steer-note">不重置当前任务,保持 Agent 上下文与执行状态连续。</div>
        </article>
      </div>`;
    }).join("");
  }

  function renderRuntimeExecutedQueueMessages() {
    return getCurrentRuntimeExecutedQueue()
      .map((message) =>
        renderUserMessage({
          text: message.text,
          attachments: [],
          runtimeLabel: `${message.executedLabel || "队列执行"} · #${message.executedQueueIndex || 1}`
        })
      )
      .join("");
  }

  function renderRuntimeQueueDock() {
    if (!nodes.runtimeQueueDock) return;
    if (state.route !== "chat") {
      nodes.runtimeQueueDock.hidden = true;
      nodes.runtimeQueueDock.innerHTML = "";
      return;
    }
    const queue = getCurrentRuntimeQueue();
    nodes.runtimeQueueDock.hidden = !queue.length;
    nodes.runtimeQueueDock.innerHTML = queue.length
      ? queue.map((message, index) => renderRuntimeQueueStrip(message, index, queue.length)).join("")
      : "";
  }

  function renderRuntimeQueueStrip(message, index, total) {
    const editing = state.runtimeSend.editingQueueId === message.id;
    const menuOpen = state.runtimeSend.queueMenuId === message.id;
    const order = index + 1;
    const moveUpDisabled = index === 0 ? " disabled" : "";
    const moveDownDisabled = index === total - 1 ? " disabled" : "";
    return `<article class="runtime-queue-strip">
      <div class="runtime-queue-main">
        <span class="runtime-queue-turn" aria-hidden="true">↳</span>
        <span class="runtime-queue-order">待执行 #${order}</span>
        ${editing
          ? `<textarea class="runtime-queue-edit" data-runtime-queue-edit="${escapeAttr(message.id)}" rows="2">${escapeHTML(state.runtimeSend.editDraft)}</textarea>`
          : `<span class="runtime-queue-text">${escapeHTML(message.text)}</span>`}
      </div>
      <div class="runtime-queue-actions">
        ${editing
          ? `<button class="runtime-queue-action primary" type="button" data-runtime-action="save-edit" data-runtime-message-id="${escapeAttr(message.id)}">保存</button>
            <button class="runtime-queue-action" type="button" data-runtime-action="cancel-edit">取消</button>`
          : `<button class="runtime-queue-action steer" type="button" data-runtime-action="steer-from-queue" data-runtime-message-id="${escapeAttr(message.id)}">↳ 引导</button>
            <button class="runtime-queue-icon-action" type="button" aria-label="删除待执行消息" title="删除" data-runtime-action="delete" data-runtime-message-id="${escapeAttr(message.id)}">${icon("trash")}</button>
            <button class="runtime-queue-icon-action" type="button" aria-label="更多操作" title="更多" aria-expanded="${menuOpen ? "true" : "false"}" data-runtime-action="toggle-more" data-runtime-message-id="${escapeAttr(message.id)}">${icon("more")}</button>
            ${menuOpen ? `<div class="runtime-queue-more-menu">
              <button type="button" data-runtime-action="edit" data-runtime-message-id="${escapeAttr(message.id)}">编辑</button>
              <button type="button" data-runtime-action="move-up" data-runtime-message-id="${escapeAttr(message.id)}"${moveUpDisabled}>上移</button>
              <button type="button" data-runtime-action="move-down" data-runtime-message-id="${escapeAttr(message.id)}"${moveDownDisabled}>下移</button>
            </div>` : ""}`}
      </div>
    </article>`;
  }

  function renderRightPanel() {
    if (state.route === "agents" || state.route === "automation") return;
    if (state.chatMode === "enterprise_draft" || state.chatMode === "enterprise_session") {
      renderEnterpriseRightPanel();
      syncRightPanelChrome(null);
      renderPreviewPlaceholder("企业级智能体产物会在这里预览。");
      return;
    }
    const files = getExpensePanelFiles();
    const selectedFile = ensureSelectedPreviewFile(files, state.panel.activeTab === "preview");
    if (state.panel.activeTab === "preview" && !selectedFile) {
      state.panel.activeTab = "overview";
    }
    syncRightPanelChrome(selectedFile);
    if (state.panel.activeTab === "overview") {
      renderProgressPanel();
      renderFilePanel(files, selectedFile);
      renderContextPanel();
      return;
    }
    renderPreviewPanel(files, selectedFile);
  }

  function renderEnterpriseRightPanel() {
    const progress = getCurrentTaskProgress();
    renderRightPanelProgress(progress);

    const session = state.chatMode === "enterprise_session" ? getEnterpriseSession(state.enterprise.activeSessionId) : null;
    const agent = state.chatMode === "enterprise_session" ? getEnterpriseAgentById(session?.agentId) : getEnterpriseDraftAgent();
    const preset = getEnterprisePreset(agent);
    const phase = session?.phase || 0;
    const files = phase >= 5 ? preset.artifacts : [];
    nodes.fileCount.textContent = String(files.length);
    nodes.fileList.innerHTML = files.length
      ? files
          .map(
            (file) => `<div class="file-item">${icon("file")}<div><strong>${escapeHTML(file.name)}</strong><span>${escapeHTML(file.size)}</span></div></div>`
          )
          .join("")
      : `<div class="panel-empty">暂无文件</div>`;

    const contexts = [];
    if (phase >= 1 && preset.planningText) {
      contexts.push({ icon: "skill", name: "执行方案", meta: preset.planningText });
    }
    (preset.planItems || []).forEach((item, idx) => {
      if (phase < idx + 2) return;
      const done = phase >= idx + 3;
      contexts.push({
        icon: "terminal",
        name: item.tool || "工具调用",
        meta: done ? `已完成 · ${item.title}` : `${item.title} · ${item.eta || ""}`.trim()
      });
    });

    nodes.contextCount.textContent = String(contexts.length);
    nodes.contextList.innerHTML = contexts.length
      ? contexts
          .map(
            (item) => `<div class="context-item">${icon(item.icon)}<div><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.meta)}</span></div></div>`
          )
          .join("")
      : `<div class="panel-empty">暂无工具</div>`;
  }

  function renderProgressPanel() {
    renderRightPanelProgress(getCurrentTaskProgress());
  }

  function getCurrentTaskProgress() {
    if (state.chatMode === "enterprise_draft" || state.chatMode === "enterprise_session") {
      return getEnterpriseTaskProgress();
    }
    return getDefaultTaskProgress();
  }

  function shouldShowComposerProgressDock() {
    if (state.route !== "chat") return false;
    if (state.chatMode === "enterprise_draft") return false;
    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      return Boolean(session && session.phase >= 2);
    }
    return state.currentStep >= 9;
  }

  function getEnterpriseTaskProgress() {
    const session = state.chatMode === "enterprise_session" ? getEnterpriseSession(state.enterprise.activeSessionId) : null;
    const agent = state.chatMode === "enterprise_session" ? getEnterpriseAgentById(session?.agentId) : getEnterpriseDraftAgent();
    const preset = getEnterprisePreset(agent);
    const phase = session?.phase || 0;
    const items = preset.planItems.map((item, index) => {
      let status = "pending";
      if (phase >= index + 3) status = "done";
      else if (phase === index + 2) status = "in_progress";
      return {
        title: item.title,
        status,
        label: getProgressStatusLabel(status)
      };
    });
    const done = items.filter((item) => item.status === "done").length;
    return {
      done,
      total: items.length,
      countText: `${done}/${items.length}`,
      summaryText: `共 ${items.length} 个任务，已经完成 ${done} 个`,
      items
    };
  }

  function getDefaultTaskProgress() {
    const items = todoItems.map((item, index) => {
      const status = getTodoStatus(index);
      return {
        title: item.title,
        status,
        label: getProgressStatusLabel(status)
      };
    });
    const done = items.filter((item) => item.status === "done").length;
    return {
      done,
      total: items.length,
      countText: `${done}/${items.length}`,
      summaryText: `共 ${items.length} 个任务，已经完成 ${done} 个`,
      items
    };
  }

  function getProgressStatusLabel(status) {
    return {
      done: "已完成",
      in_progress: "进行中",
      pending: "待处理",
      blocked: "等待确认"
    }[status] || "待处理";
  }

  function renderRightPanelProgress(progress) {
    nodes.progressCount.textContent = progress.countText;
    nodes.progressList.innerHTML = progress.items.map((item) => renderProgressPanelItem(item)).join("");
  }

  function renderProgressPanelItem(item) {
    return `<div class="progress-panel-item ${item.status}">
      <span class="panel-status">${item.status === "done" ? icon("check") : ""}</span>
      <div>
        <strong>${escapeHTML(item.title)}</strong>
        <span>${escapeHTML(item.label)}</span>
      </div>
    </div>`;
  }

  function renderComposerProgressDock() {
    if (!nodes.composerProgressDock || nodes.composerProgressDock.hidden) return;
    const progress = getCurrentTaskProgress();
    const collapsed = state.ui.composerProgressCollapsed;
    nodes.composerProgressSummary.textContent = progress.summaryText;
    nodes.composerProgressDock.classList.toggle("is-collapsed", collapsed);
    nodes.composerProgressToggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
    nodes.composerProgressBody.hidden = collapsed;
    nodes.composerProgressList.innerHTML = progress.items
      .map(
        (item, index) => `<li class="composer-progress-entry ${item.status}">
          <span class="panel-status">${item.status === "done" ? icon("check") : ""}</span>
          <div class="composer-progress-entry-content">
            <span class="composer-progress-entry-index">${index + 1}.</span>
            <span class="composer-progress-entry-title">${escapeHTML(item.title)}</span>
          </div>
        </li>`
      )
      .join("");
  }

  function syncRightPanelChrome(selectedFile) {
    if (nodes.overviewSection) nodes.overviewSection.hidden = state.panel.activeTab !== "overview";
    if (nodes.previewSection) nodes.previewSection.hidden = state.panel.activeTab !== "preview";
    if (nodes.rightPanelTabs) {
      nodes.rightPanelTabs.innerHTML = renderRightPanelTabs(selectedFile);
    }
  }

  function renderRightPanelTabs(selectedFile) {
    const overviewActive = state.panel.activeTab === "overview";
    const previewActive = state.panel.activeTab === "preview" && selectedFile;
    return `
      <button type="button" class="right-panel-tab${overviewActive ? " active" : ""}" data-panel-tab="overview">
        <span class="right-panel-tab-label">概览</span>
      </button>
      ${selectedFile ? `
        <button type="button" class="right-panel-tab right-panel-tab-preview${previewActive ? " active" : ""}" data-panel-tab="preview">
          <span class="right-panel-tab-badge">${escapeHTML(selectedFile.accent || "FILE")}</span>
          <span class="right-panel-tab-label">${escapeHTML(selectedFile.name)}</span>
        </button>
      ` : ""}
    `;
  }

  function getExpensePanelFiles() {
    const files = [];
    const draftCreated = state.currentStep > 15 || state.runtime[15] === "success";
    const localDraftDeleted = state.currentStep >= 32;
    if (state.currentStep >= 1) {
      files.push(
        { id: "flight-itinerary-pdf", name: "上海机票行程单.pdf", meta: "输入附件 · PDF", kind: "pdf", accent: "PDF" },
        { id: "hotel-invoice-jpg", name: "酒店发票.jpg", meta: "输入附件 · 图片", kind: "image", accent: "IMG" },
        { id: "taxi-invoice-png", name: "打车发票-03-18.png", meta: "输入附件 · 图片", kind: "image", accent: "IMG" }
      );
    }
    if (draftCreated) {
      files.push({ id: "bx-draft-7781-md", name: "BX-DRAFT-7781.md", meta: "ERP 草稿 · Markdown", kind: "markdown", accent: "MD" });
    }
    if (state.currentStep >= 22) {
      files.push({ id: "oa-approval-preview-html", name: "OA-审批流预览.html", meta: "审批页 · 浏览器预览", kind: "browser", accent: "WEB" });
    }
    if (state.currentStep >= 25 && !localDraftDeleted) {
      files.push({ id: "draft-docx", name: draftDocumentArtifact.name, meta: `产物 · ${draftDocumentArtifact.size}`, kind: "office", accent: "DOCX" });
    }
    if (state.currentStep >= 27) {
      artifacts.slice(1).forEach((artifact) => {
        const kind = artifact.name.endsWith(".xlsx") ? "office" : artifact.name.endsWith(".pdf") ? "pdf" : "file";
        const accent = artifact.name.endsWith(".xlsx") ? "XLSX" : artifact.name.endsWith(".pdf") ? "PDF" : "FILE";
        files.push({ id: artifact.name, name: artifact.name, meta: `产物 · ${artifact.size}`, kind, accent });
      });
    }
    return files;
  }

  function ensureSelectedPreviewFile(files, allowFallback = false) {
    if (!files.length) {
      state.panel.selectedFileId = "";
      return null;
    }
    const current = files.find((file) => file.id === state.panel.selectedFileId);
    if (current) return current;
    if (!allowFallback) return null;
    const preferred = files.find((file) => file.kind === "markdown") || files[0];
    state.panel.selectedFileId = preferred.id;
    return preferred;
  }

  function renderFilePanel(files = getExpensePanelFiles(), selectedFile = ensureSelectedPreviewFile(files, false)) {
    nodes.fileCount.textContent = String(files.length);
    nodes.fileList.innerHTML = files.length
      ? files.map((file) => {
          const active = selectedFile?.id === file.id ? " active" : "";
          return `<button type="button" class="file-item${active}" data-preview-file="${escapeAttr(file.id)}">
            <span class="file-type-pill">${escapeHTML(file.accent || "FILE")}</span>
            <div class="file-item-main"><strong>${escapeHTML(file.name)}</strong></div>
          </button>`;
        }).join("")
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
    if (state.currentStep >= 17) contexts.push({ icon: "globe", name: "ERP 写入授权", meta: "等待或完成授权" });
    if (state.currentStep >= 22) contexts.push({ icon: "globe", name: "OA 审批", meta: "提交成功" });
    if (state.currentStep >= 24)
      contexts.push({ icon: "doc", name: "本地文档生成", meta: state.currentStep >= 32 ? "草稿已删除" : "差旅申请草稿.docx" });

    nodes.contextCount.textContent = String(contexts.length);
    nodes.contextList.innerHTML = contexts.length
      ? contexts.map((item) => `<div class="context-item">${icon(item.icon)}<div><strong>${escapeHTML(item.name)}</strong><span>${escapeHTML(item.meta)}</span></div></div>`).join("")
      : `<div class="panel-empty">暂无工具</div>`;
  }

  function renderPreviewPanel(files = getExpensePanelFiles(), selectedFile = ensureSelectedPreviewFile(files, true)) {
    if (!selectedFile) {
      renderPreviewPlaceholder("选择右侧任务文件后，这里会展示 Markdown、PDF、网页和 Office 预览。");
      return;
    }

    const toolbar = renderPreviewToolbar(selectedFile);
    nodes.previewMeta.textContent = "";
    nodes.previewToolbar.innerHTML = toolbar;
    if (nodes.previewPaneHead) nodes.previewPaneHead.hidden = !toolbar;
    nodes.previewBody.innerHTML = renderPreviewContent(selectedFile);
  }

  function renderPreviewToolbar(file) {
    if (file.kind !== "markdown") {
      return "";
    }
    return `<div class="preview-mode-switch">
      <button
        type="button"
        class="preview-mode-button ${state.panel.markdownMode === "preview" ? "active" : ""}"
        data-markdown-mode="preview"
        aria-label="预览模式"
        title="预览模式"
      >${icon("book")}</button>
      <button
        type="button"
        class="preview-mode-button ${state.panel.markdownMode === "edit" ? "active" : ""}"
        data-markdown-mode="edit"
        aria-label="编辑模式"
        title="编辑模式"
      >${icon("edit")}</button>
    </div>`;
  }

  function renderPreviewContent(file) {
    if (file.kind === "markdown") {
      const source = state.previewDrafts[file.id] || DEFAULT_MARKDOWN_DRAFT;
      if (state.panel.markdownMode === "edit") {
        return `<div class="markdown-editor-shell">
          <textarea class="markdown-editor" data-markdown-editor="true">${escapeHTML(source)}</textarea>
        </div>`;
      }
      return `<article class="markdown-preview">${renderMarkdown(source)}</article>`;
    }

    if (file.kind === "pdf") {
      return renderPdfPreview(file);
    }

    if (file.kind === "browser") {
      return renderBrowserPreview();
    }

    if (file.kind === "office") {
      return renderOfficePreview(file);
    }

    if (file.kind === "image") {
      return renderImagePreview(file);
    }

    return `<div class="preview-empty-state">
      <strong>暂不支持此类型的预览</strong>
      <span>${escapeHTML(file.name)}</span>
    </div>`;
  }

  function renderPreviewPlaceholder(text) {
    nodes.previewMeta.textContent = "";
    if (nodes.previewPaneHead) nodes.previewPaneHead.hidden = true;
    nodes.previewToolbar.innerHTML = "";
    nodes.previewBody.innerHTML = `<div class="preview-empty-state"><strong>预览区已就绪</strong><span>${escapeHTML(text)}</span></div>`;
  }

  /** 用户已发起消息后，直至 Agent 跑完整条流程（差旅 demo 或未结束的企业会话）。 */
  function isAgentTaskExecutionWindow() {
    if (state.route === "agents" || state.route === "automation") return false;
    if (state.chatMode === "enterprise_draft") return false;

    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      if (!session) return false;
      if (session.status === "completed" || session.phase >= 6) return false;
      return true;
    }

    if (state.chatMode === "expense") {
      return state.currentStep >= 1 && state.currentStep < totalSteps;
    }

    return false;
  }

  function shouldDisableComposerSendButton() {
    if (!isAgentTaskExecutionWindow()) return false;
    if (canSubmitRuntimeMessage()) return false;
    if (shouldShowComposerPauseButton()) return false;
    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      if (session?.status === "paused") return false;
    }
    if (state.chatMode === "expense" && state.ui.workflowPaused) return false;
    return true;
  }

  function shouldShowComposerPauseButton() {
    if (state.route === "agents" || state.route === "automation") return false;
    if (canShowRuntimeSendControls() && getComposerDraftText()) return false;

    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      return Boolean(session && session.status === "running" && session.phase < 6);
    }

    if (state.chatMode === "enterprise_draft") return false;
    if (state.ui.workflowPaused) return false;

    const step = steps[state.currentStep - 1];
    const isRunningTransition = step?.autoSuccess && state.runtime[step.id] === "running";
    const hasRunningTool = step?.items?.some((item) => item.kind === "tool_call" && normalizedToolStatus(item, step) === "running");
    return Boolean(isRunningTransition || hasRunningTool);
  }

  function pauseComposerWorkflow() {
    if (state.route === "agents" || state.route === "automation") return;

    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      if (!session || session.status !== "running" || session.phase >= 6) return;
      stopEnterpriseRunTimer();
      session.status = "paused";
      updateEnterpriseSessionListState(session.id, "paused");
      return;
    }

    stopTransitionTimer();
    state.ui.workflowPaused = true;
  }

  function updateComposerSendButton() {
    if (!nodes.sendButton) return;
    renderRuntimeSendControls();
    const runtimeSubmit = canSubmitRuntimeMessage();
    const pauseMode = !runtimeSubmit && shouldShowComposerPauseButton();
    const enterpriseSession =
      state.chatMode === "enterprise_session" ? getEnterpriseSession(state.enterprise.activeSessionId) : null;

    const useEl = nodes.sendButton.querySelector("use");
    if (useEl) useEl.setAttribute("href", pauseMode ? "#icon-pause" : "#icon-send");
    nodes.sendButton.classList.toggle("is-pause", pauseMode);

    const disable = shouldDisableComposerSendButton();
    nodes.sendButton.disabled = disable;

    const expenseResume = state.chatMode === "expense" && state.ui.workflowPaused;
    const enterpriseResume =
      state.chatMode === "enterprise_session" && enterpriseSession?.status === "paused";

    let title = "发送";
    let ariaLabel = "发送";
    if (pauseMode) {
      title = "暂停";
      ariaLabel = "暂停任务";
    } else if (runtimeSubmit) {
      title = state.runtimeSend.mode === "steer" ? "引导发送" : "加入队列";
      ariaLabel = title;
    } else if (enterpriseResume) {
      title = "继续执行任务";
      ariaLabel = "继续执行任务";
    } else if (expenseResume) {
      title = "继续执行";
      ariaLabel = "继续执行任务流";
    } else if (disable && canShowRuntimeSendControls()) {
      title = "输入新消息后可加入队列或引导发送";
      ariaLabel = "输入新消息后发送";
    } else if (disable) {
      title = "任务执行中，完成后可发送新消息";
      ariaLabel = "任务执行中，暂不可发送";
    }

    nodes.sendButton.title = title;
    nodes.sendButton.setAttribute("aria-label", ariaLabel);
  }

  function renderRuntimeSendControls() {
    if (!nodes.sendModeWrap) return;
    const visible = canShowRuntimeSendControls();
    nodes.sendModeWrap.hidden = !visible;
    if (!visible) {
      state.runtimeSend.menuOpen = false;
    }

    const mode = state.runtimeSend.mode === "steer" ? "steer" : "queue";
    if (nodes.sendModeLabel) {
      nodes.sendModeLabel.textContent = mode === "steer" ? "引导发送" : "加入队列";
    }
    if (nodes.sendModeButton) {
      nodes.sendModeButton.setAttribute("aria-expanded", visible && state.runtimeSend.menuOpen ? "true" : "false");
    }
    if (nodes.sendModeMenu) {
      nodes.sendModeMenu.hidden = !visible || !state.runtimeSend.menuOpen;
      nodes.sendModeMenu.querySelectorAll("[data-runtime-send-mode]").forEach((button) => {
        const active = button.getAttribute("data-runtime-send-mode") === mode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-checked", active ? "true" : "false");
      });
    }
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

  function renderPdfPreview(file) {
    return `<div class="pdf-preview-shell">
      <div class="pdf-page-stack">
        <section class="pdf-sheet">
          <div class="pdf-sheet-topline">
            <span>Electronic Ticket / Itinerary Receipt</span>
            <span>票号 781-2465630198</span>
          </div>
          <div class="pdf-sheet-header">
            <div class="pdf-sheet-brand">
              <div class="pdf-sheet-logo">上航</div>
              <div>
                <strong>上海航空电子客票行程单</strong>
                <span>Passenger Itinerary / Receipt</span>
              </div>
            </div>
            <div class="pdf-sheet-side">
              <span>开具日期</span>
              <strong>2026-03-18 09:42</strong>
            </div>
          </div>
          <div class="pdf-sheet-section">旅客信息</div>
          <div class="pdf-form-grid">
            <div><label>旅客姓名</label><strong>王敏 / WANGMIN</strong></div>
            <div><label>证件类型</label><strong>居民身份证</strong></div>
            <div><label>订单编号</label><strong>SHA260318FM9331</strong></div>
            <div><label>承运人</label><strong>上海航空 FM</strong></div>
          </div>
          <div class="pdf-sheet-section">行程信息</div>
          <table class="pdf-table">
            <thead>
              <tr>
                <th>航段</th>
                <th>日期</th>
                <th>航班</th>
                <th>舱位</th>
                <th>起飞 / 到达</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>北京大兴 → 上海虹桥</td>
                <td>2026-03-18</td>
                <td>FM9331</td>
                <td>Y</td>
                <td>08:35 / 10:55</td>
              </tr>
            </tbody>
          </table>
          <div class="pdf-sheet-section">票款信息</div>
          <table class="pdf-table pdf-table-compact">
            <tbody>
              <tr><td>票价 Fare</td><td>¥1,640.00</td></tr>
              <tr><td>民航发展基金 CN</td><td>¥50.00</td></tr>
              <tr><td>燃油附加费 YQ</td><td>¥170.00</td></tr>
              <tr class="is-total"><td>合计 Total</td><td>¥1,860.00</td></tr>
            </tbody>
          </table>
          <div class="pdf-sheet-footer">
            <div class="pdf-note-block">
              <strong>报销提示</strong>
              <span>本行程单仅作为旅客报销凭证使用，不作为机场乘机凭证。</span>
            </div>
            <div class="pdf-barcode-block">
              <div class="pdf-barcode"></div>
              <span>验真码 8402 1931 5527</span>
            </div>
          </div>
        </section>
        <section class="pdf-sheet pdf-sheet-secondary">
          <div class="pdf-sheet-topline">
            <span>附件联</span>
            <span>Page 2 / 2</span>
          </div>
          <div class="pdf-sheet-header secondary">
            <div class="pdf-sheet-brand">
              <div>
                <strong>税费及行程附注</strong>
                <span>Tax details / Remarks</span>
              </div>
            </div>
          </div>
          <div class="pdf-remark-list">
            <div><label>客票状态</label><strong>已出票 / OPEN FOR USE</strong></div>
            <div><label>销售渠道</label><strong>上海航空官网直营</strong></div>
            <div><label>付款方式</label><strong>企业对公月结</strong></div>
            <div><label>改退规则</label><strong>起飞前可改期，退票按舱位规则执行</strong></div>
          </div>
          <table class="pdf-table pdf-table-compact">
            <thead>
              <tr>
                <th>项目</th>
                <th>金额</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>国内客票款</td><td>¥1,640.00</td></tr>
              <tr><td>民航发展基金</td><td>¥50.00</td></tr>
              <tr><td>燃油附加费</td><td>¥170.00</td></tr>
              <tr class="is-total"><td>实收金额</td><td>¥1,860.00</td></tr>
            </tbody>
          </table>
          <div class="pdf-note-panel">
            <p>出票单位：上海航空股份有限公司电子商务部</p>
            <p>地址：上海市长宁区空港一路 528 号</p>
            <p>服务热线：95530</p>
          </div>
        </section>
      </div>
    </div>`;
  }

  function renderBrowserPreview() {
    const srcdoc = `
      <html>
        <body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;background:#f8fafc;color:#0f172a;">
          <div style="padding:24px 28px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
              <div>
                <div style="font-size:12px;color:#64748b;">OA 审批中心</div>
                <div style="font-size:24px;font-weight:700;">上海出差报销审批</div>
              </div>
              <div style="padding:8px 12px;border-radius:999px;background:#dcfce7;color:#166534;font-size:12px;">待提交</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;">
              <div style="padding:14px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;"><div style="font-size:12px;color:#64748b;">报销单号</div><div style="margin-top:6px;font-weight:700;">BX20260423001</div></div>
              <div style="padding:14px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;"><div style="font-size:12px;color:#64748b;">申请金额</div><div style="margin-top:6px;font-weight:700;">¥3,847</div></div>
              <div style="padding:14px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;"><div style="font-size:12px;color:#64748b;">附件数</div><div style="margin-top:6px;font-weight:700;">4</div></div>
            </div>
            <div style="padding:18px;border:1px solid #dbeafe;border-radius:16px;background:#eff6ff;">
              <div style="font-size:14px;font-weight:600;">审批路径</div>
              <div style="display:flex;gap:12px;align-items:center;margin-top:12px;color:#1d4ed8;">
                <span>提单人</span><span>→</span><span>财务复核</span><span>→</span><span>部门负责人</span><span>→</span><span>归档</span>
              </div>
            </div>
          </div>
        </body>
      </html>`;
    return `<div class="browser-preview-shell">
      <div class="browser-chrome">
        <span class="browser-dot red"></span>
        <span class="browser-dot yellow"></span>
        <span class="browser-dot green"></span>
        <div class="browser-address">https://oa.mock.local/travel/BX-DRAFT-7781</div>
      </div>
      <iframe class="browser-preview-frame" title="审批流网页预览" srcdoc="${escapeAttr(srcdoc)}"></iframe>
    </div>`;
  }

  function renderOfficePreview(file) {
    if (file.name.endsWith(".xlsx")) {
      return `<div class="office-sheet-shell">
        <div class="office-sheet-bar">
          <strong>${escapeHTML(file.name)}</strong>
          <span>Sheet1 · 附件清单</span>
        </div>
        <div class="office-grid">
          <div class="office-grid-head">附件名称</div>
          <div class="office-grid-head">类型</div>
          <div class="office-grid-head">金额</div>
          <div class="office-grid-head">状态</div>
          <div>上海机票行程单.pdf</div><div>PDF</div><div>¥1,860</div><div>已核验</div>
          <div>酒店发票.jpg</div><div>Image</div><div>¥1,428</div><div>已核验</div>
          <div>打车发票-03-18.png</div><div>Image</div><div>¥559</div><div>已核验</div>
        </div>
      </div>`;
    }

    return `<div class="office-doc-shell">
      <div class="office-doc-page">
        <div class="office-doc-header">
          <span>Word 预览</span>
          <strong>${escapeHTML(file.name)}</strong>
        </div>
        <h1>差旅申请草稿</h1>
        <p>申请人：王敏</p>
        <p>报销单号：BX20260423001</p>
        <h2>费用摘要</h2>
        <ul>
          <li>机票：¥1,860</li>
          <li>酒店：¥1,428</li>
          <li>打车：¥559</li>
        </ul>
        <h2>流转状态</h2>
        <p>已生成 ERP 草稿，待提交 OA 审批。</p>
      </div>
    </div>`;
  }

  function renderImagePreview(file) {
    const title = file.name.includes("酒店") ? "酒店发票影像" : "打车票据影像";
    const amount = file.name.includes("酒店") ? "¥1,428" : "¥559";
    return `<div class="image-preview-shell">
      <div class="image-preview-card">
        <div class="image-preview-head">
          <strong>${escapeHTML(title)}</strong>
          <span>${escapeHTML(file.name)}</span>
        </div>
        <div class="receipt-mock">
          <div class="receipt-line w92"></div>
          <div class="receipt-line w68"></div>
          <div class="receipt-line w84"></div>
          <div class="receipt-amount">${escapeHTML(amount)}</div>
          <div class="receipt-line w58"></div>
        </div>
      </div>
    </div>`;
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || "").replace(/\r/g, "").split("\n");
    const chunks = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        const level = heading[1].length;
        chunks.push(`<h${level}>${renderMarkdownInline(heading[2])}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        const parts = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          parts.push(lines[index].replace(/^>\s?/, ""));
          index += 1;
        }
        chunks.push(`<blockquote>${parts.map((part) => `<p>${renderMarkdownInline(part)}</p>`).join("")}</blockquote>`);
        continue;
      }

      if (/^[-*]\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^[-*]\s+/, ""));
          index += 1;
        }
        chunks.push(`<ul>${items.map((item) => `<li>${renderMarkdownInline(item)}</li>`).join("")}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(line)) {
        const items = [];
        while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
          items.push(lines[index].replace(/^\d+\.\s+/, ""));
          index += 1;
        }
        chunks.push(`<ol>${items.map((item) => `<li>${renderMarkdownInline(item)}</li>`).join("")}</ol>`);
        continue;
      }

      const paragraph = [];
      while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s+/.test(lines[index]) && !/^>\s?/.test(lines[index]) && !/^[-*]\s+/.test(lines[index]) && !/^\d+\.\s+/.test(lines[index])) {
        paragraph.push(lines[index]);
        index += 1;
      }
      chunks.push(`<p>${renderMarkdownInline(paragraph.join(" "))}</p>`);
    }

    return chunks.join("");
  }

  function renderMarkdownInline(text) {
    return escapeHTML(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>");
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
      paused: icon("pause"),
      completed: icon("check"),
      error: icon("warning")
    };
    return map[status] || "";
  }

  function automationRunStatusIcon(status) {
    const normalized = status || "idle";
    if (normalized === "running") return '<span class="spinner"></span>';
    if (normalized === "error") return icon("warning");
    if (normalized === "awaiting") return icon("clock");
    return icon("check");
  }

  function mapAutomationStatus(status) {
    if (status === "success") return "completed";
    if (status === "failed") return "error";
    if (status === "never") return "idle";
    return status || "idle";
  }

  function parseDateTime(value) {
    if (!value) return null;
    const parsed = new Date(String(value).trim().replace(" ", "T"));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatRelativeDateTime(value) {
    const date = parseDateTime(value);
    if (!date) return "未执行";
    const diffMs = Date.now() - date.getTime();
    if (diffMs <= 0) return "刚刚";
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 60) return diffMinutes <= 1 ? "刚刚" : `${diffMinutes}分钟前`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `${diffDays}天前`;
    return String(value).slice(0, 10);
  }

  function buildAutomationRunId(taskId, index) {
    return `${taskId}::run-${index + 1}`;
  }

  function deriveAutomationWorkspaceName(task) {
    if (task.workspace_name) return task.workspace_name;
    const stamp =
      String(task.last_run_at || "")
        .replace(/\D/g, "")
        .slice(0, 12) || "202604211305";
    return `automation-${stamp}`;
  }

  function getAutomationTaskSource() {
    if (window.AutomationTasksModule?.getTasks) {
      return window.AutomationTasksModule.getTasks();
    }
    return Array.isArray(window.AUTOMATION_TASKS_MOCK) ? window.AUTOMATION_TASKS_MOCK : [];
  }

  function getAutomationSidebarTasks() {
    return getAutomationTaskSource().map((task) => {
      const runs = Array.isArray(task.recent_runs)
        ? task.recent_runs.slice(0, 5).map((run, index) => ({
            id: buildAutomationRunId(task.id, index),
            title: task.name || `自动化任务 ${index + 1}`,
            timeLabel: run.sidebar_relative || formatRelativeDateTime(run.triggered_at),
            status: mapAutomationStatus(run.result),
            summary: run.summary || ""
          }))
        : [];
      return {
        id: task.id,
        title: task.name || "未命名任务",
        workspaceName: deriveAutomationWorkspaceName(task),
        triggerSummary: task.trigger_summary || "",
        status: mapAutomationStatus(task.last_run_status),
        runs
      };
    });
  }

  function syncAutomationSidebarState() {
    const tasks = getAutomationSidebarTasks();
    const taskIds = new Set(tasks.map((task) => task.id));
    const previousExpandedCount = state.automationSidebar.expandedTaskIds.length;
    state.automationSidebar.expandedTaskIds = state.automationSidebar.expandedTaskIds.filter((id) => taskIds.has(id));
    const needsDefaultExpansion =
      !state.automationSidebar.initialized ||
      (previousExpandedCount > 0 && !state.automationSidebar.expandedTaskIds.length && tasks.length > 0);
    if (needsDefaultExpansion && !state.automationSidebar.expandedTaskIds.length) {
      const firstRunnableTask = tasks.find((task) => task.runs.length) || tasks[0];
      state.automationSidebar.expandedTaskIds = firstRunnableTask ? [firstRunnableTask.id] : [];
    }
    state.automationSidebar.initialized = true;

    if (!taskIds.has(state.automationSidebar.activeTaskId)) {
      state.automationSidebar.activeTaskId = "";
    }

    const activeTask = tasks.find((task) => task.id === state.automationSidebar.activeTaskId);
    if (!activeTask?.runs.some((run) => run.id === state.automationSidebar.activeRunId)) {
      state.automationSidebar.activeRunId = "";
    }
  }

  function handleAutomationTasksUpdated() {
    syncAutomationSidebarState();
    renderRecentTasks();
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
      if (state.route === "agents" || state.route === "automation") {
        nodes.stream.scrollTop = 0;
        return;
      }
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

  function toggleAutomationSidebarTask(id) {
    if (!id) return;
    closeSessionMenu(false);
    const expanded = state.automationSidebar.expandedTaskIds.includes(id);
    state.automationSidebar.expandedTaskIds = expanded
      ? state.automationSidebar.expandedTaskIds.filter((taskId) => taskId !== id)
      : state.automationSidebar.expandedTaskIds.concat(id);
    if (expanded && state.automationSidebar.activeTaskId === id) {
      state.automationSidebar.activeRunId = "";
    }
    renderRecentTasks();
  }

  function toggleSessionGroup(groupKey) {
    if (groupKey !== "recents") return;
    closeSessionMenu(false);
    state.ui.recentsExpanded = !state.ui.recentsExpanded;
    renderRecentTasks();
  }

  function openAutomationRun(taskId, runId) {
    if (!taskId || !runId) return;
    closeSessionMenu(false);
    if (!state.automationSidebar.expandedTaskIds.includes(taskId)) {
      state.automationSidebar.expandedTaskIds = state.automationSidebar.expandedTaskIds.concat(taskId);
    }
    state.automationSidebar.activeTaskId = taskId;
    state.automationSidebar.activeRunId = runId;
    navigate("automation");
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
    delete state.enterpriseSessions[id];
    state.sessionMenuId = null;
    state.renamingSessionId = null;
    state.renameDraft = "";
    if (wasActive && state.sessions.length) {
      state.sessions.forEach((task, index) => {
        task.active = index === 0;
      });
      const active = getActiveSession();
      if (active?.kind === "enterprise") {
        state.chatMode = "enterprise_session";
        state.enterprise.activeSessionId = active.id;
      } else {
        state.chatMode = "expense";
        state.enterprise.activeSessionId = "";
      }
    }
    renderRecentTasks();
  }

  function setActiveSession(id) {
    const target = findSession(id);
    if (!target) return;
    stopEnterpriseRunTimer();
    let changed = false;
    state.sessions.forEach((task) => {
      const nextActive = task.id === id;
      if (task.active !== nextActive) changed = true;
      task.active = nextActive;
    });
    state.route = "chat";
    if (target.kind === "enterprise") {
      state.chatMode = "enterprise_session";
      state.enterprise.activeSessionId = target.id;
      state.enterprise.draftAgentId = target.enterpriseAgentId || getEnterpriseSession(target.id)?.agentId || "";
      const session = getEnterpriseSession(target.id);
      nodes.composerTextarea.value = "";
      if (session?.status === "running" && session.phase < 6) {
        startEnterpriseRun(target.id);
      }
    } else {
      state.chatMode = "expense";
      state.enterprise.activeSessionId = "";
      nodes.composerTextarea.value = "";
    }
    if (changed) renderRecentTasks();
    render();
  }

  function findSession(id) {
    return state.sessions.find((task) => task.id === id) || null;
  }

  init();
})();
