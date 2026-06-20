(function () {
  const source = window.MEMORY_DATA;
  if (!source) return;

  const TYPE_META = {
    user: { label: "用户信息", tone: "slate" },
    feedback: { label: "协作反馈", tone: "blue" },
    project: { label: "项目语境", tone: "purple" },
    reference: { label: "信息入口", tone: "green" }
  };
  const STATUS_META = {
    active: { label: "有效", tone: "success" },
    marked_material: { label: "已标为更新材料", tone: "warning" },
    included_in_version: { label: "已并入新版本", tone: "info" },
    outdated: { label: "可能过时", tone: "muted" }
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const state = {
    root: null,
    portal: null,
    tab: "personal",
    query: "",
    type: "all",
    status: "all",
    userMemories: clone(source.userMemories || []),
    clawMemories: clone(source.clawMemories || []),
    stores: clone(source.organizationStores),
    conversations: clone(source.conversationMemory),
    handoffs: clone(source.expertHandoffs),
    notifications: clone(source.notifications),
    history: clone(source.organizeHistory || []),
    modal: null,
    banner: ""
  };

  function escapeHTML(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(value) {
    return escapeHTML(value).replace(/`/g, "&#96;");
  }

  function icon(name) {
    return `<svg aria-hidden="true"><use href="#icon-${escapeAttr(name)}"></use></svg>`;
  }

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  function emitUpdate(reason) {
    window.dispatchEvent(
      new CustomEvent("memory:updated", {
        detail: { reason }
      })
    );
  }

  function isMemoryRoute() {
    return String(window.location.hash || "").replace(/^#/, "") === "memory";
  }

  function renderIfActive() {
    if (isMemoryRoute()) render();
    else renderPortal();
  }

  function setBanner(message) {
    state.banner = message;
    renderIfActive();
    window.clearTimeout(setBanner._timer);
    setBanner._timer = window.setTimeout(() => {
      state.banner = "";
      renderIfActive();
    }, 2600);
  }

  function getStore(storeId) {
    return state.stores.find((store) => store.id === storeId) || null;
  }

  function getAllMemories() {
    return [...state.userMemories, ...state.clawMemories].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  }

  function setAllMemories(memories) {
    state.userMemories = memories.filter((memory) => memory.scope !== "claw");
    state.clawMemories = memories.filter((memory) => memory.scope === "claw");
  }

  function addMemory(memory) {
    const next = { ...memory, scope: memory.scope === "claw" ? "claw" : "user" };
    if (next.scope === "claw") state.clawMemories.unshift(next);
    else state.userMemories.unshift(next);
    return next;
  }

  function getMemory(memoryId) {
    return getAllMemories().find((memory) => memory.id === memoryId) || null;
  }

  function getConversation(sessionKey) {
    const key = sessionKey && state.conversations[sessionKey] ? sessionKey : "expense";
    return state.conversations[key] || { used: [], remembered: [], events: [] };
  }

  function getExpertState(agentId) {
    if (!agentId) return state.handoffs.default;
    if (!state.handoffs[agentId]) state.handoffs[agentId] = clone(state.handoffs.default);
    return state.handoffs[agentId];
  }

  function getReadonlyUserMemories(agentId) {
    const handoff = getExpertState(agentId || "default");
    const ids = handoff.userMemoryIds || state.userMemories.map((memory) => memory.id);
    return ids
      .map((memoryId) => getMemory(memoryId))
      .filter((memory) => memory?.scope === "user" && ["active", "included_in_version"].includes(memory.status));
  }

  function getMemoryLabel(id) {
    const memory = getMemory(id);
    if (memory) return memory.content;
    for (const store of state.stores) {
      const entry = store.entries.find((item) => item.id === id);
      if (entry) return entry.title;
    }
    return id;
  }

  function getMemorySource(id) {
    const memory = getMemory(id);
    if (memory) return { source: "personal", label: "我的记忆", memory };
    for (const store of state.stores) {
      const entry = store.entries.find((item) => item.id === id);
      if (entry) return { source: "organization", label: store.name, store, entry };
    }
    return null;
  }

  function getMountedStores() {
    return clone(state.stores);
  }

  function getConversationMemory(sessionKey) {
    return clone(getConversation(sessionKey));
  }

  function getExpertHandoff(agentId) {
    return clone(getExpertState(agentId));
  }

  function getNotifications() {
    return clone(state.notifications);
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    const handler = (event) => listener(event.detail || {});
    window.addEventListener("memory:updated", handler);
    return () => window.removeEventListener("memory:updated", handler);
  }

  function getFilteredMemories() {
    const query = state.query.trim().toLowerCase();
    return getAllMemories().filter((memory) => {
      if (state.type !== "all" && memory.type !== state.type) return false;
      if (state.status !== "all" && memory.status !== state.status) return false;
      if (!query) return true;
      return `${memory.content} ${memory.sourceSessionTitle}`.toLowerCase().includes(query);
    });
  }

  function renderPersonalMemory(memory) {
    const type = TYPE_META[memory.type] || TYPE_META.feedback;
    const status = STATUS_META[memory.status] || STATUS_META.active;
    const canContribute = memory.status !== "marked_material" && memory.status !== "included_in_version";
    return `<article class="memory-item">
      <div class="memory-item-main">
        <div class="memory-item-labels">
          <span class="memory-type memory-type--${type.tone}">${escapeHTML(type.label)}</span>
          <span class="memory-status memory-status--${status.tone}">${escapeHTML(status.label)}</span>
        </div>
        <p>${escapeHTML(memory.content)}</p>
        <div class="memory-item-meta">
          <button type="button" data-memory-action="open-source" data-memory-id="${escapeAttr(memory.id)}">来源：${escapeHTML(memory.sourceSessionTitle)}</button>
          <span>${escapeHTML(memory.createdAt)}</span>
        </div>
      </div>
      <div class="memory-item-actions">
        ${canContribute ? `<button type="button" class="memory-action memory-action--primary" data-memory-action="open-contribute" data-memory-id="${escapeAttr(memory.id)}">贡献给组织</button>` : ""}
        <button type="button" class="memory-action" data-memory-action="open-edit" data-memory-id="${escapeAttr(memory.id)}">编辑</button>
        <button type="button" class="memory-action memory-action--danger" data-memory-action="open-delete" data-memory-id="${escapeAttr(memory.id)}">删除</button>
      </div>
    </article>`;
  }

  function renderPersonalTab() {
    const memories = getFilteredMemories();
    const total = getAllMemories().length;
    return `<div class="memory-toolbar">
      <label class="memory-search">
        ${icon("search")}
        <input type="search" value="${escapeAttr(state.query)}" data-memory-input="query" placeholder="搜索记忆内容或来源会话" />
      </label>
      <label class="memory-filter">
        <span>类型</span>
        <select data-memory-input="type">
          <option value="all"${state.type === "all" ? " selected" : ""}>全部类型</option>
          ${Object.entries(TYPE_META)
            .map(([value, meta]) => `<option value="${value}"${state.type === value ? " selected" : ""}>${escapeHTML(meta.label)}</option>`)
            .join("")}
        </select>
      </label>
      <label class="memory-filter">
        <span>状态</span>
        <select data-memory-input="status">
          <option value="all"${state.status === "all" ? " selected" : ""}>全部状态</option>
          ${Object.entries(STATUS_META)
            .map(([value, meta]) => `<option value="${value}"${state.status === value ? " selected" : ""}>${escapeHTML(meta.label)}</option>`)
            .join("")}
        </select>
      </label>
    </div>
    <div class="memory-list">
      ${
        memories.length
          ? memories.map(renderPersonalMemory).join("")
          : `<div class="memory-empty">
              ${icon("archive")}
              <strong>没有匹配的记忆</strong>
              <p>${total ? "调整关键词或筛选条件后再试。" : "和 Claw 多聊聊，它会记住重要的事。"}</p>
              ${total ? `<button type="button" data-memory-action="clear-filters">清除筛选</button>` : ""}
            </div>`
      }
    </div>`;
  }

  function renderOrganizationTab() {
    return `<div class="memory-org-intro">
      <div>
      <strong>组织记忆由组织统一维护</strong>
        <p>你可以浏览已授权内容；只有具备材料权限的库接受个人标记。</p>
      </div>
      <span>${state.stores.length} 个库 · 只读浏览</span>
    </div>
    <div class="memory-store-grid">
      ${state.stores
        .map((store) => {
          const access = store.access === "propose-only" ? "可标为更新材料" : "由组织维护 · 只读";
          return `<button type="button" class="memory-store-card" data-memory-action="open-store" data-store-id="${escapeAttr(store.id)}">
            <span class="memory-store-icon">${icon("book")}</span>
            <span class="memory-store-copy">
              <span class="memory-store-heading">
                <strong>《${escapeHTML(store.name)}》</strong>
                <em>${escapeHTML(access)}</em>
              </span>
              <span>${escapeHTML(store.description)}</span>
              <span class="memory-store-meta">${escapeHTML(store.maintainer)} · ${store.entries.length} 条 · ${escapeHTML(store.updatedAt)}</span>
            </span>
            <span class="memory-store-arrow">${icon("chevron")}</span>
          </button>`;
        })
        .join("")}
    </div>`;
  }

  function renderPrivacy() {
    const items = [
      ["shield", "你的记忆只属于你", "组织和其他人看不到你的个人记忆。"],
      ["eye", "记住什么你说了算", "每次记住都有提示，随时可以撤销或删除。"],
      ["share", "贡献才会共享", "只有你确认的内容才会成为组织更新材料。"]
    ];
    return `<section class="memory-privacy">
      ${items
        .map(
          ([name, title, detail]) => `<div>
            <span>${icon(name)}</span>
            <p><strong>${title}</strong><small>${detail}</small></p>
          </div>`
        )
        .join("")}
    </section>`;
  }

  function render() {
    if (!state.root) return;
    const unread = state.notifications.filter((item) => !item.read).length;
    state.root.innerHTML = `<section class="memory-page" aria-labelledby="memoryPageTitle">
      ${state.banner ? `<div class="memory-banner">${escapeHTML(state.banner)}</div>` : ""}
      <header class="memory-page-head">
        <div>
          <h1 id="memoryPageTitle">记忆中心</h1>
          <p>查看 Claw 记住了什么，并决定哪些经验可以贡献给组织。</p>
        </div>
        <div class="memory-page-actions">
          <button type="button" class="memory-secondary-btn memory-notification-btn" data-memory-action="open-notifications">
            ${icon("bell")}<span>消息</span>${unread ? `<b>${unread}</b>` : ""}
          </button>
          <button type="button" class="memory-secondary-btn" data-memory-action="open-history">${icon("clock")}<span>整理历史</span></button>
          <button type="button" class="memory-primary-btn" data-memory-action="open-organize">${icon("spark")}<span>整理我的记忆</span></button>
        </div>
      </header>
      <nav class="memory-tabs" role="tablist" aria-label="记忆类型">
        <button type="button" role="tab" aria-selected="${state.tab === "personal"}" class="${state.tab === "personal" ? "is-active" : ""}" data-memory-action="set-tab" data-tab="personal">我的记忆 <span>${getAllMemories().length}</span></button>
        <button type="button" role="tab" aria-selected="${state.tab === "organization"}" class="${state.tab === "organization" ? "is-active" : ""}" data-memory-action="set-tab" data-tab="organization">组织记忆 <span>${state.stores.length} 个库</span></button>
      </nav>
      <div class="memory-page-body">
        ${state.tab === "organization" ? renderOrganizationTab() : renderPersonalTab()}
      </div>
      ${renderPrivacy()}
    </section>`;
    renderPortal();
  }

  function renderDialogShell(title, subtitle, body, footer = "", className = "") {
    return `<div class="memory-modal-backdrop" data-memory-action="close-modal">
      <section class="memory-modal ${className}" role="dialog" aria-modal="true" aria-label="${escapeAttr(title)}" data-memory-dialog>
        <header class="memory-modal-head">
          <div><h2>${escapeHTML(title)}</h2>${subtitle ? `<p>${escapeHTML(subtitle)}</p>` : ""}</div>
          <button type="button" data-memory-action="close-modal" aria-label="关闭">${icon("x")}</button>
        </header>
        <div class="memory-modal-body">${body}</div>
        ${footer ? `<footer class="memory-modal-foot">${footer}</footer>` : ""}
      </section>
    </div>`;
  }

  function renderMemoryDetail(memory) {
    const type = TYPE_META[memory.type] || TYPE_META.feedback;
    const status = STATUS_META[memory.status] || STATUS_META.active;
    const store = getStore(memory.updateMaterial?.storeId);
    return renderDialogShell(
      "记忆详情",
      "你可以随时修正或删除自己的记忆。",
      `<div class="memory-detail">
        <div class="memory-item-labels">
          <span class="memory-type memory-type--${type.tone}">${escapeHTML(type.label)}</span>
          <span class="memory-status memory-status--${status.tone}">${escapeHTML(status.label)}</span>
        </div>
        <p>${escapeHTML(memory.content)}</p>
        <dl>
          <div><dt>来源会话</dt><dd>${escapeHTML(memory.sourceSessionTitle)}</dd></div>
          <div><dt>记住时间</dt><dd>${escapeHTML(memory.createdAt)}</dd></div>
          ${store ? `<div><dt>材料去向</dt><dd>《${escapeHTML(store.name)}》 · ${escapeHTML(status.label)}</dd></div>` : ""}
        </dl>
      </div>`,
      `<button type="button" class="memory-secondary-btn" data-memory-action="close-modal">关闭</button>
       <button type="button" class="memory-primary-btn" data-memory-action="open-edit" data-memory-id="${escapeAttr(memory.id)}">编辑</button>`
    );
  }

  function renderEditDialog(modal) {
    const memory = getMemory(modal.memoryId);
    if (!memory) return "";
    return renderDialogShell(
      "编辑记忆",
      "修改后将立即用于后续会话。",
      `<label class="memory-form-field"><span>记忆内容</span><textarea rows="5" data-memory-modal-input="content">${escapeHTML(modal.content)}</textarea>${modal.error ? `<em>${escapeHTML(modal.error)}</em>` : ""}</label>
       <label class="memory-form-field"><span>类型</span><select data-memory-modal-input="type">${Object.entries(TYPE_META)
         .map(([value, meta]) => `<option value="${value}"${modal.type === value ? " selected" : ""}>${escapeHTML(meta.label)}</option>`)
         .join("")}</select></label>`,
      `<button type="button" class="memory-secondary-btn" data-memory-action="close-modal">取消</button>
       <button type="button" class="memory-primary-btn" data-memory-action="save-edit">保存</button>`
    );
  }

  function renderDeleteDialog(modal) {
    const memory = getMemory(modal.memoryId);
    if (!memory) return "";
    return renderDialogShell(
      "删除这条记忆？",
      "删除后 Claw 不会再在后续会话中使用它。",
      `<div class="memory-confirm-copy">${icon("warning")}<p>${escapeHTML(memory.content)}</p></div>`,
      `<button type="button" class="memory-secondary-btn" data-memory-action="close-modal">取消</button>
       <button type="button" class="memory-danger-btn" data-memory-action="confirm-delete" data-memory-id="${escapeAttr(memory.id)}">确认删除</button>`,
      "memory-modal--compact"
    );
  }

  function renderContributeDialog(modal) {
    const available = state.stores.filter((store) => store.access === "propose-only");
    return renderDialogShell(
      "贡献给组织",
      "内容会作为更新材料进入组织侧材料池，等待 Store Owner 下次整理。",
      `<label class="memory-form-field"><span>目标组织记忆</span><select data-memory-modal-input="storeId">
          <option value="">请选择</option>
          ${available.map((store) => `<option value="${escapeAttr(store.id)}"${modal.storeId === store.id ? " selected" : ""}>《${escapeHTML(store.name)}》</option>`).join("")}
        </select>${modal.storeError ? `<em>${escapeHTML(modal.storeError)}</em>` : ""}</label>
       <label class="memory-form-field"><span>材料内容</span><textarea rows="5" data-memory-modal-input="content">${escapeHTML(modal.content)}</textarea>${modal.contentError ? `<em>${escapeHTML(modal.contentError)}</em>` : ""}</label>
       <div class="memory-privacy-note">${icon("shield")}<span>只会标记上面的材料内容，不会共享你的其他个人记忆或会话。</span></div>`,
      `<button type="button" class="memory-secondary-btn" data-memory-action="close-modal">取消</button>
       <button type="button" class="memory-primary-btn" data-memory-action="submit-contribution">标为更新材料</button>`
    );
  }

  function renderStoreDialog(modal) {
    const store = getStore(modal.storeId);
    if (!store) return "";
    const sections = [...new Set(store.entries.map((entry) => entry.section))];
    return renderDialogShell(
      `《${store.name}》`,
      `${store.maintainer}维护 · ${store.access === "propose-only" ? "可标为更新材料" : "只读"}`,
      `<div class="memory-store-detail-intro"><p>${escapeHTML(store.description)}</p><span>${icon("shield")}由组织维护 · 使用端只读</span></div>
       <div class="memory-store-index">
        ${sections
          .map(
            (section) => `<section><h3>${escapeHTML(section)}</h3>${store.entries
              .filter((entry) => entry.section === section)
              .map(
                (entry) => `<article>
                  <div><strong>${escapeHTML(entry.title)}</strong><span>${escapeHTML(entry.updatedAt)}</span></div>
                  <p>${escapeHTML(entry.summary)}</p>
                </article>`
              )
              .join("")}</section>`
          )
          .join("")}
       </div>`,
      `<button type="button" class="memory-primary-btn" data-memory-action="close-modal">完成</button>`,
      "memory-modal--wide"
    );
  }

  function getOrganizePreview(modal) {
    const activeChanges = modal.changes.filter((change) => change.active);
    let next = clone(modal.beforeSnapshot);
    activeChanges.forEach((change) => {
      if (change.kind === "merge") {
        const keep = change.memoryIds[0];
        next = next.filter((memory) => memory.id === keep || !change.memoryIds.includes(memory.id));
      } else if (change.kind === "update") {
        next = next.map((memory) => (change.memoryIds.includes(memory.id) ? { ...memory, content: change.nextContent, status: "active" } : memory));
      } else if (change.kind === "remove") {
        next = next.filter((memory) => !change.memoryIds.includes(memory.id));
      }
    });
    return next;
  }

  function renderOrganizeDialog(modal) {
    if (modal.phase === "confirm") {
      return renderDialogShell(
        "整理我的记忆",
        "整理会合并重复、修正过时内容并移除无用信息。",
        `<div class="memory-organize-intro">${icon("spark")}<div><strong>先生成变更预览，不会直接修改</strong><p>你可以逐条撤销建议，再决定应用或放弃。</p></div></div>`,
        `<button type="button" class="memory-secondary-btn" data-memory-action="close-modal">取消</button>
         <button type="button" class="memory-primary-btn" data-memory-action="run-organize">开始整理</button>`,
        "memory-modal--compact"
      );
    }
    if (modal.phase === "running") {
      return renderDialogShell(
        "正在整理…",
        "正在检查重复、冲突和过时内容。",
        `<div class="memory-organize-running"><span class="memory-organize-spinner"></span><strong>${escapeHTML(modal.progressLabel || "分析记忆结构")}</strong><div><i style="width:${modal.progress || 35}%"></i></div></div>`,
        `<button type="button" class="memory-secondary-btn" data-memory-action="close-modal">取消整理</button>`,
        "memory-modal--compact"
      );
    }
    const preview = getOrganizePreview(modal);
    const active = modal.changes.filter((change) => change.active);
    return renderDialogShell(
      "整理结果",
      "逐条检查建议，关闭的变更不会被应用。",
      `<div class="memory-organize-summary">
        <div><strong>${modal.beforeSnapshot.length}</strong><span>整理前</span></div>
        <span>${icon("chevron")}</span>
        <div><strong>${preview.length}</strong><span>整理后</span></div>
        <p>${active.filter((item) => item.kind === "merge").length} 项合并 · ${active.filter((item) => item.kind === "update").length} 项修正 · ${active.filter((item) => item.kind === "remove").length} 项删除</p>
       </div>
       <div class="memory-organize-changes">
        ${modal.changes
          .map(
            (change) => `<article class="${change.active ? "" : "is-undone"}">
              <span class="memory-change-icon">${icon(change.kind === "remove" ? "trash" : change.kind === "update" ? "edit" : "branch")}</span>
              <div><strong>${escapeHTML(change.title)}</strong><p>${escapeHTML(change.detail)}</p></div>
              <button type="button" data-memory-action="toggle-organize-change" data-change-id="${escapeAttr(change.id)}">${change.active ? "撤销此项" : "恢复此项"}</button>
            </article>`
          )
          .join("")}
       </div>`,
      `<button type="button" class="memory-secondary-btn" data-memory-action="close-modal">放弃</button>
       <button type="button" class="memory-primary-btn" data-memory-action="apply-organize">应用整理</button>`,
      "memory-modal--wide"
    );
  }

  function renderHistoryDialog(modal) {
    if (modal.rollbackId) {
      const record = state.history.find((item) => item.id === modal.rollbackId);
      if (!record) return "";
      return renderDialogShell(
        "回滚这次整理？",
        "将恢复整理前的全部个人记忆。",
        `<div class="memory-confirm-copy">${icon("warning")}<p>${escapeHTML(record.summary)}</p></div>`,
        `<button type="button" class="memory-secondary-btn" data-memory-action="cancel-rollback">取消</button>
         <button type="button" class="memory-danger-btn" data-memory-action="confirm-rollback" data-history-id="${escapeAttr(record.id)}">确认回滚</button>`,
        "memory-modal--compact"
      );
    }
    return renderDialogShell(
      "整理历史",
      "每次应用整理都会保存整理前快照。",
      state.history.length
        ? `<div class="memory-history-list">${state.history
            .map(
              (record) => `<article>
                <span>${icon("clock")}</span>
                <div><strong>${escapeHTML(record.summary)}</strong><p>${escapeHTML(record.createdAt)}</p></div>
                <button type="button" data-memory-action="open-rollback" data-history-id="${escapeAttr(record.id)}">回滚</button>
              </article>`
            )
            .join("")}</div>`
        : `<div class="memory-empty memory-empty--compact">${icon("clock")}<strong>暂无整理历史</strong><p>应用一次整理后，这里会保存可回滚版本。</p></div>`,
      `<button type="button" class="memory-primary-btn" data-memory-action="close-modal">完成</button>`
    );
  }

  function renderNotificationsDialog() {
    return renderDialogShell(
      "材料处理消息",
      "查看你标给组织的更新材料处理结果。",
      `<div class="memory-notification-list">
        ${state.notifications
          .map(
            (notice) => `<article class="${notice.read ? "" : "is-unread"}">
              <span>${icon(notice.kind === "included" ? "check" : "info")}</span>
              <div><strong>${escapeHTML(notice.title)}</strong><p>${escapeHTML(notice.detail)}</p><small>${escapeHTML(notice.createdAt)}</small></div>
            </article>`
          )
          .join("")}
       </div>`,
      `<button type="button" class="memory-primary-btn" data-memory-action="close-modal">完成</button>`
    );
  }

  function renderHandoffDialog(modal) {
    const selectedMemoryIds = modal.selectedMemoryIds || [];
    const personal = getAllMemories().filter((memory) => ["active", "included_in_version"].includes(memory.status));
    const readonlyUserMemories = getReadonlyUserMemories(modal.agentId);
    const orgEntries = state.stores.flatMap((store) => store.entries.map((entry) => ({ ...entry, storeName: store.name })));
    const option = (id, label, meta) => `<label class="memory-handoff-option">
      <input type="checkbox" data-memory-handoff-id="${escapeAttr(id)}"${selectedMemoryIds.includes(id) ? " checked" : ""} />
      <span><strong>${escapeHTML(label)}</strong><small>${escapeHTML(meta)}</small></span>
    </label>`;
    return renderDialogShell(
      "调整交接记忆",
      "这些内容只读交给专家，本次调用结束后不会保存在专家侧。",
      `<div class="memory-handoff-groups">
        <section><h3>我的记忆</h3>${personal.map((memory) => option(memory.id, memory.content, TYPE_META[memory.type]?.label || "记忆")).join("")}</section>
        <section><h3>组织记忆</h3>${orgEntries.map((entry) => option(entry.id, entry.title, `《${entry.storeName}》`)).join("")}</section>
       </div>
       <div class="memory-privacy-note">${icon("shield")}<span>专家还会只读使用当前用户的 ${readonlyUserMemories.length} 条相关记忆，不会保存或回写。</span></div>`,
      `<button type="button" class="memory-secondary-btn" data-memory-action="close-modal">取消</button>
       <button type="button" class="memory-primary-btn" data-memory-action="save-handoff">确认交接</button>`,
      "memory-modal--wide"
    );
  }

  function renderPortal() {
    if (!state.portal) return;
    const modal = state.modal;
    if (!modal) {
      state.portal.innerHTML = "";
      return;
    }
    let html = "";
    if (modal.kind === "detail") {
      const memory = getMemory(modal.memoryId);
      html = memory ? renderMemoryDetail(memory) : "";
    } else if (modal.kind === "edit") html = renderEditDialog(modal);
    else if (modal.kind === "delete") html = renderDeleteDialog(modal);
    else if (modal.kind === "contribute") html = renderContributeDialog(modal);
    else if (modal.kind === "store") html = renderStoreDialog(modal);
    else if (modal.kind === "organize") html = renderOrganizeDialog(modal);
    else if (modal.kind === "history") html = renderHistoryDialog(modal);
    else if (modal.kind === "notifications") html = renderNotificationsDialog();
    else if (modal.kind === "handoff") html = renderHandoffDialog(modal);
    state.portal.innerHTML = html;
  }

  function addNotification(notification) {
    state.notifications.unshift({
      id: createId("notice"),
      createdAt: "2026-06-12",
      read: false,
      ...notification
    });
  }

  function deleteMemory(memoryId) {
    state.userMemories = state.userMemories.filter((memory) => memory.id !== memoryId);
    state.clawMemories = state.clawMemories.filter((memory) => memory.id !== memoryId);
    Object.values(state.conversations).forEach((conversation) => {
      conversation.used = conversation.used.filter((item) => item.memoryId !== memoryId);
      conversation.remembered = conversation.remembered.filter((item) => item.memoryId !== memoryId);
      conversation.events.forEach((event) => {
        if (event.memoryId === memoryId) event.status = "revoked";
      });
    });
  }

  function acceptSuggestion(agentId, suggestionId) {
    const handoff = getExpertState(agentId);
    const signals = handoff.signals || handoff.suggestions || [];
    const suggestion = signals.find((item) => item.id === suggestionId);
    if (!suggestion || suggestion.status !== "pending") return;
    suggestion.status = "accepted";
    if (suggestion.target === "personal") {
      const memory = {
        id: createId("mem-suggestion"),
        content: suggestion.content,
        scope: suggestion.memoryScope === "claw" ? "claw" : "user",
        type: suggestion.memoryType || "feedback",
        sourceSessionId: "expert-session",
        sourceSessionTitle: "资深专家协作",
        createdAt: "2026-06-12",
        status: "active"
      };
      addMemory(memory);
    } else {
      const memory = {
        id: createId("mem-update-material"),
        content: suggestion.content,
        scope: "claw",
        type: "project",
        sourceSessionId: "expert-session",
        sourceSessionTitle: "资深专家协作",
        createdAt: "2026-06-12",
        status: "marked_material",
        updateMaterial: {
          storeId: suggestion.storeId,
          markedAt: "2026-06-12",
          status: "waiting_update"
        }
      };
      addMemory(memory);
      addNotification({
        kind: "marked",
        title: "材料已标记",
        detail: `“${suggestion.content}”已标为《${getStore(suggestion.storeId)?.name || "组织记忆"}》的更新材料，等待组织下次整理。`
      });
    }
    emitUpdate("suggestion-accepted");
  }

  function handleAction(action, payload = {}) {
    if (!action) return;
    if (action === "set-tab") {
      state.tab = payload.tab === "organization" ? "organization" : "personal";
      render();
      return;
    }
    if (action === "clear-filters") {
      state.query = "";
      state.type = "all";
      state.status = "all";
      render();
      return;
    }
    if (action === "close-modal") {
      if (state.modal?.timer) window.clearTimeout(state.modal.timer);
      state.modal = null;
      renderPortal();
      return;
    }
    if (action === "open-detail" || action === "open-source" || action === "overview-detail") {
      const memory = getMemory(payload.memoryId);
      if (memory) state.modal = { kind: "detail", memoryId: memory.id };
      else {
        const sourceInfo = getMemorySource(payload.memoryId);
        if (sourceInfo?.store) state.modal = { kind: "store", storeId: sourceInfo.store.id };
      }
      renderPortal();
      return;
    }
    if (action === "open-edit") {
      const memory = getMemory(payload.memoryId);
      if (!memory) return;
      state.modal = { kind: "edit", memoryId: memory.id, content: memory.content, type: memory.type, error: "" };
      renderPortal();
      return;
    }
    if (action === "save-edit") {
      if (state.modal?.kind !== "edit") return;
      const content = state.modal.content.trim();
      if (!content) {
        state.modal.error = "请输入记忆内容";
        renderPortal();
        return;
      }
      const memory = getMemory(state.modal.memoryId);
      if (memory) {
        memory.content = content;
        memory.type = state.modal.type;
      }
      state.modal = null;
      renderPortal();
      setBanner("记忆已更新。");
      emitUpdate("memory-edited");
      return;
    }
    if (action === "open-delete") {
      if (!getMemory(payload.memoryId)) return;
      state.modal = { kind: "delete", memoryId: payload.memoryId };
      renderPortal();
      return;
    }
    if (action === "confirm-delete") {
      deleteMemory(payload.memoryId);
      state.modal = null;
      renderPortal();
      setBanner("记忆已删除。");
      emitUpdate("memory-deleted");
      return;
    }
    if (action === "undo-event") {
      const conversation = getConversation(payload.sessionKey || "expense");
      const event = conversation.events.find((item) => item.id === payload.eventId);
      if (!event || event.status === "revoked") return;
      event.status = "revoked";
      deleteMemory(event.memoryId);
      emitUpdate("event-revoked");
      return;
    }
    if (action === "open-contribute") {
      const memory = getMemory(payload.memoryId);
      if (!memory) return;
      state.modal = {
        kind: "contribute",
        memoryId: memory.id,
        content: memory.content,
        storeId: "",
        contentError: "",
        storeError: ""
      };
      renderPortal();
      return;
    }
    if (action === "submit-contribution") {
      if (state.modal?.kind !== "contribute") return;
      state.modal.storeError = state.modal.storeId ? "" : "请选择目标组织记忆";
      state.modal.contentError = state.modal.content.trim() ? "" : "请输入材料内容";
      if (state.modal.storeError || state.modal.contentError) {
        renderPortal();
        return;
      }
      const memory = getMemory(state.modal.memoryId);
      if (!memory) return;
      memory.content = state.modal.content.trim();
      memory.status = "marked_material";
      memory.updateMaterial = {
        storeId: state.modal.storeId,
        markedAt: "2026-06-12",
        status: "waiting_update"
      };
      addNotification({
        kind: "marked",
        title: "材料已标记",
        detail: `“${memory.content}”已标为《${getStore(state.modal.storeId)?.name || "组织记忆"}》的更新材料，等待组织下次整理。`
      });
      state.modal = null;
      renderPortal();
      setBanner(`已标为《${getStore(memory.updateMaterial.storeId)?.name || "组织记忆"}》更新材料。`);
      emitUpdate("material-marked");
      return;
    }
    if (action === "open-store") {
      if (!getStore(payload.storeId)) return;
      state.modal = { kind: "store", storeId: payload.storeId };
      renderPortal();
      return;
    }
    if (action === "open-organize") {
      state.modal = { kind: "organize", phase: "confirm" };
      renderPortal();
      return;
    }
    if (action === "run-organize") {
      state.modal = {
        kind: "organize",
        phase: "running",
        beforeSnapshot: clone(getAllMemories()),
        changes: source.organizeChanges.map((change) => ({ ...clone(change), active: true })),
        progress: 32,
        progressLabel: "分析重复与冲突"
      };
      renderPortal();
      const modalRef = state.modal;
      modalRef.timer = window.setTimeout(() => {
        if (state.modal !== modalRef) return;
        state.modal.progress = 72;
        state.modal.progressLabel = "生成变更清单";
        renderPortal();
        modalRef.timer = window.setTimeout(() => {
          if (state.modal !== modalRef) return;
          state.modal.phase = "result";
          state.modal.progress = 100;
          renderPortal();
        }, 420);
      }, 420);
      return;
    }
    if (action === "toggle-organize-change") {
      if (state.modal?.kind !== "organize") return;
      const change = state.modal.changes.find((item) => item.id === payload.changeId);
      if (change) change.active = !change.active;
      renderPortal();
      return;
    }
    if (action === "apply-organize") {
      if (state.modal?.kind !== "organize") return;
      const before = clone(state.modal.beforeSnapshot);
      const after = getOrganizePreview(state.modal);
      const activeCount = state.modal.changes.filter((change) => change.active).length;
      setAllMemories(after);
      state.history.unshift({
        id: createId("history"),
        createdAt: "2026-06-12 10:30",
        beforeSnapshot: before,
        afterSnapshot: clone(after),
        summary: `整理前 ${before.length} 处 → 整理后 ${after.length} 处，应用 ${activeCount} 项变更`,
        changes: clone(state.modal.changes)
      });
      state.modal = null;
      renderPortal();
      setBanner("已应用整理结果，可在整理历史中回滚。");
      emitUpdate("organize-applied");
      return;
    }
    if (action === "open-history") {
      state.modal = { kind: "history", rollbackId: "" };
      renderPortal();
      return;
    }
    if (action === "open-rollback") {
      if (state.modal?.kind !== "history") return;
      state.modal.rollbackId = payload.historyId;
      renderPortal();
      return;
    }
    if (action === "cancel-rollback") {
      if (state.modal?.kind !== "history") return;
      state.modal.rollbackId = "";
      renderPortal();
      return;
    }
    if (action === "confirm-rollback") {
      const record = state.history.find((item) => item.id === payload.historyId);
      if (!record) return;
      setAllMemories(clone(record.beforeSnapshot));
      state.modal = null;
      renderPortal();
      setBanner("已回滚到整理前版本。");
      emitUpdate("organize-rolled-back");
      return;
    }
    if (action === "open-notifications") {
      state.notifications.forEach((item) => {
        item.read = true;
      });
      state.modal = { kind: "notifications" };
      renderPortal();
      emitUpdate("notifications-read");
      return;
    }
    if (action === "open-handoff") {
      const agentId = payload.agentId || "default";
      state.modal = {
        kind: "handoff",
        agentId,
        selectedMemoryIds: clone(getExpertState(agentId).selectedMemoryIds)
      };
      renderPortal();
      return;
    }
    if (action === "save-handoff") {
      if (state.modal?.kind === "handoff") {
        getExpertState(state.modal.agentId).selectedMemoryIds = clone(state.modal.selectedMemoryIds || []);
      }
      state.modal = null;
      renderPortal();
      emitUpdate("handoff-updated");
      return;
    }
    if (action === "accept-suggestion") {
      acceptSuggestion(payload.agentId || "default", payload.suggestionId);
      return;
    }
    if (action === "ignore-suggestion") {
      const handoff = getExpertState(payload.agentId || "default");
      const signals = handoff.signals || handoff.suggestions || [];
      const suggestion = signals.find((item) => item.id === payload.suggestionId);
      if (suggestion && suggestion.status === "pending") suggestion.status = "ignored";
      emitUpdate("suggestion-ignored");
      return;
    }
  }

  function matchesEventContext(event, context = {}) {
    if (!event.when) return true;
    return context.answers?.[event.when.answerKey] === event.when.equals;
  }

  function ensureEventMemory(conversation, event) {
    if (!event.memory || getMemory(event.memoryId)) return;
    addMemory(clone(event.memory));
    conversation.remembered.push({
      memoryId: event.memoryId,
      kind: "personal",
      label: event.summary,
      status: event.status
    });
  }

  function renderConversationEvents(sessionKey, afterItemId, context = {}) {
    if (!afterItemId) return "";
    const conversation = getConversation(sessionKey);
    const visible = conversation.events.filter(
      (event) =>
        event.kind === "remembered" &&
        event.afterItemId === afterItemId &&
        event.status !== "revoked" &&
        matchesEventContext(event, context)
    );
    if (!visible.length) return "";
    visible.forEach((event) => ensureEventMemory(conversation, event));
    return `<div class="memory-event-list">
      ${visible
        .map((event) => {
          return `<div class="memory-event memory-event--remembered" data-memory-event-id="${escapeAttr(event.id)}" data-memory-after-item="${escapeAttr(afterItemId)}">
            <span>${icon("archive")}</span>
            <p>${escapeHTML(`已记住：${event.summary}`)}</p>
            ${event.memoryId ? `<button type="button" data-memory-action="open-detail" data-memory-id="${escapeAttr(event.memoryId)}">查看</button>` : ""}
            <button type="button" data-memory-action="undo-event" data-session-key="${escapeAttr(sessionKey)}" data-event-id="${escapeAttr(event.id)}">撤销</button>
          </div>`;
        })
        .join("")}
    </div>`;
  }

  function renderOverview(sessionKey, context = {}) {
    const conversation = getConversation(sessionKey);
    const used = conversation.used.filter((item) => getMemorySource(item.memoryId));
    const visibleItemIds = Array.isArray(context.visibleItemIds) ? context.visibleItemIds : [];
    const remembered = conversation.remembered.filter((item) => {
      if (item.status === "revoked" || !getMemory(item.memoryId)) return false;
      const event = conversation.events.find((candidate) => candidate.memoryId === item.memoryId && candidate.kind === "remembered");
      if (!event) return true;
      return visibleItemIds.includes(event.afterItemId) && matchesEventContext(event, context);
    });
    const renderRows = (items, empty) =>
      items.length
        ? items
            .map(
              (item) => `<button type="button" class="memory-overview-item" data-memory-action="overview-detail" data-memory-id="${escapeAttr(item.memoryId)}">
                <span>${icon(item.source === "organization" || item.kind === "update_material" ? "book" : "archive")}</span>
                <span><strong>${escapeHTML(item.label || getMemoryLabel(item.memoryId))}</strong><small>${item.source === "organization" ? "组织记忆" : item.kind === "update_material" ? "已标为更新材料" : "我的记忆"}</small></span>
              </button>`
            )
            .join("")
        : `<div class="memory-overview-empty">${escapeHTML(empty)}</div>`;
    return `<div class="memory-overview">
      <section><h3>本次用到 <span>${used.length}</span></h3>${renderRows(used, "本次尚未使用记忆")}</section>
      <section><h3>本次记住 <span>${remembered.length}</span></h3>${renderRows(remembered, "本次尚未写入记忆")}</section>
    </div>`;
  }

  function renderExpertHandoff(agentId, agentName = "专家") {
    const handoff = getExpertState(agentId || "default");
    const selected = handoff.selectedMemoryIds.map((id) => ({ id, source: getMemorySource(id) })).filter((item) => item.source);
    const readonlyUserMemories = getReadonlyUserMemories(agentId);
    return `<div class="message-row memory-handoff-row">
      <article class="memory-handoff-card">
        <span class="memory-handoff-icon">${icon("attach")}</span>
        <div class="memory-handoff-copy">
          <strong>已召唤「${escapeHTML(agentName)}」</strong>
          <p>${selected.length ? `已携带 ${selected.length} 条相关记忆` : "未携带记忆"}</p>
          <div>${selected
            .slice(0, 3)
            .map((item) => `<span>${escapeHTML(item.source.source === "organization" ? item.source.entry.title : item.source.memory.content)}</span>`)
            .join("")}</div>
          <small>${icon("shield")}专家会只读使用当前用户 ${readonlyUserMemories.length} 条相关记忆，不会保存</small>
        </div>
        <button type="button" data-memory-action="open-handoff" data-agent-id="${escapeAttr(agentId || "default")}">调整</button>
      </article>
    </div>`;
  }

  function renderExpertSuggestions(agentId, agentName = "专家") {
    const handoff = getExpertState(agentId || "default");
    const signals = handoff.signals || handoff.suggestions || [];
    if (!signals.length) return "";
    return `<div class="message-row memory-suggestion-row">
      <article class="memory-suggestion-card">
        <header>${icon("spark")}<strong>${escapeHTML(agentName)}发现 ${signals.length} 条值得记</strong></header>
        <div class="memory-suggestion-list">
          ${signals
            .map((suggestion, index) => {
              const store = getStore(suggestion.storeId);
              const destination = suggestion.target === "organization" ? `标为《${store?.name || "组织记忆"}》更新材料` : "存入我的记忆";
              const acceptLabel = suggestion.target === "organization" ? "标记" : "采纳";
              const acceptedLabel = suggestion.target === "organization" ? "已标记" : "已采纳";
              return `<div class="memory-suggestion-item ${suggestion.status !== "pending" ? "is-resolved" : ""}">
                <span>${index + 1}</span>
                <div><strong>${escapeHTML(suggestion.content)}</strong><small>${escapeHTML(destination)}</small></div>
                ${
                  suggestion.status === "pending"
                    ? `<button type="button" class="is-primary" data-memory-action="accept-suggestion" data-agent-id="${escapeAttr(agentId || "default")}" data-suggestion-id="${escapeAttr(suggestion.id)}">${acceptLabel}</button>
                       <button type="button" data-memory-action="ignore-suggestion" data-agent-id="${escapeAttr(agentId || "default")}" data-suggestion-id="${escapeAttr(suggestion.id)}">忽略</button>`
                    : `<em>${suggestion.status === "accepted" ? acceptedLabel : "已忽略"}</em>`
                }
              </div>`;
            })
            .join("")}
        </div>
      </article>
    </div>`;
  }

  function handleDocumentClick(event) {
    const actionEl = event.target.closest("[data-memory-action]");
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-memory-action") || "";
    if (action === "close-modal" && actionEl.classList.contains("memory-modal-backdrop") && event.target !== actionEl) return;
    event.preventDefault();
    event.stopPropagation();
    handleAction(action, {
      tab: actionEl.getAttribute("data-tab"),
      memoryId: actionEl.getAttribute("data-memory-id"),
      storeId: actionEl.getAttribute("data-store-id"),
      eventId: actionEl.getAttribute("data-event-id"),
      sessionKey: actionEl.getAttribute("data-session-key"),
      changeId: actionEl.getAttribute("data-change-id"),
      historyId: actionEl.getAttribute("data-history-id"),
      agentId: actionEl.getAttribute("data-agent-id"),
      suggestionId: actionEl.getAttribute("data-suggestion-id")
    });
  }

  function handleDocumentInput(event) {
    const pageInput = event.target.closest("[data-memory-input]");
    if (pageInput) {
      const key = pageInput.getAttribute("data-memory-input");
      state[key] = pageInput.value;
      const restoreQueryFocus = key === "query" && document.activeElement === pageInput;
      window.cancelAnimationFrame(handleDocumentInput._pageRenderFrame);
      handleDocumentInput._pageRenderFrame = window.requestAnimationFrame(() => {
        render();
        const next = state.root?.querySelector(`[data-memory-input="${key}"]`);
        if (next && restoreQueryFocus) {
          next.focus();
          next.setSelectionRange(next.value.length, next.value.length);
        }
      });
      return;
    }
    const modalInput = event.target.closest("[data-memory-modal-input]");
    if (modalInput && state.modal) {
      const key = modalInput.getAttribute("data-memory-modal-input");
      state.modal[key] = modalInput.value;
      return;
    }
    const handoffInput = event.target.closest("[data-memory-handoff-id]");
    if (handoffInput && state.modal?.kind === "handoff") {
      const id = handoffInput.getAttribute("data-memory-handoff-id");
      if (handoffInput.checked && !state.modal.selectedMemoryIds.includes(id)) state.modal.selectedMemoryIds.push(id);
      if (!handoffInput.checked) state.modal.selectedMemoryIds = state.modal.selectedMemoryIds.filter((item) => item !== id);
    }
  }

  function handleDocumentChange(event) {
    handleDocumentInput(event);
  }

  function init({ container }) {
    state.root = container;
    state.portal = document.createElement("div");
    state.portal.id = "memoryPortal";
    document.body.appendChild(state.portal);
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("input", handleDocumentInput);
    document.addEventListener("change", handleDocumentChange);
  }

  window.MemoryModule = {
    init,
    render,
    getMountedStores,
    getConversationMemory,
    getExpertHandoff,
    getNotifications,
    renderConversationEvents,
    renderOverview,
    renderExpertHandoff,
    renderExpertSuggestions,
    handleAction,
    subscribe
  };
})();
