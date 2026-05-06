# ClawAgent 企业 AI 工作代理原型

这是一套纯静态 HTML 原型,用于展示企业 AI 工作代理在「出差报销」场景下的完整委托式执行流程。

## 文件结构

```text
.
├── index.html    # 三栏应用壳层与 SVG 图标
├── styles.css    # 视觉规范、布局与组件状态
├── data.js       # 32 步演示数据与静态面板配置
├── app.js        # Step 状态机、渲染逻辑、HITL 与会话列表交互
└── README.md     # 使用与扩展说明
```

## 如何运行

直接用浏览器打开 `index.html` 即可,不需要安装依赖或启动构建工具。

也可以在当前目录启动一个临时静态服务:

```bash
python3 -m http.server 4173
```

然后访问 `http://localhost:4173/`。

## 如何演示

- 初始状态是空消息流,等待触发演示步骤。
- 使用键盘 `→` 逐步推进 32 个节点。
- 使用键盘 `←` 回退到上一步。
- 遇到审批、澄清、重试、破坏性确认等 HITL 节点时,也可以直接点击卡片里的按钮继续流转。
- Agent 执行中仍可在 Composer 输入新消息,通过发送模式选择「加入队列」或「引导发送」。

## 如何扩展步骤

1. 打开 `data.js`。
2. 在 `steps` 数组中新增或修改步骤对象。
3. 每个步骤建议包含:

```js
{
  id: 23,
  title: "步骤标题",
  kind: "TOOL_CALL",
  hitl: "permission",
  items: [
    {
      kind: "tool_call",
      id: "tool-example",
      toolName: "connector.action",
      category: "connector",
      status: "needs_approval",
      action: "动作",
      target: "对象",
      summary: "单行摘要",
      args: {},
      output: {}
    }
  ]
}
```

4. 如果新增步骤总数,`app.js` 会自动根据 `steps.length` 更新内部 step 状态机。
5. 如果新增新的 UI 元素类型,在 `app.js` 的 `renderItem()` 中增加对应 renderer,并在 `styles.css` 中补充样式。

## 已覆盖的关键元素

- 用户消息、Agent 叙述、模型思考、Plan、Todo List。
- Agent 运行中发送: Queue 待执行队列、Steer 运行中插入引导。
- 工具卡 9 种状态: pending、running、success 折叠、success 展开、needs approval、destructive confirmation、error、cancelled、computer use。
- Clarify HITL、Skill chip、Sub-agent 并行任务组、Final Summary、Artifact Card。
- Context / 网络 / 用量限额三类正交通知。
- 三栏布局、底部 Composer、右侧任务进程/文件/工具联动。
