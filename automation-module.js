(function () {
  const WEEKDAY_OPTIONS = [
    { value: "mon", label: "周一" },
    { value: "tue", label: "周二" },
    { value: "wed", label: "周三" },
    { value: "thu", label: "周四" },
    { value: "fri", label: "周五" },
    { value: "sat", label: "周六" },
    { value: "sun", label: "周日" }
  ];

  const POLL_DETECTION_OPTIONS = [
    { value: "content_change", label: "内容有变化时触发" },
    { value: "status_change", label: "某个状态值变化时触发" },
    { value: "threshold_exceed", label: "某个值超过阈值时触发" }
  ];

  const RESULT_META = {
    success: { label: "成功", className: "success" },
    failed: { label: "失败", className: "failed" },
    running: { label: "执行中", className: "running" },
    never: { label: "从未执行", className: "never" }
  };

  const PAGE_SIZE = 10;

  const state = {
    tasks: [],
    query: "",
    currentPage: 1,
    createMenuOpen: false,
    modal: null,
    message: "",
    root: null
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function createTaskId(prefix) {
    return `auto-${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  function generateWebhookUrl(id) {
    return `https://hooks.cec-claw.mock/automation/${id}`;
  }

  function generateWebhookSecret() {
    return `whsec_${Math.random().toString(36).slice(2, 14)}`;
  }

  function buildWeekdaySummary(weekdays) {
    if (!Array.isArray(weekdays) || weekdays.length === 0) return "每周";
    const labels = weekdays
      .map((value) => WEEKDAY_OPTIONS.find((item) => item.value === value)?.label)
      .filter(Boolean);
    return labels.length ? `每${labels.join("、")}` : "每周";
  }

  function buildTriggerSummary(task) {
    if (task.trigger_type === "time") {
      const config = task.schedule_config || {};
      if (config.execution_type === "once") {
        return `单次：${config.run_at_date || "未设置日期"} ${config.run_at_time || "未设置时间"}`;
      }
      if (config.execution_type === "interval") {
        return `每 ${config.interval_value || 1} 小时`;
      }
      if (config.frequency === "weekly") {
        return `${buildWeekdaySummary(config.weekdays)} ${config.time || "09:00"}`;
      }
      return `每天 ${config.time || "09:00"}`;
    }
    return task.event_config?.source_type === "poll" ? "Poll（接口变化检查）" : "Webhook 触发";
  }

  function createScheduledTaskDraft() {
    return {
      id: "",
      name: "",
      description: "",
      trigger_type: "time",
      trigger_mode: "schedule",
      trigger_summary: "每天 09:00",
      last_run_at: "",
      last_run_status: "never",
      enabled: true,
      agent_id: "agent-general",
      instruction: "",
      schedule_config: {
        execution_type: "schedule",
        frequency: "daily",
        weekdays: [],
        time: "09:00",
        interval_value: 6,
        interval_unit: "hour",
        run_at_date: "",
        run_at_time: "",
        effective_from: "",
        effective_until: ""
      },
      recent_runs: []
    };
  }

  function createEventTaskDraft() {
    return {
      id: "",
      name: "",
      description: "",
      trigger_type: "event",
      trigger_mode: "webhook",
      trigger_summary: "Webhook 触发",
      last_run_at: "",
      last_run_status: "never",
      enabled: true,
      agent_id: "agent-general",
      instruction: "",
      event_config: {
        source_type: "webhook",
        source_name: "",
        event_description: "",
        endpoint: "",
        secret: "",
        trigger_note: "",
        rate_limit: "30 次/分钟",
        dedupe_window: "10 分钟",
        recent_requests: [
          {
            at: "2026-04-13 11:42",
            status: "success",
            summary: "静态示例：已接收一条构建失败事件，并完成处理。"
          }
        ],
        target_name: "",
        url: "",
        frequency: "每 30 分钟",
        detection: "content_change",
        request_method: "GET",
        headers: "Accept: application/json",
        auth: "",
        timeout_seconds: "10",
        recent_checks: [
          {
            at: "2026-04-13 08:00",
            status: "success",
            summary: "静态示例：接口检查成功，未发现新变化。"
          }
        ]
      },
      recent_runs: []
    };
  }

  function mergeSavedTask(draft, mode) {
    const nextTask = clone(draft);
    if (nextTask.trigger_type === "time") {
      nextTask.trigger_mode = nextTask.schedule_config?.execution_type || "schedule";
    } else {
      nextTask.trigger_mode = nextTask.event_config?.source_type || "webhook";
      if (nextTask.event_config?.source_type === "webhook") {
        nextTask.event_config.frequency = "";
      }
    }
    nextTask.trigger_summary = buildTriggerSummary(nextTask);
    if (mode === "create") {
      nextTask.last_run_at = "";
      nextTask.last_run_status = "never";
      nextTask.recent_runs = [];
    }
    return nextTask;
  }

  function init({ container }) {
    state.root = container;
    state.tasks = Array.isArray(window.AUTOMATION_TASKS_MOCK) ? window.AUTOMATION_TASKS_MOCK.map(clone) : [];

    container.addEventListener("click", handleClick);
    container.addEventListener("input", handleInput);
    container.addEventListener("change", handleChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleDocumentMouseDown);
  }

  function handleDocumentMouseDown(event) {
    if (!state.root || !state.createMenuOpen) return;
    if (event.target.closest("[data-automation-create-wrap]")) return;
    state.createMenuOpen = false;
    render();
  }

  function handleKeyDown(event) {
    if (event.key !== "Escape") return;
    if (state.modal) {
      state.modal = null;
      render();
      return;
    }
    if (state.createMenuOpen) {
      state.createMenuOpen = false;
      render();
    }
  }

  function getFilteredTasks() {
    const query = state.query.trim().toLowerCase();
    if (!query) return state.tasks;
    return state.tasks.filter((task) => task.name.toLowerCase().includes(query));
  }

  function getPagedTasks() {
    const filtered = getFilteredTasks();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (state.currentPage > totalPages) state.currentPage = totalPages;
    const start = (state.currentPage - 1) * PAGE_SIZE;
    return {
      filtered,
      totalPages,
      pageItems: filtered.slice(start, start + PAGE_SIZE)
    };
  }

  function openCreateModal(kind) {
    state.createMenuOpen = false;
    state.modal = {
      kind,
      mode: "create",
      draft: kind === "scheduled" ? createScheduledTaskDraft() : createEventTaskDraft(),
      errors: {},
      advancedOpen: false
    };
    render();
  }

  function openEditModal(task) {
    state.modal = {
      kind: task.trigger_type === "time" ? "scheduled" : "event",
      mode: "edit",
      draft: clone(task),
      errors: {},
      advancedOpen: false
    };
    render();
  }

  function setMessage(message) {
    state.message = message;
    render();
    window.clearTimeout(setMessage._timer);
    setMessage._timer = window.setTimeout(() => {
      state.message = "";
      render();
    }, 2600);
  }

  function validateScheduledModal() {
    const draft = state.modal.draft;
    const schedule = draft.schedule_config || {};
    const errors = {};
    if (!draft.name.trim()) errors.name = "请输入任务名称";
    if (!draft.instruction.trim()) errors.instruction = "请输入任务执行提示词";
    if (schedule.execution_type === "schedule") {
      if (!schedule.time) errors.scheduleTime = "请选择执行时间";
      if (schedule.frequency === "weekly" && (!Array.isArray(schedule.weekdays) || schedule.weekdays.length === 0)) {
        errors.weekdays = "请选择至少一个执行日";
      }
    }
    if (schedule.execution_type === "interval") {
      if (!schedule.interval_value || Number(schedule.interval_value) <= 0) {
        errors.intervalValue = "请输入有效的间隔值";
      }
    }
    if (schedule.execution_type === "schedule" || schedule.execution_type === "interval") {
      const from = (schedule.effective_from || "").trim();
      const until = (schedule.effective_until || "").trim();
      if ((from && !until) || (!from && until)) {
        errors.effectiveRange = "开始与结束日期需同时填写，或全部留空";
      } else if (from && until && from > until) {
        errors.effectiveRange = "结束日期不能早于开始日期";
      }
    }
    if (schedule.execution_type === "once") {
      if (!schedule.run_at_date) errors.runAtDate = "请选择执行日期";
      if (!schedule.run_at_time) errors.runAtTime = "请选择执行时间";
    }
    state.modal.errors = errors;
    return Object.keys(errors).length === 0;
  }

  function validateEventModal() {
    const draft = state.modal.draft;
    const config = draft.event_config || {};
    const webhook = config.source_type === "webhook";
    const errors = {};
    if (!draft.name.trim()) errors.name = "请输入任务名称";
    if (!draft.instruction.trim()) errors.instruction = "请输入任务执行提示词";
    if (webhook) {
      if (!config.source_name.trim()) errors.sourceName = "请输入来源名称";
    } else {
      if (!config.target_name.trim()) errors.targetName = "请输入检查目标名称";
      if (!config.url.trim()) errors.url = "请输入接口地址 URL";
      if (!config.frequency.trim()) errors.frequency = "请输入检查频率";
    }
    state.modal.errors = errors;
    return Object.keys(errors).length === 0;
  }

  function saveModal() {
    if (!state.modal) return;
    const valid = state.modal.kind === "scheduled" ? validateScheduledModal() : validateEventModal();
    if (!valid) {
      render();
      return;
    }

    const nextTask = mergeSavedTask(state.modal.draft, state.modal.mode);
    if (state.modal.mode === "create") {
      nextTask.id = createTaskId(nextTask.trigger_type === "time" ? "schedule" : "event");
      if (nextTask.trigger_type === "event" && nextTask.event_config?.source_type === "webhook") {
        nextTask.event_config.endpoint = generateWebhookUrl(nextTask.id);
        nextTask.event_config.secret = generateWebhookSecret();
      }
      state.tasks.unshift(nextTask);
      state.modal = null;
      setMessage(`已创建任务：${nextTask.name}`);
    } else {
      if (nextTask.trigger_type === "event" && nextTask.event_config?.source_type === "webhook") {
        nextTask.event_config.endpoint = nextTask.event_config.endpoint || generateWebhookUrl(nextTask.id);
        nextTask.event_config.secret = nextTask.event_config.secret || generateWebhookSecret();
      }
      state.tasks = state.tasks.map((item) => (item.id === nextTask.id ? nextTask : item));
      state.modal = null;
      setMessage(`已更新任务：${nextTask.name}`);
    }
  }

  async function copyWebhookUrl() {
    const endpoint = state.modal?.draft?.event_config?.endpoint;
    if (!endpoint) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(endpoint);
      setMessage(`已复制接入地址：${endpoint}`);
    } catch (error) {
      setMessage("浏览器未授予剪贴板权限，请手动复制接入地址。");
    }
  }

  function handleClick(event) {
    const actionEl = event.target.closest("[data-automation-action]");
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-automation-action");
    if (!action) return;

    if (action === "refresh") {
      setMessage("任务列表已刷新。");
      return;
    }
    if (action === "toggle-create-menu") {
      state.createMenuOpen = !state.createMenuOpen;
      render();
      return;
    }
    if (action === "create-scheduled") {
      openCreateModal("scheduled");
      return;
    }
    if (action === "create-event") {
      openCreateModal("event");
      return;
    }
    if (action === "close-modal") {
      state.modal = null;
      render();
      return;
    }
    if (action === "save-modal") {
      saveModal();
      return;
    }
    if (action === "page") {
      state.currentPage = Number(actionEl.getAttribute("data-page")) || 1;
      render();
      return;
    }
    if (action === "toggle-enabled") {
      const taskId = actionEl.getAttribute("data-task-id");
      const target = state.tasks.find((item) => item.id === taskId);
      if (!target) return;
      target.enabled = !target.enabled;
      setMessage(`${target.name} 已${target.enabled ? "启用" : "停用"}。`);
      return;
    }
    if (action === "edit-task") {
      const task = state.tasks.find((item) => item.id === actionEl.getAttribute("data-task-id"));
      if (task) openEditModal(task);
      return;
    }
    if (action === "delete-task") {
      const task = state.tasks.find((item) => item.id === actionEl.getAttribute("data-task-id"));
      if (!task) return;
      if (!window.confirm(`确认删除任务「${task.name}」吗？`)) return;
      state.tasks = state.tasks.filter((item) => item.id !== task.id);
      setMessage(`已删除任务：${task.name}`);
      return;
    }
    if (!state.modal) return;

    if (action === "set-execution-type") {
      state.modal.draft.schedule_config.execution_type = actionEl.getAttribute("data-value");
      if (state.modal.draft.schedule_config.execution_type === "interval") {
        state.modal.draft.schedule_config.interval_unit = "hour";
      }
      state.modal.errors = {};
      render();
      return;
    }
    if (action === "set-frequency") {
      state.modal.draft.schedule_config.frequency = actionEl.getAttribute("data-value");
      state.modal.errors = {};
      render();
      return;
    }
    if (action === "toggle-weekday") {
      const value = actionEl.getAttribute("data-value");
      const weekdays = state.modal.draft.schedule_config.weekdays || [];
      state.modal.draft.schedule_config.weekdays = weekdays.includes(value)
        ? weekdays.filter((item) => item !== value)
        : weekdays.concat(value);
      state.modal.errors = {};
      render();
      return;
    }
    if (action === "set-event-source") {
      state.modal.draft.event_config.source_type = actionEl.getAttribute("data-value");
      state.modal.errors = {};
      render();
      return;
    }
    if (action === "set-detection") {
      state.modal.draft.event_config.detection = actionEl.getAttribute("data-value");
      render();
      return;
    }
    if (action === "toggle-advanced") {
      state.modal.advancedOpen = !state.modal.advancedOpen;
      render();
      return;
    }
    if (action === "copy-webhook-url") {
      copyWebhookUrl();
      return;
    }
    if (action === "regenerate-secret") {
      state.modal.draft.event_config.secret = generateWebhookSecret();
      render();
      setMessage("已重新生成校验密钥。");
      return;
    }
    if (action === "test-event") {
      setMessage("已发送一条测试事件，任务进入模拟执行流程。");
      return;
    }
    if (action === "test-connection") {
      setMessage("测试连接完成，已返回一条模拟接口结果。");
    }
  }

  function handleInput(event) {
    const field = event.target.closest("[data-automation-field]");
    if (field) {
      state.query = field.value || "";
      state.currentPage = 1;
      render();
      return;
    }
    if (!state.modal) return;
    syncDraftField(event.target);
  }

  function handleChange(event) {
    if (!state.modal) return;
    syncDraftField(event.target);
  }

  function syncDraftField(input) {
    const field = input.getAttribute("data-modal-field");
    if (!field) return;
    const scope = input.getAttribute("data-modal-scope") || "root";
    if (scope === "root") {
      state.modal.draft[field] = input.type === "checkbox" ? input.checked : input.value;
    } else if (scope === "schedule") {
      state.modal.draft.schedule_config[field] = input.value;
    } else if (scope === "event") {
      state.modal.draft.event_config[field] = input.value;
    }
    state.modal.errors = {};
    render();
  }

  function render() {
    if (!state.root) return;
    const { filtered, totalPages, pageItems } = getPagedTasks();
    state.root.innerHTML = `
      <section class="automation-page">
        <header class="automation-head">
          <div>
            <h2>自动化任务</h2>
            <p>管理 Agent 的定时执行任务和外部事件触发任务</p>
          </div>
          <div class="automation-toolbar">
            <label class="automation-search">
              <input type="search" placeholder="按任务名称搜索" value="${escapeHTML(state.query)}" data-automation-field />
            </label>
            <button type="button" class="automation-icon-button" data-automation-action="refresh">刷新</button>
            <div class="automation-create-wrap" data-automation-create-wrap>
              <button type="button" class="automation-primary-button" data-automation-action="toggle-create-menu">新建任务</button>
              ${state.createMenuOpen ? renderCreateMenu() : ""}
            </div>
          </div>
        </header>

        ${state.message ? `<div class="automation-banner">${escapeHTML(state.message)}</div>` : ""}

        <section class="automation-table-shell">
          <div class="automation-table-head">
            <div>任务</div>
            <div>触发方式</div>
            <div>上次执行时间</div>
            <div>最近结果</div>
            <div>操作项</div>
          </div>
          ${filtered.length ? pageItems.map(renderTaskRow).join("") : renderEmptyState()}
          ${filtered.length ? renderPagination(filtered.length, totalPages) : ""}
        </section>

        ${state.modal ? renderModal() : ""}
      </section>
    `;
  }

  function renderCreateMenu() {
    return `
      <div class="automation-create-menu">
        <button type="button" class="automation-create-item" data-automation-action="create-scheduled">
          <strong>定时触发</strong>
          <span>定时、间隔或单次执行</span>
        </button>
        <button type="button" class="automation-create-item" data-automation-action="create-event">
          <strong>事件触发</strong>
          <span>Webhook 通知或 Poll 变化检查</span>
        </button>
      </div>
    `;
  }

  function renderTaskRow(task) {
    const meta = RESULT_META[task.last_run_status] || RESULT_META.never;
    return `
      <article class="automation-task-row">
        <div class="automation-task-main">
          <div class="automation-task-title">${escapeHTML(task.name)}</div>
          <div class="automation-task-desc">${escapeHTML(task.description || "—")}</div>
        </div>
        <div class="automation-task-trigger">
          <div>${escapeHTML(task.trigger_summary)}</div>
          <span class="automation-trigger-badge ${escapeHTML(task.trigger_mode)}">${escapeHTML(task.trigger_type === "time" ? (task.trigger_mode === "interval" ? "间隔执行" : task.trigger_mode === "once" ? "单次执行" : "定时执行") : task.trigger_mode === "poll" ? "Poll 检查" : "Webhook 触发")}</span>
        </div>
        <div class="automation-task-time">${escapeHTML(task.last_run_at || "—")}</div>
        <div><span class="automation-result-badge ${escapeHTML(meta.className)}">${escapeHTML(meta.label)}</span></div>
        <div class="automation-task-actions">
          <button type="button" class="automation-switch ${task.enabled ? "is-on" : ""}" data-automation-action="toggle-enabled" data-task-id="${escapeHTML(task.id)}"><span></span></button>
          <button type="button" class="automation-link-button" data-automation-action="edit-task" data-task-id="${escapeHTML(task.id)}">编辑</button>
          <button type="button" class="automation-link-button danger" data-automation-action="delete-task" data-task-id="${escapeHTML(task.id)}">删除</button>
        </div>
      </article>
    `;
  }

  function renderEmptyState() {
    return `
      <div class="automation-empty">
        <div class="automation-empty-title">未找到匹配任务</div>
        <p>可尝试调整搜索关键词，或从右上角新建任务。</p>
      </div>
    `;
  }

  function renderPagination(total, totalPages) {
    if (totalPages <= 1) return "";
    const pageButtons = Array.from({ length: totalPages }, (_, index) => index + 1)
      .map((page) => `<button type="button" class="automation-page-button ${page === state.currentPage ? "active" : ""}" data-automation-action="page" data-page="${page}">${page}</button>`)
      .join("");
    return `
      <footer class="automation-pagination">
        <span>共 ${total} 条</span>
        <div class="automation-page-list">
          <button type="button" class="automation-page-button" ${state.currentPage === 1 ? "disabled" : ""} data-automation-action="page" data-page="${state.currentPage - 1}">‹</button>
          ${pageButtons}
          <button type="button" class="automation-page-button" ${state.currentPage === totalPages ? "disabled" : ""} data-automation-action="page" data-page="${state.currentPage + 1}">›</button>
        </div>
      </footer>
    `;
  }

  function renderModal() {
    return state.modal.kind === "scheduled" ? renderScheduledModal() : renderEventModal();
  }

  function renderScheduledModal() {
    const modal = state.modal;
    const draft = modal.draft;
    const schedule = draft.schedule_config;
    const errors = modal.errors;
    return `
      <div class="automation-modal-backdrop">
        <div class="automation-modal">
          <div class="automation-modal-head">
            <div>
              <h3>${modal.mode === "edit" ? "编辑定时任务" : "新建定时任务"}</h3>
              <p>配置 Agent 的时间触发规则、执行说明和回溯记录。</p>
            </div>
            <button type="button" class="automation-close-button" data-automation-action="close-modal" aria-label="关闭弹窗">×</button>
          </div>
          <div class="automation-modal-body">
            ${renderBaseFields(draft, errors, "例如：每日销售简报", "例如：读取昨日日报数据，生成晨会摘要并发送给销售负责人")}
            ${renderScheduleConfig(schedule, errors)}
            ${modal.mode === "edit" ? renderExecutionSection(draft.recent_runs || []) : ""}
          </div>
          <div class="automation-modal-foot">
            <button type="button" class="automation-secondary-button" data-automation-action="close-modal">取消</button>
            <button type="button" class="automation-primary-button" data-automation-action="save-modal">${modal.mode === "edit" ? "保存修改" : "创建任务"}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderEventModal() {
    const modal = state.modal;
    const draft = modal.draft;
    const config = draft.event_config;
    const errors = modal.errors;
    const webhook = config.source_type === "webhook";
    return `
      <div class="automation-modal-backdrop">
        <div class="automation-modal">
          <div class="automation-modal-head">
            <div>
              <h3>${modal.mode === "edit" ? "编辑事件任务" : "新建事件任务"}</h3>
              <p>配置 Webhook 或 Poll 触发来源，并定义 Agent 在事件到达后的动作。</p>
            </div>
            <button type="button" class="automation-close-button" data-automation-action="close-modal" aria-label="关闭弹窗">×</button>
          </div>
          <div class="automation-modal-body">
            ${renderBaseFields(draft, errors, "例如：构建失败自动诊断", "例如：读取构建失败日志，提取错误原因并通知项目负责人")}
            <section class="automation-section">
              <div class="automation-section-copy">
                <h4>事件来源配置</h4>
                <p>支持 Webhook 触发和 Poll（接口变化检查）两类来源。</p>
              </div>
              <div class="automation-option-grid two">
                <button type="button" class="automation-option-card ${webhook ? "active" : ""}" data-automation-action="set-event-source" data-value="webhook">Webhook 触发</button>
                <button type="button" class="automation-option-card ${!webhook ? "active" : ""}" data-automation-action="set-event-source" data-value="poll">Poll（接口变化检查）</button>
              </div>
              ${webhook ? renderWebhookFields(config, errors, modal.mode, modal.advancedOpen) : renderPollFields(config, errors, modal.advancedOpen)}
            </section>
            ${modal.mode === "edit" ? renderExecutionSection(draft.recent_runs || []) : ""}
          </div>
          <div class="automation-modal-foot">
            <button type="button" class="automation-secondary-button" data-automation-action="close-modal">取消</button>
            <button type="button" class="automation-primary-button" data-automation-action="save-modal">${modal.mode === "edit" ? "保存修改" : "创建任务"}</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderBaseFields(draft, errors, namePlaceholder, instructionPlaceholder) {
    return `
      <section class="automation-section">
        <div class="automation-section-copy">
          <h4>基础信息</h4>
          <p>描述任务名称、用途和 Agent 任务执行提示词。</p>
        </div>
        ${renderField("任务名称", `<input value="${escapeHTML(draft.name)}" placeholder="${escapeHTML(namePlaceholder)}" data-modal-field="name" />`, errors.name, true)}
        ${renderField("任务描述", `<textarea data-modal-field="description" rows="4" placeholder="补充任务概述、任务背景、产出说明等，用于识别自动化任务">${escapeHTML(draft.description)}</textarea>`)}
        ${renderField("任务执行提示词", `<textarea data-modal-field="instruction" rows="7" placeholder="${escapeHTML(instructionPlaceholder)}">${escapeHTML(draft.instruction)}</textarea>`, errors.instruction, true)}
      </section>
    `;
  }

  function renderScheduleConfig(schedule, errors) {
    return `
      <section class="automation-section">
        <div class="automation-section-copy">
          <h4>触发配置</h4>
          <p>支持定时执行、按固定间隔执行和单次执行。</p>
        </div>
        <div class="automation-option-grid three">
          <button type="button" class="automation-option-card ${schedule.execution_type === "schedule" ? "active" : ""}" data-automation-action="set-execution-type" data-value="schedule">定时执行</button>
          <button type="button" class="automation-option-card ${schedule.execution_type === "interval" ? "active" : ""}" data-automation-action="set-execution-type" data-value="interval">间隔执行</button>
          <button type="button" class="automation-option-card ${schedule.execution_type === "once" ? "active" : ""}" data-automation-action="set-execution-type" data-value="once">单次执行</button>
        </div>
        ${schedule.execution_type === "schedule" ? `
          <div class="automation-inline-grid">
            <div>
              <div class="automation-sub-label">频率</div>
              <div class="automation-chip-row">
                <button type="button" class="automation-chip ${schedule.frequency === "daily" ? "active" : ""}" data-automation-action="set-frequency" data-value="daily">每天</button>
                <button type="button" class="automation-chip ${schedule.frequency === "weekly" ? "active" : ""}" data-automation-action="set-frequency" data-value="weekly">每周</button>
              </div>
              ${schedule.frequency === "weekly" ? `
                <div class="automation-sub-block">
                  <div class="automation-sub-label">周几</div>
                  <div class="automation-chip-row">
                    ${WEEKDAY_OPTIONS.map((option) => `<button type="button" class="automation-chip ${(schedule.weekdays || []).includes(option.value) ? "active" : ""}" data-automation-action="toggle-weekday" data-value="${option.value}">${option.label}</button>`).join("")}
                  </div>
                  ${errors.weekdays ? `<div class="automation-error">${escapeHTML(errors.weekdays)}</div>` : ""}
                </div>
              ` : ""}
            </div>
            ${renderField("执行时间", `<input type="time" value="${escapeHTML(schedule.time || "")}" data-modal-scope="schedule" data-modal-field="time" />`, errors.scheduleTime, true)}
          </div>
        ` : ""}
        ${schedule.execution_type === "interval" ? renderField("每隔多少小时执行一次", `<input type="number" min="1" value="${escapeHTML(schedule.interval_value)}" data-modal-scope="schedule" data-modal-field="interval_value" />`, errors.intervalValue, true) : ""}
        ${(schedule.execution_type === "schedule" || schedule.execution_type === "interval") ? `
          <div class="automation-field">
            <div class="automation-label">生效日期区间</div>
            <div class="automation-date-range">
              <input type="date" value="${escapeHTML(schedule.effective_from || "")}" data-modal-scope="schedule" data-modal-field="effective_from" />
              <span>至</span>
              <input type="date" value="${escapeHTML(schedule.effective_until || "")}" data-modal-scope="schedule" data-modal-field="effective_until" />
            </div>
            ${errors.effectiveRange ? `<div class="automation-error">${escapeHTML(errors.effectiveRange)}</div>` : ""}
          </div>
        ` : ""}
        ${schedule.execution_type === "once" ? `
          <div class="automation-inline-grid two-col">
            ${renderField("执行日期", `<input type="date" value="${escapeHTML(schedule.run_at_date || "")}" data-modal-scope="schedule" data-modal-field="run_at_date" />`, errors.runAtDate, true)}
            ${renderField("执行时间", `<input type="time" value="${escapeHTML(schedule.run_at_time || "")}" data-modal-scope="schedule" data-modal-field="run_at_time" />`, errors.runAtTime, true)}
          </div>
        ` : ""}
      </section>
    `;
  }

  function renderWebhookFields(config, errors, mode, advancedOpen) {
    return `
      <div class="automation-modal-grid">
        ${renderField("来源名称", `<input value="${escapeHTML(config.source_name || "")}" placeholder="例如：GitHub 构建通知" data-modal-scope="event" data-modal-field="source_name" />`, errors.sourceName, true)}
        ${renderField("事件说明", `<input value="${escapeHTML(config.event_description || "")}" placeholder="例如：CI/CD 构建失败回调" data-modal-scope="event" data-modal-field="event_description" />`)}
      </div>
      <div class="automation-modal-grid">
        ${renderReadonlyField("接入地址", mode === "edit"
          ? `<div class="automation-inline-actions"><input readonly value="${escapeHTML(config.endpoint || "")}" /><button type="button" class="automation-secondary-button compact" data-automation-action="copy-webhook-url">复制</button></div>`
          : `<div class="automation-placeholder-box">保存后生成</div>`)}
        ${renderReadonlyField("校验密钥", mode === "edit"
          ? `<div class="automation-inline-actions"><input readonly value="${escapeHTML(config.secret || "")}" /><button type="button" class="automation-secondary-button compact" data-automation-action="regenerate-secret">重新生成</button></div>`
          : `<div class="automation-placeholder-box">保存后生成</div>`)}
      </div>
      ${renderField("触发说明", `<textarea rows="4" placeholder="补充触发规则、过滤逻辑或下游处理约束" data-modal-scope="event" data-modal-field="trigger_note">${escapeHTML(config.trigger_note || "")}</textarea>`)}
      ${renderAdvancedSection("频率限制、去重窗口、测试事件与最近请求记录", advancedOpen, `
        <div class="automation-modal-grid">
          ${renderField("频率限制", `<input value="${escapeHTML(config.rate_limit || "")}" placeholder="例如：30 次/分钟" data-modal-scope="event" data-modal-field="rate_limit" />`)}
          ${renderField("去重时间窗口", `<input value="${escapeHTML(config.dedupe_window || "")}" placeholder="例如：10 分钟" data-modal-scope="event" data-modal-field="dedupe_window" />`)}
        </div>
        <div class="automation-inline-actions">
          <button type="button" class="automation-secondary-button" data-automation-action="test-event">测试事件</button>
        </div>
        ${renderRecentEventRows("最近请求记录", config.recent_requests || [])}
      `)}
    `;
  }

  function renderPollFields(config, errors, advancedOpen) {
    return `
      <div class="automation-modal-grid">
        ${renderField("检查目标名称", `<input value="${escapeHTML(config.target_name || "")}" placeholder="例如：库存接口 / 价格接口" data-modal-scope="event" data-modal-field="target_name" />`, errors.targetName, true)}
        ${renderField("检查频率", `<input value="${escapeHTML(config.frequency || "")}" placeholder="例如：每 15 分钟" data-modal-scope="event" data-modal-field="frequency" />`, errors.frequency, true)}
      </div>
      ${renderField("接口地址 URL", `<input value="${escapeHTML(config.url || "")}" placeholder="https://api.example.com/status" data-modal-scope="event" data-modal-field="url" />`, errors.url, true)}
      <div class="automation-field">
        <div class="automation-label">变化判断方式 <span class="required">*</span></div>
        <div class="automation-radio-list">
          ${POLL_DETECTION_OPTIONS.map((option) => `<button type="button" class="automation-radio-item ${config.detection === option.value ? "active" : ""}" data-automation-action="set-detection" data-value="${option.value}">${option.label}</button>`).join("")}
        </div>
      </div>
      ${renderAdvancedSection("请求方法、请求头、认证信息、超时时间与最近检查结果", advancedOpen, `
        <div class="automation-modal-grid">
          ${renderField("请求方法", `<select data-modal-scope="event" data-modal-field="request_method"><option value="GET" ${config.request_method === "GET" ? "selected" : ""}>GET</option><option value="POST" ${config.request_method === "POST" ? "selected" : ""}>POST</option><option value="PUT" ${config.request_method === "PUT" ? "selected" : ""}>PUT</option></select>`)}
          ${renderField("超时时间", `<input value="${escapeHTML(config.timeout_seconds || "")}" placeholder="秒" data-modal-scope="event" data-modal-field="timeout_seconds" />`)}
        </div>
        ${renderField("请求头", `<textarea rows="4" data-modal-scope="event" data-modal-field="headers">${escapeHTML(config.headers || "")}</textarea>`)}
        ${renderField("认证信息", `<textarea rows="4" data-modal-scope="event" data-modal-field="auth">${escapeHTML(config.auth || "")}</textarea>`)}
        <div class="automation-inline-actions">
          <button type="button" class="automation-secondary-button" data-automation-action="test-connection">测试连接</button>
        </div>
        ${renderRecentEventRows("最近检查结果", config.recent_checks || [])}
      `)}
    `;
  }

  function renderExecutionSection(records) {
    return `
      <section class="automation-section">
        <div class="automation-section-copy">
          <h4>最近执行记录</h4>
          <p>展示最近一次或最近几次任务触发后的执行结果与简短摘要。</p>
        </div>
        ${records.length ? `
          <div class="automation-record-list">
            ${records.map((record) => {
              const meta = RESULT_META[record.result] || RESULT_META.never;
              return `<article class="automation-record-item">
                <div class="automation-record-head">
                  <strong>${escapeHTML(record.triggered_at)}</strong>
                  <span class="automation-result-badge ${escapeHTML(meta.className)}">${escapeHTML(meta.label)}</span>
                </div>
                <p>${escapeHTML(record.summary)}</p>
              </article>`;
            }).join("")}
          </div>
        ` : `<div class="automation-placeholder-box">暂无执行记录。</div>`}
      </section>
    `;
  }

  function renderAdvancedSection(description, open, body) {
    return `
      <section class="automation-advanced">
        <button type="button" class="automation-advanced-trigger" data-automation-action="toggle-advanced">
          <div>
            <strong>高级配置</strong>
            <span>${escapeHTML(description)}</span>
          </div>
          <span>${open ? "收起" : "展开"}</span>
        </button>
        ${open ? `<div class="automation-advanced-body">${body}</div>` : ""}
      </section>
    `;
  }

  function renderRecentEventRows(title, rows) {
    return `
      <div class="automation-log-box">
        <div class="automation-log-title">${escapeHTML(title)}</div>
        <div class="automation-record-list">
          ${rows.map((row) => {
            const meta = RESULT_META[row.status] || RESULT_META.never;
            return `<article class="automation-record-item">
              <div class="automation-record-head">
                <strong>${escapeHTML(row.at)}</strong>
                <span class="automation-result-badge ${escapeHTML(meta.className)}">${escapeHTML(meta.label)}</span>
              </div>
              <p>${escapeHTML(row.summary)}</p>
            </article>`;
          }).join("")}
        </div>
      </div>
    `;
  }

  function renderField(label, control, error, required) {
    return `
      <div class="automation-field">
        <div class="automation-label">${escapeHTML(label)} ${required ? '<span class="required">*</span>' : ""}</div>
        ${control}
        ${error ? `<div class="automation-error">${escapeHTML(error)}</div>` : ""}
      </div>
    `;
  }

  function renderReadonlyField(label, content) {
    return `
      <div class="automation-field">
        <div class="automation-label">${escapeHTML(label)}</div>
        ${content}
      </div>
    `;
  }

  window.AutomationTasksModule = {
    init,
    render
  };
})();
