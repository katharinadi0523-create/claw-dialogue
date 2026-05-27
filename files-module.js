(function () {
  const dataApi = window.FILES_DATA;
  if (!dataApi) return;

  const { FILE_WORKSPACE_DETAIL } = dataApi;

  const state = {
    root: null,
    selectedPath: [],
    selectedEntryIds: [],
    storageDialogOpen: false,
    message: ""
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

  function isFolder(entry) {
    return entry && entry.kind === "folder";
  }

  function findCurrentFolder(root, path) {
    let current = root;

    path.forEach((folderId) => {
      const next = current.children.find((item) => isFolder(item) && item.id === folderId);
      if (next) current = next;
    });

    return current;
  }

  function getWorkspaceTrail(root, path) {
    const trail = [root];
    let current = root;

    path.forEach((folderId) => {
      const next = current.children.find((item) => isFolder(item) && item.id === folderId);
      if (!next) return;
      trail.push(next);
      current = next;
    });

    return trail;
  }

  function countWorkspaceItems(entries) {
    return entries.reduce(
      (acc, entry) => {
        if (isFolder(entry)) {
          const childCounts = countWorkspaceItems(entry.children || []);
          return {
            files: acc.files + childCounts.files,
            folders: acc.folders + childCounts.folders + 1
          };
        }
        return {
          files: acc.files + 1,
          folders: acc.folders
        };
      },
      { files: 0, folders: 0 }
    );
  }

  function getVisibleSelectedEntryIds(currentFolder) {
    const visibleIds = new Set(currentFolder.children.map((entry) => entry.id));
    return state.selectedEntryIds.filter((entryId) => visibleIds.has(entryId));
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

  function renderStorageDialog(storageConfig) {
    if (!state.storageDialogOpen) return "";
    const usedPercent = Math.min(
      100,
      Math.max(0, (Number(storageConfig.workspaceUsedGb) / Number(storageConfig.volumeTotalGb || 1)) * 100)
    );
    const quotaText =
      storageConfig.workspaceQuotaGb == null ? "不限额" : `${escapeHTML(storageConfig.workspaceQuotaGb)}GB`;

    return `<div class="file-modal-backdrop" data-file-action="close-storage-dialog">
      <section class="file-storage-dialog" role="dialog" aria-modal="true" aria-label="存储配置" data-file-dialog>
        <div class="file-storage-dialog-head">
          <h3>存储配置</h3>
          <button type="button" class="file-icon-button" data-file-action="close-storage-dialog" aria-label="关闭">${icon("x")}</button>
        </div>
        <div class="file-storage-grid">
          ${renderStorageField("存储卷名称", storageConfig.volumeDisplayName)}
          ${renderStorageField("说明", storageConfig.volumeDescription || "--")}
          ${renderStorageField("卷地址", storageConfig.volumeName)}
          ${renderStorageField("子目录", storageConfig.subdirectory)}
          ${renderStorageField("组织", storageConfig.organizationName)}
          ${renderStorageField("项目", storageConfig.projectName || "--")}
          ${renderStorageField("总容量", `${storageConfig.volumeTotalGb}GB`)}
          ${renderStorageField("工作空间限额", quotaText)}
        </div>
        <div class="file-storage-usage">
          <div class="file-storage-usage-head">
            <span>空间用量</span>
            <strong>${escapeHTML(storageConfig.workspaceUsedGb)}GB / ${escapeHTML(storageConfig.volumeTotalGb)}GB</strong>
          </div>
          <div class="file-storage-progress"><span style="width:${usedPercent.toFixed(2)}%"></span></div>
        </div>
        <div class="file-storage-dialog-foot">
          <button type="button" class="file-button file-button--primary" data-file-action="close-storage-dialog">确定</button>
        </div>
      </section>
    </div>`;
  }

  function renderStorageField(label, value) {
    return `<div class="file-storage-field">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(value)}</strong>
    </div>`;
  }

  function renderEntryIcon(entry) {
    return `<span class="file-entry-icon file-entry-icon--${entry.kind}">${icon(isFolder(entry) ? "folder" : "file")}</span>`;
  }

  function renderBreadcrumb(trail) {
    return trail
      .map((folder, index) => {
        const chevron = index > 0 ? `<span class="file-breadcrumb-separator">${icon("chevron")}</span>` : "";
        const active = index === trail.length - 1 ? " is-active" : "";
        return `<span class="file-breadcrumb-item">
          ${chevron}
          <button type="button" class="file-breadcrumb-link${active}" data-file-action="open-breadcrumb" data-file-path-index="${index}">${escapeHTML(folder.name)}</button>
        </span>`;
      })
      .join("");
  }

  function renderTableRows(currentFolder, visibleSelectedEntryIds) {
    if (!currentFolder.children.length) {
      return `<tr>
        <td colspan="6" class="file-empty-cell">当前目录暂无内容。</td>
      </tr>`;
    }

    return currentFolder.children
      .map((entry) => {
        const selected = visibleSelectedEntryIds.includes(entry.id);
        const selectedClass = selected ? " is-selected" : "";
        const checkbox = `<button type="button" class="file-select-toggle${selected ? " is-checked" : ""}" data-file-action="toggle-entry" data-file-entry-id="${escapeAttr(entry.id)}" aria-label="${selected ? "取消选择" : "选择"} ${escapeAttr(entry.name)}">
          <span class="file-select-box">${icon("check")}</span>
        </button>`;
        const action = isFolder(entry)
          ? `<button type="button" class="file-text-action" data-file-action="open-folder" data-file-entry-id="${escapeAttr(entry.id)}">打开</button>`
          : `<button type="button" class="file-text-action file-text-action--download" data-file-action="download-file" data-file-entry-id="${escapeAttr(entry.id)}">${icon("download")}<span>下载</span></button>`;

        return `<tr class="file-row${selectedClass}">
          <td>${checkbox}</td>
          <td>
            <button type="button" class="file-entry-main" data-file-action="${isFolder(entry) ? "open-folder" : "preview-file"}" data-file-entry-id="${escapeAttr(entry.id)}">
              ${renderEntryIcon(entry)}
              <span class="file-entry-copy">
                <strong>${escapeHTML(entry.name)}</strong>
                ${entry.description ? `<span>${escapeHTML(entry.description)}</span>` : ""}
              </span>
            </button>
          </td>
          <td>${isFolder(entry) ? "-" : escapeHTML(entry.sizeLabel)}</td>
          <td>${isFolder(entry) ? "-" : escapeHTML(entry.updatedAt)}</td>
          <td>${isFolder(entry) ? "-" : escapeHTML(entry.updatedBy)}</td>
          <td class="file-row-actions">${action}</td>
        </tr>`;
      })
      .join("");
  }

  function render() {
    if (!state.root) return;

    const { workspaceRoot, workspaceStorageConfig } = FILE_WORKSPACE_DETAIL;
    const currentFolder = findCurrentFolder(workspaceRoot, state.selectedPath);
    const trail = getWorkspaceTrail(workspaceRoot, state.selectedPath);
    const counts = countWorkspaceItems(workspaceRoot.children || []);
    const visibleSelectedEntryIds = getVisibleSelectedEntryIds(currentFolder);
    const allSelected =
      currentFolder.children.length > 0 && visibleSelectedEntryIds.length === currentFolder.children.length;
    const hasSelection = visibleSelectedEntryIds.length > 0;

    state.root.innerHTML = `
      <section class="files-page" aria-label="文件">
        <div class="files-page-head">
          ${state.message ? `<div class="files-banner">${escapeHTML(state.message)}</div>` : ""}
          <section class="files-summary">
            <div>
              <h2>文件</h2>
              <p>工作空间共 ${counts.folders} 个文件夹、${counts.files} 个文件，已使用 ${escapeHTML(workspaceStorageConfig.workspaceUsedGb)}GB。</p>
            </div>
            <button type="button" class="file-button" data-file-action="open-storage-dialog">存储配置</button>
          </section>
        </div>

        <section class="files-workspace">
          <div class="files-toolbar">
            <div class="files-toolbar-actions">
              <button type="button" class="file-button" data-file-action="upload">${icon("upload")}<span>上传</span></button>
              <button type="button" class="file-button" data-file-action="new-folder">${icon("plus")}<span>新建文件夹</span></button>
              <span class="files-toolbar-divider" aria-hidden="true"></span>
              <button type="button" class="file-button" data-file-action="batch-download" ${hasSelection ? "" : "disabled"}>批量下载</button>
              <button type="button" class="file-button" data-file-action="batch-delete" ${hasSelection ? "" : "disabled"}>批量操作</button>
            </div>
            <span class="files-selection-state">${hasSelection ? `已选择 ${visibleSelectedEntryIds.length} 项` : "未选择文件"}</span>
          </div>

          <div class="files-breadcrumb" aria-label="路径">
            ${renderBreadcrumb(trail)}
          </div>

          <div class="files-table-wrap">
            <table class="files-table">
              <thead>
                <tr>
                  <th>
                    <button type="button" class="file-select-toggle${allSelected ? " is-checked" : ""}" data-file-action="toggle-all" aria-label="${allSelected ? "取消全选" : "全选当前目录"}">
                      <span class="file-select-box">${icon("check")}</span>
                    </button>
                  </th>
                  <th>文件名</th>
                  <th>大小</th>
                  <th>修改时间</th>
                  <th>更新人</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>${renderTableRows(currentFolder, visibleSelectedEntryIds)}</tbody>
            </table>
          </div>
        </section>
        ${renderStorageDialog(workspaceStorageConfig)}
      </section>
    `;
  }

  function openFolder(entryId) {
    const { workspaceRoot } = FILE_WORKSPACE_DETAIL;
    const currentFolder = findCurrentFolder(workspaceRoot, state.selectedPath);
    const entry = currentFolder.children.find((item) => item.id === entryId);
    if (!isFolder(entry)) return;
    state.selectedPath = state.selectedPath.concat(entry.id);
    state.selectedEntryIds = [];
    render();
  }

  function toggleEntry(entryId) {
    if (!entryId) return;
    state.selectedEntryIds = state.selectedEntryIds.includes(entryId)
      ? state.selectedEntryIds.filter((id) => id !== entryId)
      : state.selectedEntryIds.concat(entryId);
    render();
  }

  function toggleAll() {
    const currentFolder = findCurrentFolder(FILE_WORKSPACE_DETAIL.workspaceRoot, state.selectedPath);
    const visibleIds = currentFolder.children.map((entry) => entry.id);
    const selectedIds = getVisibleSelectedEntryIds(currentFolder);
    state.selectedEntryIds = selectedIds.length === visibleIds.length ? [] : visibleIds;
    render();
  }

  function handleClick(event) {
    const dialog = event.target.closest("[data-file-dialog]");
    const backdropClose = event.target.closest(".file-modal-backdrop");
    if (backdropClose && !dialog) {
      state.storageDialogOpen = false;
      render();
      return;
    }

    const actionEl = event.target.closest("[data-file-action]");
    if (!actionEl) return;

    event.preventDefault();
    const action = actionEl.getAttribute("data-file-action");
    const entryId = actionEl.getAttribute("data-file-entry-id") || "";

    if (action === "open-storage-dialog") {
      state.storageDialogOpen = true;
      render();
      return;
    }

    if (action === "close-storage-dialog") {
      state.storageDialogOpen = false;
      render();
      return;
    }

    if (action === "open-folder") {
      openFolder(entryId);
      return;
    }

    if (action === "open-breadcrumb") {
      const index = Number(actionEl.getAttribute("data-file-path-index") || 0);
      state.selectedPath = state.selectedPath.slice(0, Math.max(0, index));
      state.selectedEntryIds = [];
      render();
      return;
    }

    if (action === "toggle-entry") {
      toggleEntry(entryId);
      return;
    }

    if (action === "toggle-all") {
      toggleAll();
      return;
    }

    if (action === "upload") {
      setMessage("上传入口待接入。");
      return;
    }

    if (action === "new-folder") {
      setMessage("新建文件夹入口待接入。");
      return;
    }

    if (action === "batch-download") {
      const currentFolder = findCurrentFolder(FILE_WORKSPACE_DETAIL.workspaceRoot, state.selectedPath);
      const count = getVisibleSelectedEntryIds(currentFolder).length;
      if (count) setMessage(`已选择 ${count} 项，批量下载入口待接入。`);
      return;
    }

    if (action === "batch-delete") {
      const currentFolder = findCurrentFolder(FILE_WORKSPACE_DETAIL.workspaceRoot, state.selectedPath);
      const count = getVisibleSelectedEntryIds(currentFolder).length;
      if (count) setMessage(`已选择 ${count} 项，批量操作入口待接入。`);
      return;
    }

    if (action === "download-file") {
      const currentFolder = findCurrentFolder(FILE_WORKSPACE_DETAIL.workspaceRoot, state.selectedPath);
      const entry = currentFolder.children.find((item) => item.id === entryId);
      if (entry) setMessage(`文件 ${entry.name} 下载入口待接入。`);
      return;
    }

    if (action === "preview-file") {
      const currentFolder = findCurrentFolder(FILE_WORKSPACE_DETAIL.workspaceRoot, state.selectedPath);
      const entry = currentFolder.children.find((item) => item.id === entryId);
      if (entry) setMessage(`文件 ${entry.name} 预览入口待接入。`);
    }
  }

  function init({ container }) {
    state.root = container;
    container.addEventListener("click", handleClick);
  }

  window.FilesModule = { init, render };
})();
