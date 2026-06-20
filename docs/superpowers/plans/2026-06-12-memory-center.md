# Memory Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete P0, P1, and P2 user-side memory experience in the existing static Claw demo.

**Architecture:** Add a focused `memory-data.js` seed layer and a self-contained `memory-module.js` UI/state module. Keep `app.js` responsible for routing and chat composition, while Claw configuration and automation consume memory data through small public APIs.

**Tech Stack:** Static HTML, CSS, browser JavaScript, existing SVG sprite, Node syntax checks, Codex in-app Browser.

---

### Task 1: Add Memory Data And Stateful Module

**Files:**
- Create: `memory-data.js`
- Create: `memory-module.js`

- [x] Define personal memories, mounted organization stores, conversation memory, expert handoffs, notifications, and organization candidate seed data in `memory-data.js`.
- [x] Implement cloned module state, escaping helpers, public read APIs, `memory:updated` events, and idempotent mutations in `memory-module.js`.
- [x] Implement memory center tabs, search and combined filters.
- [x] Implement edit, delete, detail, organization contribution, store detail, notification, and history dialogs.
- [x] Implement the organize flow with progress, per-change undo, apply, abandon, and rollback.
- [x] Implement reusable chat renderers and actions for events, overview, expert handoff, and expert suggestions.
- [x] Run:

```bash
node --check memory-data.js
node --check memory-module.js
```

Expected: both commands exit successfully without output.

### Task 2: Add Route And Shell Integration

**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [x] Add “记忆中心” to the settings menu and load memory scripts before dependent modules.
- [x] Add the right-panel memory card container after “工具调用”.
- [x] Initialize `MemoryModule` with the shared stream container.
- [x] Add `memory` to hash hydration, navigation normalization, standalone routes, shell classes, and settings active state.
- [x] Delegate memory page rendering to `MemoryModule.render()`.
- [x] Re-render the app on `memory:updated`.
- [x] Run:

```bash
node --check app.js
```

Expected: command exits successfully without output.

### Task 3: Connect Conversation Events And Overview

**Files:**
- Modify: `app.js`

- [x] Append `MemoryModule.renderConversationEvents("expense")` to the default expense stream.
- [x] Append expert handoff content to enterprise draft/session views.
- [x] Append expert suggestions after completed enterprise results.
- [x] Delegate `[data-memory-action]` clicks from the message stream and right panel to `MemoryModule.handleAction`.
- [x] Render the memory overview card for expense and enterprise sessions using stable session keys.
- [x] Verify existing file preview, task progress, and tool call cards still render.

### Task 4: Add Claw Configuration Memory Mounts

**Files:**
- Modify: `claw-config-module.js`

- [x] Read mounted organization stores from `MemoryModule.getMountedStores()`.
- [x] Render a read-only “组织记忆” section after core files.
- [x] Show store name, access label, authorizer, update time, and the administrator-managed notice.
- [x] Listen for `memory:updated` so configuration stays in sync.
- [x] Run:

```bash
node --check claw-config-module.js
```

Expected: command exits successfully without output.

### Task 5: Add Automation Memory Capture Switch

**Files:**
- Modify: `automation-data.js`
- Modify: `automation-module.js`

- [x] Add `memory_enabled: false` to all task seeds.
- [x] Default new and legacy normalized tasks to `false`.
- [x] Add a root checkbox switch to scheduled and event task dialogs.
- [x] Preserve the saved value through create and edit.
- [x] Show “记忆沉淀：开启/关闭” in every task row.
- [x] Run:

```bash
node --check automation-data.js
node --check automation-module.js
```

Expected: both commands exit successfully without output.

### Task 6: Implement Memory Visual System

**Files:**
- Modify: `styles.css`

- [x] Add standalone route layout for `.route-memory`.
- [x] Style page header, tabs, toolbar, filters, list rows, organization store cards, privacy commitments, notification badge, and empty states.
- [x] Style dialogs, contribution form, organization detail, organize progress/results/history, and rollback confirmation.
- [x] Style gray conversation events, expert handoff, suggestion cards, and right-panel memory groups.
- [x] Style Claw configuration mount rows and automation memory switch.
- [x] Add responsive rules for narrow screens and dialogs.
- [x] Run:

```bash
git diff --check
```

Expected: no whitespace errors.

### Task 7: Static And Runtime Verification

**Files:**
- Verify: all modified JavaScript and HTML

- [x] Run:

```bash
node --check app.js
node --check data.js
node --check login.js
node --check memory-data.js
node --check memory-module.js
node --check claw-config-module.js
node --check automation-data.js
node --check automation-module.js
```

Expected: every command exits successfully without output.

- [x] Start:

```bash
python3 -m http.server 4173
```

Expected: server listens on `http://localhost:4173`.

- [x] Use browser automation (local Chrome fallback because the in-app Browser webview did not attach) to verify memory page CRUD, combined filters, organization browsing, contribution, organize/apply/history/rollback, chat events, overview, expert handoff/suggestions, Claw mounts, and automation defaults.
- [x] Verify desktop and narrow viewport layouts.
- [x] Check the browser console for uncaught errors.

### Task 8: Completion Audit

**Files:**
- Verify: `docs/superpowers/specs/2026-06-12-memory-center-design.md`

- [x] Map every P0 requirement to browser evidence.
- [x] Map every P1 requirement to browser evidence.
- [x] Map every P2 requirement to browser evidence.
- [x] Re-run `git diff --check` and all syntax checks after any QA fix.
- [x] Review `git diff --stat` and `git status --short` to ensure unrelated user changes remain intact.
