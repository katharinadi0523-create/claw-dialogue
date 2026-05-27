(function () {
  const dataApi = window.CLAW_CONFIG_DATA;
  if (!dataApi) return;

  const { PRESET_MODEL_IDS, CLAW_CONFIG_DETAIL, getDefaultModelParams, getVisibleParams } = dataApi;

  const state = {
    root: null,
    message: "",
    selectedCoreFileKey: null,
    coreFileDrafts: {},
    primaryModel: CLAW_CONFIG_DETAIL.primaryModel,
    primaryModelParams: getDefaultModelParams(CLAW_CONFIG_DETAIL.primaryModel),
    fallbackModels: [],
    openModelPicker: null
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
    return escapeHTML(value);
  }

  function createFallbackId() {
    return `fb-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  function initCoreFileDrafts() {
    const drafts = {};
    CLAW_CONFIG_DETAIL.coreFiles.forEach((file) => {
      drafts[file.key] = file.content;
    });
    state.coreFileDrafts = drafts;
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

  function getSelectedModels() {
    const models = [state.primaryModel];
    state.fallbackModels.forEach((row) => models.push(row.model));
    return models;
  }

  function isFallbackModelDuplicate(index) {
    const row = state.fallbackModels[index];
    if (!row) return false;
    const others = getSelectedModels();
    const firstIndex = others.indexOf(row.model);
    const globalIndex = index + 1;
    return firstIndex !== globalIndex;
  }

  function formatParamValue(param, value) {
    if (param.widget === "slider" && typeof value === "number") {
      return value.toFixed(2);
    }
    return String(value);
  }

  function getModelIconHtml(modelId) {
    const name = String(modelId || "");
    if (name.includes("Qwen")) {
      return `<span class="claw-model-icon claw-model-icon--qwen" aria-hidden="true"></span>`;
    }
    if (name.includes("DeepSeek")) {
      return `<span class="claw-model-icon claw-model-icon--deepseek" aria-hidden="true"></span>`;
    }
    return `<span class="claw-model-icon claw-model-icon--default" aria-hidden="true"></span>`;
  }

  function renderModelParams(scope, modelId, params, rowId) {
    const visible = getVisibleParams(modelId);
    if (!visible.length) return "";
    const rowAttr = rowId ? ` data-claw-fallback-id="${escapeAttr(rowId)}"` : "";
    return `<div class="claw-model-params"${rowAttr}>
      ${visible
        .map((param) => {
          const value = params[param.key];
          if (param.widget === "toggle") {
            const checked = value ? "checked" : "";
            return `<label class="claw-model-param claw-model-param--toggle">
              <span class="claw-model-param-label">${escapeHTML(param.label)}</span>
              <input type="checkbox" data-claw-param-scope="${escapeAttr(scope)}" data-claw-param-key="${escapeAttr(param.key)}"${rowAttr} ${checked} />
            </label>`;
          }
          if (param.widget === "slider") {
            return `<div class="claw-model-param">
              <div class="claw-model-param-head">
                <span class="claw-model-param-label">${escapeHTML(param.label)}</span>
                <span class="claw-model-param-value">${escapeHTML(formatParamValue(param, value))}</span>
              </div>
              <input
                type="range"
                min="${param.min}"
                max="${param.max}"
                step="${param.step}"
                value="${escapeAttr(value)}"
                data-claw-param-scope="${escapeAttr(scope)}"
                data-claw-param-key="${escapeAttr(param.key)}"
                ${rowAttr}
              />
            </div>`;
          }
          return `<div class="claw-model-param">
            <span class="claw-model-param-label">${escapeHTML(param.label)}</span>
            <input
              type="number"
              min="${param.min}"
              max="${param.max}"
              step="${param.step}"
              value="${escapeAttr(value)}"
              data-claw-param-scope="${escapeAttr(scope)}"
              data-claw-param-key="${escapeAttr(param.key)}"
              ${rowAttr}
            />
          </div>`;
        })
        .join("")}
    </div>`;
  }

  function renderModelSelector(scope, modelId, params, rowId, duplicate) {
    const pickerKey = rowId ? `fallback:${rowId}` : "primary";
    const open = state.openModelPicker === pickerKey;
    const rowAttr = rowId ? ` data-claw-fallback-id="${escapeAttr(rowId)}"` : "";
    const options = PRESET_MODEL_IDS.map((id) => {
      const active = id === modelId ? " is-active" : "";
      return `<button type="button" class="claw-model-option${active}" data-claw-action="pick-model" data-claw-model-scope="${escapeAttr(scope)}" data-claw-model-id="${escapeAttr(id)}"${rowAttr}>${escapeHTML(id)}</button>`;
    }).join("");

    return `<div class="claw-model-selector ${duplicate ? "is-duplicate" : ""}">
      <button
        type="button"
        class="claw-model-trigger"
        data-claw-action="toggle-model-picker"
        data-claw-picker-key="${escapeAttr(pickerKey)}"
        aria-expanded="${open ? "true" : "false"}"
      >
        <span class="claw-model-trigger-main">
          ${getModelIconHtml(modelId)}
          <span class="claw-model-trigger-name">${escapeHTML(modelId)}</span>
        </span>
        <span class="claw-model-trigger-caret" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        </span>
      </button>
      ${
        open
          ? `<div class="claw-model-popover">
              <div class="claw-model-menu" role="listbox">${options}</div>
              ${renderModelParams(scope, modelId, params, rowId)}
            </div>`
          : ""
      }
    </div>`;
  }

  function renderFallbackList() {
    if (!state.fallbackModels.length) {
      return `<div class="claw-fallback-empty">暂无 Fallback，请点击「添加」加入降级模型。</div>`;
    }
    return `<ul class="claw-fallback-list">
      ${state.fallbackModels
        .map((row, index) => {
          const duplicate = isFallbackModelDuplicate(index);
          return `<li class="claw-fallback-item">
            <span class="claw-fallback-index">${index + 1}.</span>
            <div class="claw-fallback-body">
              ${renderModelSelector("fallback", row.model, row.params, row.id, duplicate)}
              ${duplicate ? `<p class="claw-fallback-error">与已选模型重复，建议选择不同模型作为 fallback 模型</p>` : ""}
            </div>
            <button type="button" class="claw-fallback-remove" data-claw-action="remove-fallback" data-claw-fallback-id="${escapeAttr(row.id)}" aria-label="移除第 ${index + 1} 条 Fallback 模型">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-1 0v14H9V6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>
            </button>
          </li>`;
        })
        .join("")}
    </ul>`;
  }

  function renderCoreFilesList() {
    return `<div class="claw-core-file-list">
      ${CLAW_CONFIG_DETAIL.coreFiles
        .map(
          (item) => `<div class="claw-core-file-row">
            <div class="claw-core-file-meta">
              <span class="claw-core-file-title">${escapeHTML(item.title)}</span>
              <span class="claw-core-file-note">${escapeHTML(item.note)}</span>
            </div>
            <button type="button" class="claw-core-file-edit" data-claw-action="edit-core-file" data-claw-core-key="${escapeAttr(item.key)}">编辑</button>
          </div>`
        )
        .join("")}
    </div>`;
  }

  function renderCoreFileEditor() {
    const file = CLAW_CONFIG_DETAIL.coreFiles.find((item) => item.key === state.selectedCoreFileKey);
    if (!file) return "";
    const draft = state.coreFileDrafts[file.key] || "";
    const lineCount = draft.split("\n").length;
    return `<div class="claw-core-editor">
      <div class="claw-core-editor-head">
        <div class="claw-core-editor-title">
          <button type="button" class="claw-core-back" data-claw-action="back-core-files">← 返回</button>
          <div>
            <div class="claw-core-editor-name">${escapeHTML(file.title)}</div>
            <div class="claw-core-editor-note">${escapeHTML(file.note)}</div>
          </div>
        </div>
        <button type="button" class="claw-core-save" data-claw-action="save-core-file">保存</button>
      </div>
      <div class="claw-core-editor-panel">
        <div class="claw-core-editor-toolbar">
          <span>Markdown 编辑器</span>
          <span>${lineCount} 行</span>
        </div>
        <textarea class="claw-core-textarea" data-claw-core-draft="${escapeAttr(file.key)}" spellcheck="false">${escapeHTML(draft)}</textarea>
      </div>
    </div>`;
  }

  function render() {
    if (!state.root) return;
    state.root.innerHTML = `
      <section class="claw-config-page" aria-label="Claw配置">
        ${state.message ? `<div class="claw-config-banner">${escapeHTML(state.message)}</div>` : ""}

        <div class="claw-config-body">
          <section class="claw-config-section">
            <div class="claw-config-section-head">
              <h2>模型配置</h2>
              <p>配置 Claw 的主力模型和 Fallback 顺序。</p>
            </div>
            <div class="claw-config-model-card">
              <div class="claw-config-model-grid">
                <div class="claw-config-model-col">
                  <label class="claw-config-label"><span class="claw-required">*</span>主力模型</label>
                  ${renderModelSelector("primary", state.primaryModel, state.primaryModelParams, null, false)}
                </div>
                <div class="claw-config-model-col">
                  <div class="claw-fallback-head">
                    <label class="claw-config-label">Fallback 模型</label>
            <button type="button" class="claw-fallback-add" data-claw-action="add-fallback">
              <span class="claw-fallback-add-icon" aria-hidden="true">+</span>
              <span>添加</span>
            </button>
                  </div>
                  ${renderFallbackList()}
                </div>
              </div>
            </div>
          </section>

          <section class="claw-config-section">
            <div class="claw-config-section-head">
              <h2>核心文件</h2>
            </div>
            ${state.selectedCoreFileKey ? renderCoreFileEditor() : renderCoreFilesList()}
          </section>
        </div>
      </section>
    `;
  }

  function updatePrimaryModel(modelId) {
    state.primaryModel = modelId;
    state.primaryModelParams = getDefaultModelParams(modelId);
    state.openModelPicker = null;
    render();
  }

  function updateFallbackModel(rowId, modelId) {
    state.fallbackModels = state.fallbackModels.map((row) =>
      row.id === rowId ? { ...row, model: modelId, params: getDefaultModelParams(modelId) } : row
    );
    state.openModelPicker = null;
    render();
  }

  function updateParam(scope, key, rawValue, rowId) {
    const value =
      rawValue === "true" || rawValue === true
        ? true
        : rawValue === "false" || rawValue === false
          ? false
          : Number(rawValue);
    if (scope === "primary") {
      state.primaryModelParams = { ...state.primaryModelParams, [key]: value };
      render();
      return;
    }
    state.fallbackModels = state.fallbackModels.map((row) =>
      row.id === rowId ? { ...row, params: { ...row.params, [key]: value } } : row
    );
    render();
  }

  function handleClick(event) {
    const actionEl = event.target.closest("[data-claw-action]");
    if (!actionEl) {
      if (state.openModelPicker && !event.target.closest(".claw-model-selector")) {
        state.openModelPicker = null;
        render();
      }
      return;
    }

    const action = actionEl.getAttribute("data-claw-action");
    if (action === "toggle-model-picker") {
      const key = actionEl.getAttribute("data-claw-picker-key") || "";
      state.openModelPicker = state.openModelPicker === key ? null : key;
      render();
      return;
    }
    if (action === "pick-model") {
      const scope = actionEl.getAttribute("data-claw-model-scope") || "primary";
      const modelId = actionEl.getAttribute("data-claw-model-id") || PRESET_MODEL_IDS[0];
      const rowId = actionEl.getAttribute("data-claw-fallback-id") || "";
      if (scope === "fallback" && rowId) updateFallbackModel(rowId, modelId);
      else updatePrimaryModel(modelId);
      return;
    }
    if (action === "add-fallback") {
      const modelId = PRESET_MODEL_IDS.find((id) => !getSelectedModels().includes(id)) || PRESET_MODEL_IDS[0];
      state.fallbackModels.push({
        id: createFallbackId(),
        model: modelId,
        params: getDefaultModelParams(modelId)
      });
      render();
      return;
    }
    if (action === "remove-fallback") {
      const rowId = actionEl.getAttribute("data-claw-fallback-id") || "";
      state.fallbackModels = state.fallbackModels.filter((row) => row.id !== rowId);
      render();
      return;
    }
    if (action === "edit-core-file") {
      state.selectedCoreFileKey = actionEl.getAttribute("data-claw-core-key") || null;
      render();
      return;
    }
    if (action === "back-core-files") {
      state.selectedCoreFileKey = null;
      render();
      return;
    }
    if (action === "save-core-file") {
      const file = CLAW_CONFIG_DETAIL.coreFiles.find((item) => item.key === state.selectedCoreFileKey);
      if (file) file.content = state.coreFileDrafts[file.key] || "";
      setMessage(`已保存 ${file ? file.title : "核心文件"}`);
    }
  }

  function handleInput(event) {
    const draft = event.target.closest("[data-claw-core-draft]");
    if (draft) {
      const key = draft.getAttribute("data-claw-core-draft");
      if (key) state.coreFileDrafts[key] = draft.value;
      return;
    }

    const param = event.target.closest("[data-claw-param-key]");
    if (!param) return;
    const scope = param.getAttribute("data-claw-param-scope") || "primary";
    const key = param.getAttribute("data-claw-param-key");
    const rowId = param.getAttribute("data-claw-fallback-id") || "";
    const rawValue = param.type === "checkbox" ? param.checked : param.value;
    updateParam(scope, key, rawValue, rowId);
  }

  function handleChange(event) {
    handleInput(event);
  }

  function init({ container }) {
    state.root = container;
    initCoreFileDrafts();
    container.addEventListener("click", handleClick);
    container.addEventListener("input", handleInput);
    container.addEventListener("change", handleChange);
  }

  window.ClawConfigModule = { init, render };
})();
