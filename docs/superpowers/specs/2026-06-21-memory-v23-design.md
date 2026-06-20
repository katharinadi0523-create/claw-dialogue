# 使用端记忆模块 v2.3 设计

日期：2026-06-21

## 目标

对齐最新版使用端方案：用户记忆 U 与 Claw 经验 C 在数据层独立归属，在使用端继续合并为“我的记忆”；类型收敛为四类；专家调用可额外只读当前用户记忆。

本次保留既有“更新材料 -> Store Update Job -> 新版本回执”链路，不恢复组织候选模型。

## 数据模型

`memory-data.js` 将个人记忆拆为两个 Store：

```js
{
  userMemories: [{ id, scope: "user", type, content, sourceSessionId, sourceSessionTitle, createdAt, status }],
  clawMemories: [{ id, scope: "claw", type, content, sourceSessionId, sourceSessionTitle, createdAt, status }]
}
```

`type` 只允许：`user`、`feedback`、`project`、`reference`。

更新材料状态继续使用 `marked_material` 与 `included_in_version`；材料元数据继续使用 `updateMaterial`。

模块不再直接读取单一 `personalMemories` 数组。它通过 Store 边界内的查询和写入 helper 获取合并后的 Claim 视图，并按记忆 ID 路由编辑、删除、撤销、整理和材料标记。

## 使用端视图

“我的记忆”继续是单一 Claim 列表，不显示 U/C、Store 或 Scope。列表、筛选与编辑弹窗只展示四类类型标签：用户信息、协作反馈、项目语境、信息入口。

用户显式标为更新材料时，保留记忆所属 Store，不把个人内容写入组织 Store；组织侧仍在后续 Update Job 中产出版本化 Diff。

## 专家调用

专家交接分成两个读通道：

1. `context_pack`：既有可调整的相关记忆集合，来自“我的记忆”和已授权组织记忆。
2. 当前用户记忆：与当前用户相关的 U Store Claim 只读附加给专家，不保存、不回写到专家 C Store，也不开放编辑。

交接卡提示“专家会只读使用当前用户相关记忆，不会保存”。调整弹窗保留可勾选的上下文包，并将当前用户记忆作为只读说明区，避免把系统保障伪装成用户可选项。

专家 `memory_signals` 的个人向信号按内容写入对应 U 或 C Store；组织向信号仍只可标为更新材料。

## 兼容与验收

- 组织记忆只读、更新材料、消息回执、会话锚点与撤销保持现有行为。
- 所有旧类型值从种子数据和 UI 移除；筛选只显示四类新类型。
- 同一记忆 ID 在合并视图、会话事件、右侧概览、编辑/删除和专家交接中保持可追踪。
- 专家调用展示当前用户记忆的只读说明，且不出现 U/C 等内部术语。
- 验证静态语法、旧类型扫描、记忆中心筛选、专家交接、更新材料和会话锚点。
