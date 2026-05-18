(() => {
  const {
    steps,
    todoItems,
    artifacts,
    draftDocumentArtifact,
    recentTasks,
    enterpriseAgentCategoryTabs: rawEnterpriseAgentCategoryTabs,
    enterpriseAgents: rawEnterpriseAgents,
    enterpriseFlowPresets: rawEnterpriseFlowPresets,
    skillPlazaSourceFilters: rawSkillPlazaSourceFilters,
    skillPlazaCategoryFilters: rawSkillPlazaCategoryFilters,
    skillPlazaSkills: rawSkillPlazaSkills,
    skillMineItems: rawSkillMineItems
  } = window.DEMO_DATA;
  const enterpriseAgentCategoryTabs = Array.isArray(rawEnterpriseAgentCategoryTabs) ? rawEnterpriseAgentCategoryTabs : [];
  const enterpriseAgents = Array.isArray(rawEnterpriseAgents) ? rawEnterpriseAgents : [];
  const skillPlazaSourceFilters = Array.isArray(rawSkillPlazaSourceFilters) ? rawSkillPlazaSourceFilters : [];
  const skillPlazaCategoryFilters = Array.isArray(rawSkillPlazaCategoryFilters) ? rawSkillPlazaCategoryFilters : [];
  const skillPlazaSkills = Array.isArray(rawSkillPlazaSkills) ? rawSkillPlazaSkills : [];
  const skillMineItems = Array.isArray(rawSkillMineItems) ? rawSkillMineItems : [];
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
    },
    skillPlaza: {
      query: "",
      source: "all",
      category: "all",
      sort: "downloads"
    },
    skillPlazaFavoriteOverrides: {},
    skillHubTab: "plaza",
    skillMine: {
      query: "",
      source: "all",
      page: 1,
      pageSize: 10,
      jumpInput: "",
      enabledOverrides: {},
      deletedIds: {},
      importedFromPlaza: []
    },
    productDocs: {
      tab: "request",
      flows: {
        request: { phase: "pending", outcome: "success" },
        code: { phase: "pending", outcome: "success" }
      }
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
    enterpriseOverviewIdle: document.getElementById("enterpriseOverviewIdle"),
    enterpriseOverviewPanels: document.getElementById("enterpriseOverviewPanels"),
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

  const PRODUCT_DOC_TABS = [
    { id: "request", label: "请求响应类", icon: "globe" },
    { id: "code", label: "代码执行类", icon: "terminal" }
  ];

  const PRODUCT_DOC_STAGES = [
    { id: "pending", label: "等待执行", code: "pending", tone: "pending" },
    { id: "approval_required", label: "等待用户授权", code: "approval_required", tone: "approval" },
    { id: "denied", label: "已拒绝", code: "denied", tone: "denied" },
    { id: "running", label: "执行中", code: "running", tone: "running" },
    { id: "success", label: "完成", code: "success", tone: "success" },
    { id: "failed", label: "失败", code: "failed", tone: "failed" }
  ];

  const PRODUCT_DOC_DEMOS = {
    request: {
      title: "提交差旅申请（MCP）",
      pendingTitle: "提交差旅申请（MCP）",
      runningTitle: "正在提交差旅申请（MCP）",
      approvalCopy: "Agent 将代表你向差旅系统提交申请，请确认本次差旅申请记录。",
      approvalSubcopy: "",
      runningCopy: "",
      deniedCopy: "",
      successCopy: "",
      failedCopy: "",
      requestLine: "POST /api/travel/applications",
      request: {
        title: "北京出差申请",
        employee_id: "E12345",
        department: "市场部",
        destination: "北京",
        start_date: "2026-05-20",
        end_date: "2026-05-22",
        purpose: "参与市场活动及洽谈",
        estimated_cost: 3200,
        attachments: [{ type: "file", name: "会议邀请函.pdf" }]
      },
      successResponse: {
        code: 0,
        message: "success",
        data: {
          application_id: "TRV20260518101622",
          status: "Submitted",
          submit_time: "2026-05-18T10:16:22"
        }
      },
      errorResponse: {
        code: 4000,
        message: "日期不合法，无法提交申请",
        detail: "出发日期晚于返程日期，预计费用 3200 元"
      },
      failureDetailLabel: "服务端返回"
    },
    code: {
      title: "执行高敏命令",
      pendingTitle: "执行高敏命令",
      runningTitle: "执行高敏命令",
      waitingCopy: "Agent 已生成命令，正在排队等待执行。",
      approvalCopy: "Agent 请求在生产预算系统批量调增市场部差旅预算上限，该命令会写入生产数据库并影响后续审批额度，请确认。",
      approvalSubcopy: "",
      runningCopy: "正在执行生产预算批量写入命令，请稍候...",
      deniedCopy: "",
      successCopy: "命令已执行完成，生产预算策略已更新。",
      failedCopy: "命令执行失败，已停止写入并保留错误输出。",
      commandType: "shell",
      command: "python3 ops/budget_admin.py apply-adjustment --env prod --department 市场部 --percent 20 --commit",
      runningOutput: [
        "Connecting to prod-budget-db.internal ...",
        "Matched 18 travel budget policies",
        "Writing adjustment percent=20 to department=市场部 ...",
        "Audit log stream opened: AUD-20260518-101622"
      ].join("\n"),
      successOutput: [
        "Updated 18 travel budget policies",
        "Audit id: AUD-20260518-101622",
        "Affected approval rules: 6",
        "Exit code: 0"
      ].join("\n"),
      errorOutput: [
        "ERROR: production budget table is locked",
        "Rollback complete; no partial update remains",
        "Exit code: 1"
      ].join("\n"),
      failureDetailLabel: "执行输出"
    }
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

      const hubTab = event.target.closest("[data-skill-hub-tab]");
      if (hubTab) {
        event.preventDefault();
        state.skillHubTab = hubTab.getAttribute("data-skill-hub-tab") === "mine" ? "mine" : "plaza";
        render();
        return;
      }

      const productDocTab = event.target.closest("[data-product-doc-tab]");
      if (productDocTab) {
        event.preventDefault();
        const tab = productDocTab.getAttribute("data-product-doc-tab") === "code" ? "code" : "request";
        state.productDocs.tab = tab;
        render();
        return;
      }

      const productDocAction = event.target.closest("[data-product-doc-action]");
      if (productDocAction) {
        event.preventDefault();
        handleProductDocAction(productDocAction.getAttribute("data-product-doc-action"));
        return;
      }

      const productDocPhase = event.target.closest("[data-product-doc-phase]");
      if (productDocPhase) {
        event.preventDefault();
        jumpProductDocPhase(productDocPhase.getAttribute("data-product-doc-phase"));
        return;
      }

      const productDocOutcome = event.target.closest("[data-product-doc-outcome]");
      if (productDocOutcome) {
        event.preventDefault();
        handleProductDocOutcome(productDocOutcome.getAttribute("data-product-doc-outcome"));
        return;
      }

      const mineRefresh = event.target.closest("[data-skill-mine-refresh]");
      if (mineRefresh) {
        showSkillPlazaToast("技能列表已刷新。");
        return;
      }

      const mineImport = event.target.closest("[data-skill-mine-import]");
      if (mineImport) {
        showSkillPlazaToast("导入技能入口即将接入。");
        return;
      }

      const minePrev = event.target.closest("[data-skill-mine-prev]");
      if (minePrev) {
        if (minePrev.hasAttribute("disabled")) return;
        event.preventDefault();
        state.skillMine.page = Math.max(1, state.skillMine.page - 1);
        render();
        return;
      }

      const mineNext = event.target.closest("[data-skill-mine-next]");
      if (mineNext) {
        if (mineNext.hasAttribute("disabled")) return;
        event.preventDefault();
        const filtered = filterSkillMineList();
        const totalPages = Math.max(1, Math.ceil(filtered.length / state.skillMine.pageSize));
        state.skillMine.page = Math.min(totalPages, state.skillMine.page + 1);
        render();
        return;
      }

      const minePageBtn = event.target.closest("[data-skill-mine-page]");
      if (minePageBtn) {
        event.preventDefault();
        const p = Number(minePageBtn.getAttribute("data-skill-mine-page"));
        if (!Number.isFinite(p)) return;
        state.skillMine.page = p;
        render();
        return;
      }

      const minePageSizeBtn = event.target.closest("[data-skill-mine-page-size]");
      if (minePageSizeBtn) {
        event.preventDefault();
        const n = Number(minePageSizeBtn.getAttribute("data-skill-mine-page-size"));
        if (![10, 20, 50].includes(n)) return;
        state.skillMine.pageSize = n;
        const filtered = filterSkillMineList();
        const totalPages = Math.max(1, Math.ceil(filtered.length / state.skillMine.pageSize));
        state.skillMine.page = Math.min(state.skillMine.page, totalPages);
        render();
        return;
      }

      const mineJumpApply = event.target.closest("[data-skill-mine-jump-apply]");
      if (mineJumpApply) {
        event.preventDefault();
        applySkillMineJump();
        return;
      }

      const mineOrigin = event.target.closest("[data-skill-mine-origin]");
      if (mineOrigin) {
        event.preventDefault();
        const v = mineOrigin.getAttribute("data-skill-mine-origin") || "all";
        state.skillMine.source = v === "builtin" ? "builtin" : v === "mine" ? "mine" : "all";
        state.skillMine.page = 1;
        render();
        return;
      }

      const mineToggle = event.target.closest("[data-skill-mine-toggle]");
      if (mineToggle) {
        event.preventDefault();
        const id = mineToggle.getAttribute("data-skill-mine-toggle") || "";
        const item = findSkillMineItemById(id);
        if (!item) return;
        const cur = isSkillMineEnabled(item);
        state.skillMine.enabledOverrides[id] = !cur;
        const def = item.defaultEnabled !== false;
        if (state.skillMine.enabledOverrides[id] === def) delete state.skillMine.enabledOverrides[id];
        render();
        return;
      }

      const mineDelete = event.target.closest("[data-skill-mine-delete]");
      if (mineDelete) {
        event.preventDefault();
        const id = mineDelete.getAttribute("data-skill-mine-delete") || "";
        const item = findSkillMineItemById(id);
        if (!id) return;
        if (item && item.origin === "builtin") return;
        state.skillMine.deletedIds[id] = true;
        showSkillPlazaToast(item ? `已删除「${item.name}」` : "已删除");
        state.skillMine.page = 1;
        render();
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

      const plazaSrc = event.target.closest("[data-skill-plaza-source]");
      if (plazaSrc) {
        event.preventDefault();
        state.skillPlaza.source = plazaSrc.getAttribute("data-skill-plaza-source") || "all";
        render();
        return;
      }

      const plazaCat = event.target.closest("[data-skill-plaza-category]");
      if (plazaCat) {
        event.preventDefault();
        state.skillPlaza.category = plazaCat.getAttribute("data-skill-plaza-category") || "all";
        render();
        return;
      }

      const plazaSort = event.target.closest("[data-skill-plaza-sort]");
      if (plazaSort) {
        event.preventDefault();
        const mode = plazaSort.getAttribute("data-skill-plaza-sort");
        state.skillPlaza.sort = mode === "updatedAt" ? "updatedAt" : "downloads";
        render();
        return;
      }

      const plazaFav = event.target.closest("[data-skill-plaza-fav]");
      if (plazaFav) {
        event.preventDefault();
        event.stopPropagation();
        toggleSkillPlazaFavorite(plazaFav.getAttribute("data-skill-plaza-fav") || "");
        render();
        return;
      }

      const plazaDl = event.target.closest("[data-skill-plaza-dl]");
      if (plazaDl) {
        event.preventDefault();
        event.stopPropagation();
        const id = plazaDl.getAttribute("data-skill-plaza-dl") || "";
        const sk = skillPlazaSkills.find((s) => s.id === id);
        showSkillPlazaToast(sk ? `已开始下载「${sk.name}」（演示）` : "下载");
        return;
      }

      const plazaAddMine = event.target.closest("[data-skill-plaza-add-mine]");
      if (plazaAddMine) {
        event.preventDefault();
        event.stopPropagation();
        addPlazaSkillToMine(plazaAddMine.getAttribute("data-skill-plaza-add-mine") || "");
        return;
      }

      const plazaDep = event.target.closest("[data-skill-plaza-dep]");
      if (plazaDep) {
        event.stopPropagation();
        return;
      }

      const plazaCard = event.target.closest("[data-skill-plaza-card]");
      if (plazaCard) {
        event.preventDefault();
        const id = plazaCard.getAttribute("data-skill-plaza-card") || "";
        const sk = skillPlazaSkills.find((s) => s.id === id);
        showSkillPlazaToast(sk ? `查看技能「${sk.name}」（演示）` : "");
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

      const plazaSearch = event.target.closest("[data-skill-plaza-search]");
      if (plazaSearch) {
        state.skillPlaza.query = plazaSearch.value || "";
        render();
      }

      const mineSearch = event.target.closest("[data-skill-mine-search]");
      if (mineSearch) {
        state.skillMine.query = mineSearch.value || "";
        state.skillMine.page = 1;
        render();
      }

      const mineJumpField = event.target.closest("[data-skill-mine-jump]");
      if (mineJumpField) {
        state.skillMine.jumpInput = mineJumpField.value || "";
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

      const mineJumpKey = event.target.closest("[data-skill-mine-jump]");
      if (mineJumpKey && event.key === "Enter") {
        event.preventDefault();
        applySkillMineJump();
        return;
      }

      const clarifyInput = event.target.closest("[data-clarify-custom-input]");
      if (!clarifyInput) {
        const plazaCardKey = event.target.closest("[data-skill-plaza-card]");
        if (plazaCardKey && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          const id = plazaCardKey.getAttribute("data-skill-plaza-card") || "";
          const sk = skillPlazaSkills.find((s) => s.id === id);
          showSkillPlazaToast(sk ? `查看技能「${sk.name}」（演示）` : "");
        }
        return;
      }
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
        state.runtimeSend.mode = modeButton.getAttribute("data-runtime-send-mode") === "parallel" ? "parallel" : "queue";
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

    document.addEventListener("keydown", (event) => {
      if (state.route !== "product") return;
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      if (event.target.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      if (event.key === "ArrowRight") {
        advanceProductDocFlow();
      } else {
        retreatProductDocFlow();
      }
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
      if (isStandaloneRoute()) return;
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
    if (isStandaloneRoute()) return;
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

  function isStandaloneRoute(route = state.route) {
    return route === "agents" || route === "automation" || route === "skillhub" || route === "product";
  }

  function hydrateRouteFromHash() {
    const hash = String(window.location.hash || "").replace(/^#/, "").trim();
    if (hash === "agents") {
      state.route = "agents";
    } else if (hash === "automation") {
      state.route = "automation";
    } else if (hash === "skillhub") {
      state.route = "skillhub";
    } else if (hash === "product") {
      state.route = "product";
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
    const nextRoute =
      route === "agents"
        ? "agents"
        : route === "automation"
          ? "automation"
          : route === "skillhub"
            ? "skillhub"
            : route === "product"
              ? "product"
              : "chat";
    if (window.location.hash !== `#${nextRoute}`) {
      window.location.hash = nextRoute;
    }
    state.route = nextRoute;
    if (isStandaloneRoute()) {
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
    if (current?.blockAdvanceUntilComplete && state.runtime[current.id] !== "success") {
      render();
      scheduleTransition();
      return;
    }
    if (current?.hitl) {
      if (current.hitl === "permission") {
        if (isPermissionAllowed(state.hitl.permission)) {
          goTo(getPermissionAdvanceStep(current));
          return;
        }
        if (isPermissionDenied(state.hitl.permission)) {
          render();
          return;
        }
        resolveHitl(current.hitl, "allow-once");
        return;
      }
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
    if (kind === "permission") {
      render();
      return;
    }
    goTo(state.currentStep + 1);
  }

  function isPermissionAllowed(value) {
    return value === "allow-once" || value === "always-allow" || value === "next";
  }

  function isPermissionDenied(value) {
    return value === "deny-permission";
  }

  function getPermissionAdvanceStep(step) {
    const tool = step?.items?.find((item) => item.kind === "tool_call" && item.status === "needs_approval");
    return tool?.advanceTo || step?.advanceTo || state.currentStep + 1;
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
        render();
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
    nodes.appShell.classList.toggle("route-skillhub", state.route === "skillhub");
    nodes.appShell.classList.toggle("route-product", state.route === "product");
    nodes.appShell.classList.toggle("route-chat", state.route === "chat");
    nodes.appShell.classList.toggle("preview-focused", state.panel.activeTab === "preview");
    const shellPanelsHidden = isStandaloneRoute();
    nodes.composerCard.hidden = shellPanelsHidden;
    if (nodes.composerProgressDock) nodes.composerProgressDock.hidden = shellPanelsHidden || !shouldShowComposerProgressDock();
    if (nodes.runtimeQueueDock && shellPanelsHidden) nodes.runtimeQueueDock.hidden = true;
    nodes.rightPanel.hidden = shellPanelsHidden;
    if (nodes.panelResizer) nodes.panelResizer.hidden = shellPanelsHidden;
    nodes.appShell.style.setProperty("--right-panel-width", `${state.panel.width}px`);

    nodes.appShell.querySelectorAll("[data-route]").forEach((button) => {
      button.classList.toggle("active", button.getAttribute("data-route") === state.route);
    });
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

  function skillPlazaHasChineseText(value) {
    return /[\u4e00-\u9fff]/.test(value);
  }

  function getSkillPlazaSourceText(skill) {
    return skill.sourceType === "platform" ? "AgentFoundry 精选" : skill.author;
  }

  function getSkillPlazaAudienceBadgeLabel(skill) {
    const row = skillPlazaCategoryFilters.find((f) => f.value === skill.audienceCategory);
    return row ? row.label : "通用";
  }

  function getSkillPlazaIconId(skill) {
    const n = skill.name;
    if (n.includes("公文")) return "icon-edit";
    if (n.includes("制度") || n.includes("流程")) return "icon-doc";
    if (n.includes("问数")) return "icon-chart-bars";
    if (n.includes("邮件")) return "icon-mail";
    if (n.includes("通知") || n.includes("蓝信")) return "icon-bell";
    if (n.includes("差旅") || n.includes("报销")) return "icon-plane-ticket";
    switch (skill.audienceCategory) {
      case "dev":
        return "icon-wrench";
      case "data":
        return "icon-chart-bars";
      case "communication":
        return "icon-messages";
      case "content":
        return "icon-building";
      case "efficiency":
        return "icon-spark";
      case "security":
        return "icon-shield";
      default:
        return "icon-agent";
    }
  }

  function isSkillPlazaFavorite(skill) {
    const d = Boolean(skill.isFavorite);
    return state.skillPlazaFavoriteOverrides[skill.id] !== undefined
      ? state.skillPlazaFavoriteOverrides[skill.id]
      : d;
  }

  function toggleSkillPlazaFavorite(skillId) {
    const skill = skillPlazaSkills.find((s) => s.id === skillId);
    if (!skill) return;
    const def = Boolean(skill.isFavorite);
    const cur = isSkillPlazaFavorite(skill);
    const next = !cur;
    if (next === def) {
      delete state.skillPlazaFavoriteOverrides[skillId];
    } else {
      state.skillPlazaFavoriteOverrides[skillId] = next;
    }
  }

  function filterSkillPlazaSkills() {
    const q = state.skillPlaza.query.trim().toLowerCase();
    const src = state.skillPlaza.source;
    const cat = state.skillPlaza.category;
    const sort = state.skillPlaza.sort;

    const list = skillPlazaSkills.filter((skill) => {
      const matchesSource =
        src === "all" ? true : src === "favorite" ? isSkillPlazaFavorite(skill) : skill.sourceType === src;
      const matchesCat = cat === "all" || skill.audienceCategory === cat;
      if (!q) return matchesSource && matchesCat;
      const blob = [skill.name, skill.description, skill.category, ...(skill.tags || [])].join(" ").toLowerCase();
      return matchesSource && matchesCat && blob.includes(q);
    });

    return list.sort((left, right) => {
      if (sort === "updatedAt") {
        const d = right.publishedAt.localeCompare(left.publishedAt, "zh-CN");
        if (d !== 0) return d;
      } else {
        const d = right.downloads - left.downloads;
        if (d !== 0) return d;
      }
      const c = Number(skillPlazaHasChineseText(right.name)) - Number(skillPlazaHasChineseText(left.name));
      if (c !== 0) return c;
      return left.name.localeCompare(right.name, "zh-CN");
    });
  }

  function findSkillMineItemById(id) {
    return [...skillMineItems, ...state.skillMine.importedFromPlaza].find((i) => i.id === id);
  }

  function plazaPublishedAtToMineUpdatedAt(publishedAt) {
    const s = String(publishedAt || "").trim();
    const m = /^(\d{2})-(\d{2})\s+(\d{1,2}:\d{2})$/.exec(s);
    if (!m) return s;
    return `2026-${m[1]}-${m[2]} ${m[3]}`;
  }

  function addPlazaSkillToMine(plazaId) {
    const skill = skillPlazaSkills.find((s) => s.id === plazaId);
    if (!skill) return;
    const mineId = `from-plaza-${skill.id}`;
    delete state.skillMine.deletedIds[mineId];
    delete state.skillMine.enabledOverrides[mineId];
    const entry = {
      id: mineId,
      origin: "mine",
      name: skill.name,
      description: skill.description,
      updatedAt: plazaPublishedAtToMineUpdatedAt(skill.publishedAt),
      defaultEnabled: true,
      symbolId: getSkillPlazaIconId(skill)
    };
    const arr = state.skillMine.importedFromPlaza;
    const idx = arr.findIndex((x) => x.id === mineId);
    if (idx >= 0) arr[idx] = entry;
    else arr.push(entry);
    state.skillHubTab = "mine";
    showSkillPlazaToast(`已添加「${skill.name}」至我的 Claw`);
    render();
  }

  function filterSkillMineList() {
    const q = state.skillMine.query.trim().toLowerCase();
    const src = state.skillMine.source;
    let list = [...skillMineItems, ...state.skillMine.importedFromPlaza].filter(
      (item) => !state.skillMine.deletedIds[item.id]
    );

    if (src === "builtin") {
      list = list.filter((item) => item.origin === "builtin");
    } else if (src === "mine") {
      list = list.filter((item) => item.origin === "mine");
    }

    if (!q) return list;

    return list.filter((item) =>
      [item.name, item.description || ""].join(" ").toLowerCase().includes(q)
    );
  }

  function isSkillMineEnabled(item) {
    if (state.skillMine.enabledOverrides[item.id] !== undefined) {
      return state.skillMine.enabledOverrides[item.id];
    }
    return item.defaultEnabled !== false;
  }

  function getSkillMineRowSymbolId(item) {
    if (item.symbolId) return item.symbolId;
    const key = item.icon || "file";
    if (key === "plane") return "icon-plane-ticket";
    if (key === "code") return "icon-code";
    if (key === "doc") return "icon-doc";
    if (key === "chart") return "icon-chart-bars";
    if (key === "edit") return "icon-edit";
    return "icon-file";
  }

  function getMineVisiblePageIndices(current, total) {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const s = new Set([1, total]);
    for (let p = current - 2; p <= current + 2; p += 1) {
      if (p >= 1 && p <= total) s.add(p);
    }
    return [...s].sort((a, b) => a - b);
  }

  function mineEllipsisBefore(page, prev) {
    return prev !== undefined && page - prev > 1;
  }

  function renderSkillPlazaCard(skill, index) {
    const fav = isSkillPlazaFavorite(skill);
    const badge = getSkillPlazaAudienceBadgeLabel(skill);
    const srcLine = getSkillPlazaSourceText(skill);
    const timeLine =
      skill.sourceType === "platform" ? `更新于 ${skill.publishedAt}` : `发布于 ${skill.publishedAt}（${skill.publishedBy}）`;
    const deps = skill.declaredDependencies || [];
    const depTitle = deps.map((d) => d.name).join("\n");
    const stagger = `animation-delay:${index * 55}ms`;
    const iconId = getSkillPlazaIconId(skill);

    return `<article class="skill-plaza-card skills-stagger" style="${stagger}" role="button" tabindex="0" data-skill-plaza-card="${escapeAttr(skill.id)}">
      <div class="skill-plaza-card-inner">
        <div class="skill-plaza-card-head">
          <div class="skill-plaza-card-title-block">
            <div class="skill-plaza-icon" aria-hidden="true"><svg><use href="#${iconId}"></use></svg></div>
            <div class="skill-plaza-title-meta">
              <div class="skill-plaza-name-row">
                <h3 class="skill-plaza-name">${escapeHTML(skill.name)}</h3>
                <span class="skill-plaza-badge">${escapeHTML(badge)}</span>
              </div>
              <div class="skill-plaza-source-row">
                <span class="skill-plaza-source ${skill.sourceType === "platform" ? "is-platform" : ""}">${escapeHTML(srcLine)}</span>
                <span class="skill-plaza-dot">·</span>
                <span class="skill-plaza-time">${escapeHTML(timeLine)}</span>
              </div>
            </div>
          </div>
          <button type="button" class="skill-plaza-fav ${fav ? "is-active" : ""}" data-skill-plaza-fav="${escapeAttr(
      skill.id
    )}" aria-label="${fav ? "取消收藏" : "收藏"}" title="${fav ? "取消收藏" : "收藏"}">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M12 4.5 14.1 9.9 20 10.8 15.5 15 16.6 21 12 18 7.4 21 8.5 15 4 10.8l5.9-.9L12 4.5Z" fill="${fav ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
        <p class="skill-plaza-desc">${escapeHTML(skill.description)}</p>
        <div class="skill-plaza-card-foot">
          <div class="skill-plaza-foot-left">
            <span class="skill-plaza-dl-pill"><span class="skill-plaza-dl-num">${skill.downloads.toLocaleString()}</span> 下载</span>
            ${
              deps.length
                ? `<button type="button" class="skill-plaza-dep" data-skill-plaza-dep="${escapeAttr(skill.id)}" title="${escapeAttr(depTitle)}"><svg><use href="#icon-boxes"></use></svg>依赖声明</button>`
                : ""
            }
          </div>
          <div class="skill-plaza-foot-actions">
            <button type="button" class="skill-plaza-dl-btn" data-skill-plaza-dl="${escapeAttr(skill.id)}" title="下载" aria-label="下载">${icon("download")}</button>
            <button type="button" class="skill-plaza-add-claw" data-skill-plaza-add-mine="${escapeAttr(skill.id)}" title="添加至我的Claw" aria-label="添加至我的Claw">${icon("plus")}</button>
          </div>
        </div>
      </div>
    </article>`;
  }

  let skillPlazaToastTimer = null;
  function showSkillPlazaToast(message) {
    let el = document.getElementById("skillPlazaToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "skillPlazaToast";
      el.className = "skill-plaza-toast";
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.hidden = false;
    el.classList.add("is-visible");
    window.clearTimeout(skillPlazaToastTimer);
    skillPlazaToastTimer = window.setTimeout(() => {
      el.classList.remove("is-visible");
    }, 2200);
  }

  function applySkillMineJump() {
    const n = Number.parseInt(String(state.skillMine.jumpInput || "").trim(), 10);
    if (Number.isNaN(n) || n < 1) {
      showSkillPlazaToast("请输入有效页码。");
      return;
    }
    const filtered = filterSkillMineList();
    const totalPages = Math.max(1, Math.ceil(filtered.length / state.skillMine.pageSize));
    state.skillMine.page = Math.min(n, totalPages);
    state.skillMine.jumpInput = String(state.skillMine.page);
    render();
  }

  function renderSkillPlazaPanel() {
    const sp = state.skillPlaza;
    const filtered = filterSkillPlazaSkills();
    const chipsSrc = skillPlazaSourceFilters
      .map(
        (f) =>
          `<button type="button" class="skill-plaza-chip${sp.source === f.value ? " is-active" : ""}" data-skill-plaza-source="${escapeAttr(f.value)}">${escapeHTML(f.label)}</button>`
      )
      .join("");
    const chipsCat = skillPlazaCategoryFilters
      .map(
        (f) =>
          `<button type="button" class="skill-plaza-chip${sp.category === f.value ? " is-active" : ""}" data-skill-plaza-category="${escapeAttr(f.value)}">${escapeHTML(f.label)}</button>`
      )
      .join("");
    const sortDownloadsActive = sp.sort === "downloads";
    const sortUpdatedActive = sp.sort === "updatedAt";

    const grid =
      filtered.length > 0
        ? `<div class="skill-plaza-grid">${filtered.map((s, i) => renderSkillPlazaCard(s, i)).join("")}</div>`
        : `<div class="skill-plaza-empty">当前筛选条件下没有匹配的技能模板，试试切换来源、能力类目或搜索关键词。</div>`;

    return `<div class="skill-plaza-canvas skill-hub-panel">
        <div class="skill-plaza-top">
          <div class="skill-plaza-hero">
            <h2 class="skill-plaza-title skills-display">技能广场</h2>
          </div>
          <label class="skill-plaza-search-label">
            ${icon("search")}
            <input type="search" data-skill-plaza-search value="${escapeAttr(sp.query)}" placeholder="搜索 技能名称、类目或标签" autocomplete="off" />
          </label>
        </div>
        <div class="skill-plaza-filters">
          <div class="skill-plaza-filter-row">
            <span class="skill-plaza-filter-label">来源</span>
            <div class="skill-plaza-chips">${chipsSrc}</div>
          </div>
          <div class="skill-plaza-filter-row skill-plaza-filter-row--split">
            <span class="skill-plaza-filter-label">类目</span>
            <div class="skill-plaza-chips skill-plaza-chips--wrap">${chipsCat}</div>
            <div class="skill-plaza-sort">
              <span class="skill-plaza-filter-label">排序</span>
              <div class="skill-plaza-sort-btns">
                <button type="button" class="skill-plaza-chip skill-plaza-sort-chip${sortDownloadsActive ? " is-active" : ""}" data-skill-plaza-sort="downloads">下载量${sortDownloadsActive ? " ↓" : ""}</button>
                <button type="button" class="skill-plaza-chip skill-plaza-sort-chip${sortUpdatedActive ? " is-active" : ""}" data-skill-plaza-sort="updatedAt">最新更新</button>
              </div>
            </div>
          </div>
        </div>
        ${grid}
      </div>`;
  }

  function renderSkillMinePanel() {
    const sm = state.skillMine;
    const CLAW_PRIMARY = "#1890ff";
    const filtered = filterSkillMineList();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / sm.pageSize));
    if (sm.page > totalPages) state.skillMine.page = totalPages;
    if (sm.page < 1) state.skillMine.page = 1;
    const safePage = state.skillMine.page;
    const start = (safePage - 1) * sm.pageSize;
    const pageItems = filtered.slice(start, start + sm.pageSize);
    const visiblePages = getMineVisiblePageIndices(safePage, totalPages);

    const originSeg = ["all", "builtin", "mine"]
      .map((v) => {
        const labels = { all: "全部", builtin: "内置", mine: "我的" };
        const act = sm.source === v;
        return `<button type="button" class="skill-mine-seg${act ? " is-active" : ""}" data-skill-mine-origin="${escapeAttr(v)}">${escapeHTML(labels[v])}</button>`;
      })
      .join("");

    const rows = pageItems
      .map((item) => {
        const on = isSkillMineEnabled(item);
        const sym = getSkillMineRowSymbolId(item);
        const tag = item.origin === "builtin" ? "内置" : "我的";
        return `<li class="skill-mine-row skill-mine-row--v2">
      <div class="skill-mine-row-ico-wrap" aria-hidden="true">
        <div class="skill-mine-row-ico"><svg><use href="#${sym}"></use></svg></div>
      </div>
      <div class="skill-mine-row-body">
        <div class="skill-mine-row-headline">
          <span class="skill-mine-row-name">${escapeHTML(item.name)}</span>
          <span class="skill-mine-origin-tag">${escapeHTML(tag)}</span>
          <span class="skill-mine-row-time">更新于 ${escapeHTML(item.updatedAt)}</span>
        </div>
        <p class="skill-mine-row-desc">${escapeHTML(item.description || "")}</p>
      </div>
      <div class="skill-mine-row-ctrl">
        <button
          type="button"
          class="skill-mine-switch${on ? " is-on" : ""}"
          role="switch"
          aria-checked="${on ? "true" : "false"}"
          data-skill-mine-toggle="${escapeAttr(item.id)}"
          aria-label="${on ? "停用技能" : "启用技能"}"
        >
          <span class="skill-mine-switch-track" aria-hidden="true"><span class="skill-mine-switch-thumb"></span></span>
        </button>
        <button
          type="button"
          class="skill-mine-delete${item.origin === "builtin" ? " skill-mine-delete--disabled" : ""}"
          ${item.origin === "builtin" ? "disabled " : ""}aria-disabled="${item.origin === "builtin" ? "true" : "false"}"
          data-skill-mine-delete="${escapeAttr(item.id)}"
        >删除</button>
      </div>
    </li>`;
      })
      .join("");

    const pageButtons = visiblePages
      .map((page, idx) => {
        const prev = idx > 0 ? visiblePages[idx - 1] : undefined;
        const ell = mineEllipsisBefore(page, prev) ? `<span class="skill-mine-page-gap">…</span>` : "";
        const active = safePage === page;
        return `${ell}<button type="button" class="skill-mine-page-num${active ? " is-active" : ""}" data-skill-mine-page="${page}"${active ? ` style="background:${CLAW_PRIMARY};color:#fff"` : ""}>${page}</button>`;
      })
      .join("");

    const prevDis = safePage <= 1;
    const nextDis = safePage >= totalPages;

    const sizeBtns = [10, 20, 50]
      .map(
        (n) =>
          `<button type="button" class="skill-mine-size${sm.pageSize === n ? " is-active" : ""}" data-skill-mine-page-size="${n}">${n} 条/页</button>`
      )
      .join("");

    const listBlock = pageItems.length
      ? `<ul class="skill-mine-ul skill-mine-ul--v2">${rows}</ul>`
      : `<div class="skill-mine-empty-inline">暂无匹配的技能，请调整筛选或搜索条件。</div>`;

    return `<div class="skill-mine-panel skill-hub-panel skill-mine-panel--v2">
      <div class="skill-mine-toolbar skill-mine-toolbar--v2">
        <div class="skill-mine-origin-block">
          <span class="skill-mine-origin-label">技能来源</span>
          <div class="skill-mine-seg-group">${originSeg}</div>
        </div>
        <label class="skill-mine-search skill-mine-search--center">
          ${icon("search")}
          <input type="search" data-skill-mine-search value="${escapeAttr(sm.query)}" placeholder="请输入技能名称" autocomplete="off" aria-label="搜索技能名称" />
        </label>
        <div class="skill-mine-toolbar-right">
          <button type="button" class="skill-mine-ico-btn" data-skill-mine-refresh title="刷新列表" aria-label="刷新列表">${icon("refresh")}</button>
          <button type="button" class="skill-mine-import" data-skill-mine-import style="background:${CLAW_PRIMARY}">${icon("upload")}<span>导入</span></button>
        </div>
      </div>
      <div class="skill-mine-scroll skill-mine-scroll--v2">${listBlock}</div>
      <div class="skill-mine-footer">
        <div class="skill-mine-pager">
          <span class="skill-mine-count">共 ${total} 条</span>
          <button type="button" class="skill-mine-ico-btn skill-mine-page-arrow" data-skill-mine-prev${prevDis ? " disabled" : ""} aria-label="上一页"><svg class="skill-mine-chevron skill-mine-chevron--prev" aria-hidden="true"><use href="#icon-chevron"></use></svg></button>
          <div class="skill-mine-page-nums">${pageButtons}</div>
          <button type="button" class="skill-mine-ico-btn skill-mine-page-arrow" data-skill-mine-next${nextDis ? " disabled" : ""} aria-label="下一页"><svg class="skill-mine-chevron skill-mine-chevron--next" aria-hidden="true"><use href="#icon-chevron"></use></svg></button>
          <div class="skill-mine-size-group">${sizeBtns}</div>
          <div class="skill-mine-jump">
            <span>前往</span>
            <input class="skill-mine-jump-input" type="text" inputmode="numeric" data-skill-mine-jump value="${escapeAttr(sm.jumpInput)}" />
            <span>页</span>
            <button type="button" class="skill-mine-btn skill-mine-btn--outline skill-mine-jump-go" data-skill-mine-jump-apply>确定</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function renderSkillHubPage() {
    const tab = state.skillHubTab;
    const body = tab === "plaza" ? renderSkillPlazaPanel() : renderSkillMinePanel();
    return `<section class="skill-plaza-root skill-hub-root skills-hub-cecloud">
      <div class="skill-plaza-ambient" aria-hidden="true">
        <div class="skill-plaza-orb skill-plaza-orb-a"></div>
        <div class="skill-plaza-orb skill-plaza-orb-b"></div>
      </div>
      <div class="skill-hub-shell">
        <nav class="skill-hub-tabs" aria-label="技能中心">
          <button type="button" class="skill-hub-tab${tab === "plaza" ? " is-active" : ""}" data-skill-hub-tab="plaza">技能广场</button>
          <button type="button" class="skill-hub-tab${tab === "mine" ? " is-active" : ""}" data-skill-hub-tab="mine">我的技能</button>
        </nav>
        <div class="skill-hub-body">${body}</div>
      </div>
    </section>`;
  }

  function getProductDocFlow(tab = state.productDocs.tab) {
    const safeTab = tab === "code" ? "code" : "request";
    if (!state.productDocs.flows[safeTab]) {
      state.productDocs.flows[safeTab] = { phase: "pending", outcome: "success" };
    }
    return state.productDocs.flows[safeTab];
  }

  function handleProductDocAction(action) {
    const flow = getProductDocFlow();
    if (action === "reset") {
      flow.phase = "pending";
      flow.outcome = "success";
      render();
      return;
    }
    if (flow.phase !== "approval_required") return;
    if (action === "approve") {
      flow.phase = "running";
    } else if (action === "deny") {
      flow.phase = "denied";
    }
    render();
  }

  function handleProductDocOutcome(outcome) {
    const flow = getProductDocFlow();
    flow.outcome = outcome === "failed" ? "failed" : "success";
    if (flow.phase === "running" || flow.phase === "success" || flow.phase === "failed") {
      flow.phase = flow.outcome;
    }
    render();
  }

  function jumpProductDocPhase(phase) {
    if (!PRODUCT_DOC_STAGES.some((stage) => stage.id === phase)) return;
    const flow = getProductDocFlow();
    flow.phase = phase;
    if (phase === "success") {
      flow.outcome = "success";
    } else if (phase === "failed") {
      flow.outcome = "failed";
    }
    render();
  }

  function advanceProductDocFlow() {
    const flow = getProductDocFlow();
    if (flow.phase === "pending") {
      flow.phase = "approval_required";
    } else if (flow.phase === "running") {
      flow.phase = flow.outcome === "failed" ? "failed" : "success";
    } else if (flow.phase === "denied" || flow.phase === "success" || flow.phase === "failed") {
      flow.phase = "pending";
      flow.outcome = "success";
    }
    render();
  }

  function retreatProductDocFlow() {
    const flow = getProductDocFlow();
    const order = ["pending", "approval_required", "denied", "running", "success", "failed"];
    const index = order.indexOf(flow.phase);
    if (index <= 0) return;
    flow.phase = order[index - 1];
    if (flow.phase !== "failed") {
      flow.outcome = "success";
    }
    render();
  }

  function productDocReachIndex(phase) {
    const order = {
      pending: 0,
      approval_required: 1,
      denied: 2,
      running: 3,
      success: 4,
      failed: 5
    };
    return order[phase] ?? 0;
  }

  function productDocCardState(stageId, phase) {
    if (stageId === phase) return "is-current";
    const currentIndex = productDocReachIndex(phase);
    const stageIndex = productDocReachIndex(stageId);
    if (phase === "denied") {
      return stageId === "pending" || stageId === "approval_required" ? "is-past" : "is-future";
    }
    if (phase === "failed") {
      return ["pending", "approval_required", "running"].includes(stageId) ? "is-past" : "is-future";
    }
    if (phase === "success") {
      return ["pending", "approval_required", "running"].includes(stageId) ? "is-past" : "is-future";
    }
    return stageIndex < currentIndex ? "is-past" : "is-future";
  }

  function renderProductDocPage() {
    const tab = state.productDocs.tab === "code" ? "code" : "request";
    const flow = getProductDocFlow(tab);
    const demo = PRODUCT_DOC_DEMOS[tab];
    const phaseConfig = PRODUCT_DOC_STAGES.find((s) => s.id === flow.phase) || PRODUCT_DOC_STAGES[0];
    const hintText = productDocKeyHint(flow.phase);
    const tabButtons = PRODUCT_DOC_TABS.map((item) => {
      const active = item.id === tab;
      return `<button type="button" class="product-doc-tab${active ? " is-active" : ""}" data-product-doc-tab="${escapeAttr(item.id)}">
        ${icon(item.icon)}
        <span>${escapeHTML(item.label)}</span>
      </button>`;
    }).join("");

    return `<section class="product-doc-page" tabindex="0" aria-label="工具调用状态说明">
      <header class="product-doc-head">
        <div>
          <p class="product-doc-eyebrow">Tool Call Status</p>
          <h2>工具调用状态说明</h2>
          <p>通过左右方向键或左侧状态编号切换；审批态需要在页面点击同意或拒绝。</p>
        </div>
        <div class="product-doc-head-actions">
          <span class="product-doc-current">当前：${escapeHTML(phaseConfig.code)} · ${escapeHTML(phaseConfig.label)}</span>
          <button type="button" class="product-doc-reset" data-product-doc-action="reset">${icon("refresh")}<span>重置</span></button>
        </div>
      </header>
      <nav class="product-doc-tabs" aria-label="工具调用类型">${tabButtons}</nav>
      <div class="product-doc-workspace">
        <aside class="product-doc-rail" aria-label="状态列表">
          ${PRODUCT_DOC_STAGES.map((stage, index) => renderProductDocRailItem(stage, index, flow.phase)).join("")}
          <div class="product-doc-key-hint">${escapeHTML(hintText)}</div>
        </aside>
        <div class="product-doc-stack">
          ${renderProductDocStatusCard(phaseConfig, demo, flow, tab)}
          ${tab === "request" && flow.phase === "running" ? renderProductDocOutcomeRow(flow, { dockAfterCard: true }) : ""}
        </div>
      </div>
    </section>`;
  }

  function productDocKeyHint(phase) {
    if (phase === "running") return "点击模拟成功或者模拟失败按钮查看不同执行结果分支";
    if (phase === "denied" || phase === "success" || phase === "failed") return "已到终态，按 → 可重新开始";
    return "按 ← / → 切换状态";
  }

  function renderProductDocOutcomeRow(flow, { dockAfterCard = false } = {}) {
    const rowClass = dockAfterCard ? "product-outcome-row product-outcome-row--after-card" : "product-outcome-row";
    return `<div class="${rowClass}">
          <span>执行结果分支</span>
          <button type="button" class="product-outcome-btn${flow.outcome !== "failed" ? " is-active" : ""}" data-product-doc-outcome="success">模拟成功</button>
          <button type="button" class="product-outcome-btn${flow.outcome === "failed" ? " is-active" : ""}" data-product-doc-outcome="failed">模拟失败</button>
        </div>`;
  }

  function renderProductDocRailItem(stage, index, phase) {
    const stateClass = productDocCardState(stage.id, phase);
    return `<button
      type="button"
      class="product-doc-rail-item ${stateClass} tone-${escapeAttr(stage.tone)}"
      data-product-doc-phase="${escapeAttr(stage.id)}"
      aria-current="${stage.id === phase ? "step" : "false"}"
    >
      <span class="product-doc-rail-num">${index + 1}</span>
      <span class="product-doc-rail-code">${escapeHTML(stage.code)}</span>
      <strong>${escapeHTML(stage.label)}</strong>
    </button>`;
  }

  function renderToolStatePanel({
    title,
    status,
    iconName = "tool",
    body = "",
    mode = "request",
    collapsible = false,
    open = true,
    statusLabel = "",
    elapsed = "",
    extraClass = ""
  }) {
    const statusTone = toolStateTone(status);
    const stateClass = `tone-${escapeAttr(statusTone)} mode-${escapeAttr(mode)} ${extraClass || ""}`.trim();
    const statusBadge = renderToolStateStatus(status, statusLabel);
    const elapsedHtml = elapsed ? `<span class="tool-state-elapsed">${escapeHTML(elapsed)}</span>` : "";
    const toggleHtml = collapsible ? `<span class="tool-state-toggle" aria-hidden="true">${icon("chevron")}</span>` : "";
    const bodyHtml = body && String(body).trim() ? `<div class="tool-state-body">${body}</div>` : "";
    const headInner = `<span class="tool-state-icon">${icon(iconName)}</span>
      <span class="tool-state-title">${escapeHTML(title)}</span>
      <span class="tool-state-spacer"></span>
      ${toggleHtml}
      ${elapsedHtml}
      ${statusBadge}`;

    if (collapsible) {
      return `<details class="tool-state-panel ${stateClass}"${open ? " open" : ""}>
        <summary class="tool-state-head" aria-label="展开或收起工具调用详情">${headInner}</summary>
        ${bodyHtml}
      </details>`;
    }

    return `<article class="tool-state-panel ${stateClass}">
      <div class="tool-state-head">${headInner}</div>
      ${bodyHtml}
    </article>`;
  }

  function toolStateTone(status) {
    if (status === "success" || status === "success_collapsed" || status === "success_expanded") return "success";
    if (status === "running") return "running";
    if (status === "approval_required" || status === "needs_approval" || status === "destructive") return "approval";
    if (status === "failed" || status === "error" || status === "denied" || status === "cancelled") return "failed";
    return "pending";
  }

  function renderToolStateStatus(status, labelOverride = "") {
    const tone = toolStateTone(status);
    const defaults = {
      pending: "等待执行",
      approval: status === "destructive" ? "等待确认" : "等待授权",
      running: "执行中",
      success: "成功",
      failed: status === "denied" ? "已拒绝" : "失败"
    };
    const label = labelOverride || defaults[tone] || String(status || "");
    const prefix =
      tone === "running"
        ? '<span class="spinner"></span>'
        : tone === "success"
          ? icon("check")
          : tone === "failed"
            ? icon("x")
            : tone === "approval"
              ? icon("warning")
              : '<span class="tool-state-dot"></span>';
    return `<span class="tool-state-status tone-${escapeAttr(tone)}">${prefix}<span>${escapeHTML(label)}</span></span>`;
  }

  function renderProductDocStatusCard(stage, demo, flow, tab) {
    const title = stage.id === "pending" ? demo.pendingTitle : stage.id === "running" ? demo.runningTitle : demo.title;
    return renderToolStatePanel({
      title,
      status: stage.id,
      iconName: tab === "code" ? "terminal" : "tool",
      body: renderProductDocCardBody(stage.id, demo, flow, tab),
      mode: tab === "code" ? "command" : "request",
      collapsible: false,
      statusLabel: stage.label,
      extraClass: "product-doc-tool"
    });
  }

  function renderProductDocCardBody(stageId, demo, flow, tab) {
    if (tab === "code") {
      return renderProductDocCommandBody(stageId, demo, flow);
    }
    if (stageId === "pending") {
      return "";
    }
    if (stageId === "approval_required") {
      return `<div class="product-approval-body">
        <div class="product-approval-note">
          ${icon("info")}
          <div>
            <strong>${escapeHTML(demo.approvalCopy)}</strong>
            ${demo.approvalSubcopy ? `<span>${escapeHTML(demo.approvalSubcopy)}</span>` : ""}
          </div>
        </div>
        ${renderProductDocRequestBlock(demo, tab, true)}
        <div class="product-status-actions">
          <button type="button" class="product-doc-btn secondary" data-product-doc-action="deny" ${flow.phase !== "approval_required" ? "disabled" : ""}>拒绝</button>
          <button type="button" class="product-doc-btn primary" data-product-doc-action="approve" ${flow.phase !== "approval_required" ? "disabled" : ""}>允许</button>
        </div>
      </div>`;
    }
    if (stageId === "denied") {
      return `${demo.deniedCopy ? `<p class="product-status-copy">${escapeHTML(demo.deniedCopy)}</p>` : ""}
      ${tab === "request" ? renderProductDocRequestBlock(demo, tab, false) : ""}
      <div class="product-denied-line">拒绝时间：2026-05-18 10:16:22</div>`;
    }
    if (stageId === "running") {
      return `${demo.runningCopy ? `<p class="product-status-copy">${escapeHTML(demo.runningCopy)}</p>` : ""}
        ${renderProductDocRequestBlock(demo, tab, true)}
        <div class="tool-state-block tool-state-block--response-pending">
          <div class="tool-state-block-label tool-state-block-label--with-spinner" aria-live="polite">
            <span>Response</span>
            <span class="product-doc-response-spinner spinner" aria-hidden="true"></span>
          </div>
        </div>`;
    }
    if (stageId === "success") {
      return `${demo.successCopy ? `<p class="product-status-copy">${escapeHTML(demo.successCopy)}</p>` : ""}
        ${renderProductDocRequestBlock(demo, tab, false)}
        ${renderProductDocResponseBlock(demo.successResponse, "success", tab)}`;
    }
    if (stageId === "failed") {
      return `${demo.failedCopy ? `<p class="product-status-copy">${escapeHTML(demo.failedCopy)}</p>` : ""}
        ${renderProductDocRequestBlock(demo, tab, false)}
        ${renderProductDocResponseBlock(demo.errorResponse, "failed", tab, demo.failureDetailLabel)}`;
    }
    return "";
  }

  function renderProductDocCommandBody(stageId, demo, flow) {
    const commandBlock = renderProductDocCommandBlock(demo, commandOutputForStage(stageId, demo));
    if (stageId === "pending") {
      return commandBlock;
    }
    if (stageId === "approval_required") {
      return `<div class="product-approval-body product-command-approval">
        <p class="product-status-copy">${escapeHTML(demo.approvalCopy)}</p>
        ${demo.approvalSubcopy ? `<p class="product-command-subcopy">${escapeHTML(demo.approvalSubcopy)}</p>` : ""}
        ${commandBlock}
        <div class="product-status-actions">
          <button type="button" class="product-doc-btn secondary" data-product-doc-action="deny" ${flow.phase !== "approval_required" ? "disabled" : ""}>拒绝</button>
          <button type="button" class="product-doc-btn primary" data-product-doc-action="approve" ${flow.phase !== "approval_required" ? "disabled" : ""}>允许</button>
        </div>
      </div>`;
    }
    if (stageId === "denied") {
      return `${commandBlock}
        ${demo.deniedCopy ? `<p class="product-status-copy product-command-aftercopy">${escapeHTML(demo.deniedCopy)}</p>` : ""}`;
    }
    if (stageId === "running") {
      return `${commandBlock}
        <div class="product-command-running-line"><span class="spinner"></span><span>正在执行...</span></div>
        ${renderProductDocOutcomeRow(flow)}`;
    }
    if (stageId === "success") {
      return commandBlock;
    }
    if (stageId === "failed") {
      return commandBlock;
    }
    return commandBlock;
  }

  function commandOutputForStage(stageId, demo) {
    if (stageId === "running") return demo.runningOutput || "";
    if (stageId === "success") return demo.successOutput || "";
    if (stageId === "failed") return demo.errorOutput || "";
    return "";
  }

  function renderProductDocCommandBlock(demo, output = "") {
    const lines = [`$ ${demo.command}`];
    if (output) lines.push(output);
    return renderToolStateCommandBlock(demo.commandType || "shell", lines.join("\n"));
  }

  function renderProductDocRequestBlock(demo, tab, includeCode) {
    const codeBlock = tab === "code" && includeCode
      ? renderToolStateCommandBlock("code", demo.code || "")
      : "";
    const request = {
      endpoint: demo.requestLine,
      ...(demo.request || {})
    };
    return `${renderToolStateIoBlocks(request, undefined)}${codeBlock}`;
  }

  function renderProductDocResponseBlock(response, tone, tab, label = "Response") {
    if (tab === "code") return renderToolStateCommandBlock(label, formatJsonPlain(response));
    return `<div class="tool-state-block">
      <div class="tool-state-block-label">${escapeHTML(label)}</div>
      <pre class="tool-state-pre tool-state-pre--json response-${escapeAttr(tone)}">${formatJsonHighlighted(response)}</pre>
    </div>`;
  }

  function formatJsonPlain(value) {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value ?? "");
    }
  }

  function renderToolStateCommandBlock(kind, content) {
    return `<div class="tool-state-command-block">
      <div class="tool-state-block-label">${escapeHTML(kind || "shell")}</div>
      <pre class="tool-state-pre tool-state-pre--command">${escapeHTML(content || "")}</pre>
    </div>`;
  }

  function renderToolStateIoBlocks(args, output, options = {}) {
    const blocks = [];
    const requestLabel = options.requestLabel || "Request";
    const responseLabel = options.responseLabel || "Response";
    blocks.push(`<div class="tool-state-block">
      <div class="tool-state-block-label">${escapeHTML(requestLabel)}</div>
      <pre class="tool-state-pre tool-state-pre--json">${formatJsonHighlighted(args || {})}</pre>
    </div>`);
    if (output !== null && output !== undefined) {
      blocks.push(`<div class="tool-state-block">
        <div class="tool-state-block-label">${escapeHTML(responseLabel)}</div>
        <pre class="tool-state-pre tool-state-pre--json">${formatJsonHighlighted(output)}</pre>
      </div>`);
    }
    return blocks.join("");
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

    if (state.route === "skillhub") {
      nodes.stream.innerHTML = renderSkillHubPage();
      return;
    }

    if (state.route === "product") {
      nodes.stream.innerHTML = renderProductDocPage();
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
      if (item.id === "tool-erp-write-running" || item.id === "tool-erp-error" || item.id === "tool-erp-write-success") return "";
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
      case "context_compression":
        return renderContextCompression(item, step);
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

  function renderContextCompression(item, step) {
    const done = state.runtime[step.id] === "success" || state.currentStep > step.id;
    const title = done ? item.completedTitle || "上下文压缩完成" : item.title || "上下文正在压缩";
    const summary = done ? item.completedSummary || "" : item.summary || "";
    return `<div class="message-row">
      <article class="context-compression-card ${done ? "is-done" : "is-running"}">
        <div class="context-compression-icon">${done ? icon("check") : '<span class="spinner"></span>'}</div>
        <div class="context-compression-main">
          <div class="context-compression-head">
            <strong>${escapeHTML(title)}</strong>
            <span class="status-pill ${done ? "success" : "info"}">${done ? icon("check") : '<span class="spinner"></span>'}<span>${done ? "完成" : "进行中"}</span></span>
          </div>
          ${summary ? `<div class="context-compression-summary">${escapeHTML(summary)}</div>` : ""}
          ${done ? "" : `<div class="context-compression-progress" aria-hidden="true"><span></span></div>`}
        </div>
      </article>
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
    return `<div class="message-row">
      <article class="skill-chip-card" aria-label="技能调用：${escapeAttr(item.skill)}">
        <span class="skill-chip-icon" aria-hidden="true">${icon("skill-call")}</span>
        <strong class="skill-chip-title">技能：${escapeHTML(item.skill)}</strong>
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
    if (isInlineFileTool(item)) {
      return renderFileToolCall(item, status);
    }
    if (isCommandTool(item)) {
      return renderCommandToolCall(item, status);
    }

    const cssStatus = toolCssStatus(status);
    const body = renderToolBody(item, status);
    const title =
      typeof item.headline === "string" && item.headline.trim().length > 0
        ? item.headline.trim()
        : `${item.action} · ${item.target}`;

    const panelBody = body.trim()
      ? body
      : `<div class="tool-summary">暂无工具调用详情。</div>`;
    const openAttr = toolCallDetailsOpenByDefault(status) ? " open" : "";

    return `<div class="message-row">
      ${renderToolStatePanel({
        title,
        status,
        iconName: toolIconName(item),
        body: panelBody,
        mode: "request",
        collapsible: true,
        open: Boolean(openAttr),
        elapsed: toolElapsedText(item, status),
        extraClass: `category-${item.category || "file"} ${cssStatus}`
      })}
    </div>`;
  }

  function isInlineFileTool(item) {
    return item.category === "file" || item.presentation === "local_file_create" || item.presentation === "local_file_delete";
  }

  function isCommandTool(item) {
    return item.category === "shell" || item.category === "code";
  }

  function renderCommandToolCall(item, status) {
    const cssStatus = toolCssStatus(status);
    const body = renderCommandToolBody(item, status);
    const confirmation = renderCommandHitlBody(item, status);
    const panelBody = [body.trim() ? body : renderToolStateCommandBlock("shell", `$ ${commandInvocationLabel(item)}`), confirmation]
      .filter(Boolean)
      .join("");
    return `<div class="message-row">
      ${renderToolStatePanel({
        title: commandToolTitle(item),
        status,
        iconName: toolIconName(item),
        body: panelBody,
        mode: "command",
        collapsible: true,
        open: true,
        elapsed: toolElapsedText(item, status),
        extraClass: `category-${item.category || "shell"} ${cssStatus}`
      })}
    </div>`;
  }

  function renderFileToolCall(item, status) {
    const cssStatus = toolCssStatus(status);
    const title = fileToolTitle(item);
    const body = renderToolBody(item, status);
    return `<div class="message-row">
      ${renderToolStatePanel({
        title,
        status,
        iconName: toolIconName(item),
        body,
        mode: "request",
        collapsible: true,
        open: toolCallDetailsOpenByDefault(status),
        elapsed: toolElapsedText(item, status),
        extraClass: `category-file ${cssStatus}`
      })}
    </div>`;
  }

  function renderToolBody(item, status) {
    if (status === "needs_approval") {
      return renderPermissionToolBody(item);
    }

    if (status === "destructive") {
      return renderDestructiveToolBody(item);
    }

    if (status === "error") {
      return renderErrorToolBody(item);
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

    return renderTypedToolBody(item, status);
  }

  function toolElapsedText(item, status) {
    if (isRequestResponseTool(item)) {
      if (status === "needs_approval" && item.elapsed && !looksLikeElapsedDuration(item.elapsed)) return item.elapsed;
      if (status === "destructive" && item.elapsed && !looksLikeElapsedDuration(item.elapsed)) return item.elapsed;
      return "";
    }
    if (item.status === "needs_approval" && status !== "needs_approval" && item.elapsed === "等待授权") {
      return "";
    }
    return item.elapsed || "";
  }

  function isRequestResponseTool(item) {
    return ["connector", "doc", "web", "subagent"].includes(item.category);
  }

  function looksLikeElapsedDuration(value) {
    const text = String(value || "").trim();
    return /^\d+(?:\.\d+)?\s*(?:ms|s|秒)$/i.test(text) || /^\d{1,2}:\d{2}(?::\d{2})?$/.test(text);
  }

  function renderTypedToolBody(item, status) {
    switch (item.category) {
      case "connector":
        return renderConnectorToolBody(item, status);
      case "web":
      case "doc":
      case "subagent":
        return renderGenericToolBody(item, status);
      case "shell":
        return renderShellToolBody(item, status);
      case "code":
        return renderCodeToolBody(item, status);
      default:
        return renderGenericToolBody(item, status);
    }
  }

  function renderConnectorToolBody(item, status) {
    const output = connectorOutputForStatus(item, status);
    return `<div class="tool-type-body">
      ${renderToolIoBlocks(item, output)}
    </div>`;
  }

  function connectorOutputForStatus(item, status) {
    if (status === "needs_approval") return null;
    if (status === "denied") {
      return item.deniedOutput || { code: 403, message: "用户拒绝授权,请求未执行。" };
    }
    return item.output;
  }

  function renderShellToolBody(item, status) {
    const output = item.output && typeof item.output === "object" ? item.output : {};
    const lines = [`$ ${commandInvocationLabel(item)}`];
    if (output.stdout) lines.push(output.stdout);
    if (output.stderr) lines.push(output.stderr);
    return `<div class="tool-type-body">
      ${renderToolStateCommandBlock("shell", lines.join("\n"))}
      ${renderCommandMeta([
        output.exit_code !== undefined ? `退出码 ${output.exit_code}` : "",
        item.elapsed,
        item.args?.cwd
      ])}
      ${status === "running" ? renderToolStream(item) : ""}
    </div>`;
  }

  function renderCodeToolBody(item, status) {
    const output = item.output && typeof item.output === "object" ? item.output : {};
    const checks = Array.isArray(output.checks) ? output.checks : [];
    const language = item.args?.language || "Code";
    const resultLines = [];
    if (output.result) resultLines.push(`Result: ${output.result}`);
    if (output.total_amount) resultLines.push(`Total: ${output.total_amount}`);
    if (output.diff) resultLines.push(`Diff: ${output.diff}`);
    if (checks.length) resultLines.push(checks.map((line) => `- ${line}`).join("\n"));
    const terminalLines = [
      `$ ${commandInvocationLabel(item)}`,
      item.args?.code ? item.args.code : "",
      resultLines.length ? resultLines.join("\n") : ""
    ].filter(Boolean);
    return `<div class="tool-type-body">
      ${renderToolStateCommandBlock(language, terminalLines.join("\n\n"))}
      ${renderCommandMeta([language, checks.length ? `${checks.length} 项校验` : "", item.elapsed])}
      ${status === "running" ? renderToolStream(item) : ""}
    </div>`;
  }

  function renderGenericToolBody(item, status) {
    return `<div class="tool-type-body">
      ${renderToolIoBlocks(item)}
    </div>`;
  }

  function commandToolTitle(item) {
    return commandInvocationLabel(item);
  }

  function commandInvocationLabel(item) {
    if (item.category === "code") {
      return `Execute ${item.args?.language || "code"} code`;
    }
    return item.args?.command || item.headline || item.toolName || "Execute command";
  }

  function renderCommandToolBody(item, status) {
    if (status === "error" && item.category !== "shell" && item.category !== "code") {
      return renderErrorToolBody(item);
    }
    return item.category === "code" ? renderCodeToolBody(item, status) : renderShellToolBody(item, status);
  }

  function renderCommandHitlBody(item, status) {
    if (status !== "destructive") return "";
    const feedbackMessages = {
      "edit-destructive": "已暂停执行,可调整命令或返回检查文件。",
      "cancel-destructive": "已取消本次删除命令,文件会继续保留。",
      ...(item.feedbackMessages || {})
    };
    return `<div class="tool-command-confirm">
      <ul class="destructive-line-list">
        ${(item.impact || []).map((line) => `<li>${escapeHTML(line)}</li>`).join("")}
      </ul>
      <div class="destructive-path-block">
        ${(item.paths || []).map((path) => `<div class="destructive-path-line">${escapeHTML(path)}</div>`).join("")}
      </div>
      ${getHitlFeedback("destructive", feedbackMessages)}
      <div class="hitl-actions tool-call-hitl-actions">
        <button class="danger-button" type="button" data-hitl-action="confirm-destructive">${escapeHTML(item.confirmLabel || "确认执行")}</button>
        ${item.showEdit === false ? "" : `<button class="secondary-button" type="button" data-hitl-action="edit-destructive">${escapeHTML(item.editLabel || "编辑")}</button>`}
        <button class="ghost-button" type="button" data-hitl-action="cancel-destructive">${escapeHTML(item.cancelLabel || "取消")}</button>
      </div>
    </div>`;
  }

  function renderCommandMeta(parts) {
    const rows = parts.filter(Boolean);
    if (!rows.length) return "";
    return `<div class="command-meta">${rows.map((part) => `<span>${escapeHTML(String(part))}</span>`).join("")}</div>`;
  }

  function fileToolTitle(item) {
    const queuedFiles = Array.isArray(item.annotation?.schema?.args?.files) ? item.annotation.schema.args.files : [];
    const action = normalizeFileAction(item);
    if (queuedFiles.length) return `${action} ${queuedFiles.length} 份附件`;

    const fileName = fileToolName(item);
    if (item.presentation === "local_file_create" || item.presentation === "local_file_delete") {
      return `${action} ${fileName}`;
    }
    if (item.status === "destructive") {
      return `${action} ${fileName}`;
    }
    if (item.action && fileName && fileName !== "会话工作区") {
      return `${action} ${fileName}`;
    }
    return `${action} ${fileName}`.trim() || "文件操作";
  }

  function normalizeFileAction(item) {
    const text = `${item.action || ""} ${item.toolName || ""} ${item.headline || ""}`.toLowerCase();
    if (item.presentation === "local_file_create") return "创建";
    if (item.presentation === "local_file_delete") return "删除";
    if (text.includes("delete") || text.includes("删除")) return "删除";
    if (text.includes("edit") || text.includes("write") || text.includes("编辑") || text.includes("修改")) return "编辑";
    if (text.includes("create") || text.includes("generate") || text.includes("创建") || text.includes("生成")) return "创建";
    if (text.includes("read") || text.includes("读取") || text.includes("查看")) return "读取";
    return item.action || "文件";
  }

  function fileToolName(item) {
    const pathName = Array.isArray(item.paths) && item.paths.length ? basename(item.paths[0]) : "";
    const targetName = item.target && item.target !== "删除后不可恢复" ? item.target : "";
    return (
      item.output?.file_name ||
      targetName ||
      pathName ||
      basename(item.args?.path || item.args?.file || "") ||
      item.headline?.replace(/^(已完成|已删除|正在创建|创建|删除|读取)：?/, "") ||
      "文件"
    );
  }

  function basename(path) {
    if (!path || typeof path !== "string") return "";
    return path.split(/[\\/]/).filter(Boolean).pop() || path;
  }

  function renderFileInlineBody(item, status) {
    if (status !== "destructive") return "";
    const feedbackMessages = {
      "edit-destructive": "已暂停提交,可返回 ERP 草稿调整后再确认。",
      "cancel-destructive": "已取消本次提交确认,草稿仍保留。",
      ...(item.feedbackMessages || {})
    };
    return `<div class="tool-file-confirm">
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
      </div>
    </div>`;
  }

  function renderToolIoBlocks(item, output = item.output) {
    const hasArgs = item.args && typeof item.args === "object" && Object.keys(item.args).length > 0;
    const hasOutput = output !== null && output !== undefined;
    if (!hasArgs && !hasOutput) return "";
    return renderToolRequestResponse(hasArgs ? item.args : {}, output);
  }

  function renderPermissionToolBody(item) {
    const permissionFeedback = item.feedbackMessages || {
      "deny-permission": "已拒绝连接器授权,当前流程暂停。"
    };
    return `<div class="tool-type-body tool-type-approval">
      ${renderConnectorToolBody(item, "needs_approval")}
      ${getHitlFeedback("permission", permissionFeedback)}
      <div class="hitl-actions tool-call-hitl-actions">
        <button class="primary-button" type="button" data-hitl-action="allow-once">允许一次</button>
        <button class="secondary-button" type="button" data-hitl-action="always-allow">本会话始终允许</button>
        <button class="danger-button" type="button" data-hitl-action="deny-permission">拒绝</button>
      </div>
    </div>`;
  }

  function renderDestructiveToolBody(item) {
    const feedbackMessages = {
      "edit-destructive": "已暂停提交,可返回 ERP 草稿调整后再确认。",
      "cancel-destructive": "已取消本次提交确认,草稿仍保留。",
      ...(item.feedbackMessages || {})
    };
    return `<div class="tool-type-body tool-type-destructive">
      ${renderToolLead(item)}
      <ul class="destructive-line-list">
        ${(item.impact || []).map((line) => `<li>${escapeHTML(line)}</li>`).join("")}
      </ul>
      <div class="destructive-path-block">
        ${(item.paths || []).map((path) => `<div class="destructive-path-line">${escapeHTML(path)}</div>`).join("")}
      </div>
      ${renderToolIoBlocks(item, null)}
      ${getHitlFeedback("destructive", feedbackMessages)}
      <div class="hitl-actions tool-call-hitl-actions">
        <button class="danger-button" type="button" data-hitl-action="confirm-destructive">${escapeHTML(item.confirmLabel || "确认提交")}</button>
        ${item.showEdit === false ? "" : `<button class="secondary-button" type="button" data-hitl-action="edit-destructive">${escapeHTML(item.editLabel || "编辑")}</button>`}
        <button class="ghost-button" type="button" data-hitl-action="cancel-destructive">${escapeHTML(item.cancelLabel || "取消")}</button>
      </div>
    </div>`;
  }

  function renderErrorToolBody(item) {
    const retryControls = item.autoRetry
      ? `<div class="tool-summary" style="margin-top: 10px">${escapeHTML(item.retryMessage || "系统已自动重试。")}</div>`
      : `${getHitlFeedback("retry", { skip: "已选择跳过失败步骤,建议仅用于非关键任务。" })}
        <div class="hitl-actions tool-call-hitl-actions">
          <button class="primary-button" type="button" data-hitl-action="retry">重试</button>
          <button class="ghost-button" type="button" data-hitl-action="skip">跳过</button>
        </div>`;
    return `<div class="tool-type-body tool-type-error">
      <div class="error-detail">
        <strong>${escapeHTML(item.summary)}</strong>
        <span>错误码: ${escapeHTML(item.output?.code || "UNKNOWN_ERROR")}</span>
      </div>
      ${renderToolIoBlocks(item)}
      ${retryControls}
    </div>`;
  }

  function renderLocalFileCreateBody(item, status) {
    const fileName = fileToolName(item);
    if (status === "running") {
      return `<div class="local-file-box">
        <div class="local-file-line">${escapeHTML(`创建 ${fileName}`)}</div>
        <div class="local-file-meta">${escapeHTML(item.summary || "")}</div>
        ${renderToolStream(item)}
      </div>`;
    }

    if (status === "success_collapsed" || status === "success_expanded") {
      return `<div class="local-file-box">
        <div class="local-file-line">${escapeHTML(`创建 ${fileName}`)}</div>
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
    const fileName = fileToolName(item);
    return `<div class="local-file-box">
      <div class="local-file-line">${escapeHTML(`删除 ${fileName}`)}</div>
      <div class="local-file-meta">${escapeHTML(item.summary || "")}</div>
      ${item.output?.path ? `<div class="local-file-path">${escapeHTML(item.output.path)}</div>` : ""}
    </div>`;
  }

  function renderToolLead(item, fallback = "") {
    const text = item.summary || fallback;
    return text ? `<div class="tool-summary">${escapeHTML(text)}</div>` : "";
  }

  function renderToolStream(item) {
    const lines = Array.isArray(item.stream) ? item.stream : [];
    return `<div class="stream-box">
      ${lines.map((line) => `<div class="stream-line">${escapeHTML(line)}</div>`).join("")}
      <div class="skeleton"></div>
      <div class="skeleton" style="width: 82%"></div>
      <div class="skeleton" style="width: 64%"></div>
    </div>`;
  }

  function renderToolFactGrid(entries) {
    const rows = entries.filter((entry) => entry[1] !== undefined && entry[1] !== null && entry[1] !== "");
    if (!rows.length) return "";
    return `<dl class="tool-fact-grid">
      ${rows.map(([label, value]) => `<div><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(String(value))}</dd></div>`).join("")}
    </dl>`;
  }

  function renderToolPillList(items, label) {
    if (!items.length) return "";
    return `<div class="tool-pill-section">
      <span>${escapeHTML(label)}</span>
      <div>${items.map((item) => `<em>${escapeHTML(item)}</em>`).join("")}</div>
    </div>`;
  }

  function renderToolRawDetails(item, output = item.output) {
    const hasArgs = item.args && typeof item.args === "object" && Object.keys(item.args).length > 0;
    const hasOutput = output !== null && output !== undefined;
    if (!hasArgs && !hasOutput) return "";
    return `<details class="tool-raw-details">
      <summary>原始调用详情</summary>
      <div class="skill-call-panel tool-call-raw-panel">${renderToolRequestResponse(hasArgs ? item.args : {}, output)}</div>
    </details>`;
  }

  function renderToolRequestResponse(args, output) {
    return renderToolStateIoBlocks(args, output);
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
      denied: { label: "已拒绝", cls: "danger", prefix: icon("x") },
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

    const mode = state.runtimeSend.mode === "parallel" ? "parallel" : "queue";
    const message = {
      id: createRuntimeMessageId(`runtime-${mode}`),
      scope,
      text,
      anchor: getRuntimeAnchor(),
      createdLabel: getRuntimeAnchorLabel(),
      createdAt: Date.now()
    };

    if (mode === "parallel") {
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
    } else if (action === "parallel-from-queue") {
      parallelizeRuntimeQueueMessage(id);
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

  function parallelizeRuntimeQueueMessage(id) {
    const index = state.runtimeSend.queue.findIndex((item) => item.id === id);
    if (index < 0) return;
    const [message] = state.runtimeSend.queue.splice(index, 1);
    state.runtimeSend.steers.push({
      ...message,
      id: createRuntimeMessageId("runtime-parallel"),
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
            <span>并行</span>
            <span class="runtime-steer-status ${escapeAttr(status.className)}">${escapeHTML(status.label)}</span>
          </div>
          <div class="runtime-steer-text">${escapeHTML(message.text)}</div>
          <div class="runtime-steer-note">与主任务并行执行,保持 Agent 上下文与执行状态连续。</div>
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
          : `<button class="runtime-queue-icon-action" type="button" aria-label="删除待执行消息" title="删除" data-runtime-action="delete" data-runtime-message-id="${escapeAttr(message.id)}">${icon("trash")}</button>
            <button class="runtime-queue-icon-action" type="button" aria-label="更多操作" title="更多" aria-expanded="${menuOpen ? "true" : "false"}" data-runtime-action="toggle-more" data-runtime-message-id="${escapeAttr(message.id)}">${icon("more")}</button>
            ${menuOpen ? `<div class="runtime-queue-more-menu">
              <button type="button" data-runtime-action="edit" data-runtime-message-id="${escapeAttr(message.id)}">编辑</button>
              <button type="button" data-runtime-action="move-up" data-runtime-message-id="${escapeAttr(message.id)}"${moveUpDisabled}>上移</button>
              <button type="button" data-runtime-action="move-down" data-runtime-message-id="${escapeAttr(message.id)}"${moveDownDisabled}>下移</button>
            </div>` : ""}`}
      </div>
    </article>`;
  }

  function setEnterpriseOverviewPlanReady(planReady) {
    if (nodes.enterpriseOverviewIdle) nodes.enterpriseOverviewIdle.hidden = planReady;
    if (nodes.enterpriseOverviewPanels) nodes.enterpriseOverviewPanels.hidden = !planReady;
  }

  function renderRightPanel() {
    if (isStandaloneRoute()) return;
    if (state.chatMode === "enterprise_draft" || state.chatMode === "enterprise_session") {
      renderEnterpriseRightPanel();
      syncRightPanelChrome(null);
      renderPreviewPlaceholder("企业级智能体产物会在这里预览。");
      return;
    }
    setEnterpriseOverviewPlanReady(true);
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
    const session = state.chatMode === "enterprise_session" ? getEnterpriseSession(state.enterprise.activeSessionId) : null;
    const agent = state.chatMode === "enterprise_session" ? getEnterpriseAgentById(session?.agentId) : getEnterpriseDraftAgent();
    const preset = getEnterprisePreset(agent);
    const phase = session?.phase || 0;
    const planReady = phase >= 2;
    setEnterpriseOverviewPlanReady(planReady);
    if (planReady) {
      renderRightPanelProgress(getCurrentTaskProgress());
    } else {
      nodes.progressCount.textContent = "";
      nodes.progressList.innerHTML = "";
    }

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
      : `<div class="panel-empty">暂无工具调用</div>`;
  }

  function renderProgressPanel() {
    if (!isTaskProgressReady()) {
      renderEmptyProgressPanel();
      return;
    }
    renderRightPanelProgress(getCurrentTaskProgress());
  }

  function getCurrentTaskProgress() {
    if (state.chatMode === "enterprise_draft" || state.chatMode === "enterprise_session") {
      return getEnterpriseTaskProgress();
    }
    return getDefaultTaskProgress();
  }

  function isTaskProgressReady() {
    if (state.chatMode === "enterprise_session") {
      const session = getEnterpriseSession(state.enterprise.activeSessionId);
      return Boolean(session && session.phase >= 2);
    }
    if (state.chatMode === "enterprise_draft") return false;
    return state.currentStep >= 9;
  }

  function renderEmptyProgressPanel() {
    nodes.progressCount.textContent = "";
    nodes.progressList.innerHTML = `<div class="panel-empty">暂无任务进程</div>`;
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
    if (state.currentStep >= 8) contexts.push({ icon: "skill", name: "技能：差旅报销", meta: "" });
    if (state.currentStep >= 11) contexts.push({ icon: "tool", name: "文档解析", meta: "上海机票行程单.pdf" });
    if (state.currentStep >= 12) contexts.push({ icon: "tool", name: "图像理解", meta: "酒店与打车发票" });
    if (state.currentStep >= 15) {
      contexts.push({ icon: "file", name: "创建 BX-DRAFT-7781.md", meta: "" });
    }
    if (state.currentStep >= 17) contexts.push({ icon: "globe", name: "ERP 写入授权", meta: "等待或完成授权" });
    if (state.currentStep >= 22) contexts.push({ icon: "globe", name: "OA 审批", meta: "提交成功" });
    if (state.currentStep >= 24)
      contexts.push({ icon: "doc", name: "本地文档生成", meta: state.currentStep >= 32 ? "草稿已删除" : "差旅申请草稿.docx" });
    if (state.currentStep >= 33) {
      contexts.push({ icon: "globe", name: "浏览器检查", meta: "OA 审批页状态" });
      contexts.push({ icon: "terminal", name: "命令行检查", meta: "归档目录" });
      contexts.push({ icon: "code", name: "代码复核", meta: "金额与附件一致性" });
      contexts.push({ icon: "branch", name: "审计子代理", meta: "最终归档检查" });
    }

    nodes.contextCount.textContent = String(contexts.length);
    nodes.contextList.innerHTML = contexts.length
      ? contexts
          .map(
            (item) =>
              `<div class="context-item">${icon(item.icon)}<div><strong>${escapeHTML(item.name)}</strong>${item.meta ? `<span>${escapeHTML(item.meta)}</span>` : ""}</div></div>`
          )
          .join("")
      : `<div class="panel-empty">暂无工具调用</div>`;
  }

  function renderPreviewPanel(files = getExpensePanelFiles(), selectedFile = ensureSelectedPreviewFile(files, true)) {
    if (!selectedFile) {
      renderPreviewPlaceholder("选择右侧会话文件后，这里会展示 Markdown、PDF、网页和 Office 预览。");
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
    if (isStandaloneRoute()) return false;
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
    if (isStandaloneRoute()) return false;
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
    if (isStandaloneRoute()) return;

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
      title = state.runtimeSend.mode === "parallel" ? "并行发送" : "加入队列";
      ariaLabel = title;
    } else if (enterpriseResume) {
      title = "继续执行任务";
      ariaLabel = "继续执行任务";
    } else if (expenseResume) {
      title = "继续执行";
      ariaLabel = "继续执行任务流";
    } else if (disable && canShowRuntimeSendControls()) {
      title = "输入新消息后可加入队列或并行发送";
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

    const mode = state.runtimeSend.mode === "parallel" ? "parallel" : "queue";
    if (nodes.sendModeLabel) {
      nodes.sendModeLabel.textContent = mode === "parallel" ? "并行发送" : "加入队列";
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
    if (item.status === "needs_approval" && step?.hitl === "permission") {
      if (isPermissionAllowed(state.hitl.permission)) return "success_expanded";
      if (isPermissionDenied(state.hitl.permission)) return "denied";
    }
    if (item.status !== "running_to_success") return item.status;
    if (state.currentStep > step.id || state.runtime[step.id] === "success") return "success_expanded";
    return "running";
  }

  function toolCssStatus(status) {
    if (status === "success_collapsed" || status === "success_expanded") return "success";
    if (status === "denied") return "error";
    return status;
  }

  function getHitlFeedback(kind, messages) {
    const key = state.hitl[kind];
    if (!key || !messages[key]) return "";
    return `<div class="tool-summary" style="margin-top: 10px">${escapeHTML(messages[key])}</div>`;
  }

  function toolIcon(item) {
    return icon(toolIconName(item));
  }

  function toolIconName(item) {
    if (["connector", "doc", "web", "subagent"].includes(item.category)) {
      return "tool";
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
    return map[item.category] || "file";
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
      if (isStandaloneRoute()) {
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
