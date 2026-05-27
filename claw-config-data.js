(function () {
  const PRESET_MODEL_IDS = ["Qwen3-32B", "Qwen3-8B", "DeepSeek V3", "DeepSeek-R1"];

  const MODEL_SCHEMAS = {
    "Qwen3-32B": {
      id: "Qwen3-32B",
      displayName: "Qwen3-32B",
      supportedParams: [
        { key: "temperature", type: "number", widget: "slider", label: "温度", defaultValue: 0.7, min: 0, max: 1, step: 0.01 },
        { key: "top_p", type: "number", widget: "slider", label: "Top P", defaultValue: 0.8, min: 0, max: 1, step: 0.01 },
        { key: "max_tokens", type: "number", widget: "stepper", label: "最大输出 Token 数", defaultValue: 8192, min: 1, max: 32768, step: 1 },
        { key: "top_k", type: "number", widget: "stepper", label: "Top K", defaultValue: 20, min: 0, max: 100, step: 1 },
        { key: "frequency_penalty", type: "number", widget: "stepper", label: "重复语句惩罚", defaultValue: 0, min: -2, max: 2, step: 0.1 },
        { key: "deep_thinking", type: "boolean", widget: "toggle", label: "深度思考开关", defaultValue: false }
      ]
    },
    "Qwen3-8B": {
      id: "Qwen3-8B",
      displayName: "Qwen3-8B",
      supportedParams: [
        { key: "temperature", type: "number", widget: "slider", label: "温度", defaultValue: 0.7, min: 0, max: 1, step: 0.01 },
        { key: "top_p", type: "number", widget: "slider", label: "Top P", defaultValue: 0.8, min: 0, max: 1, step: 0.01 },
        { key: "max_tokens", type: "number", widget: "stepper", label: "最大输出 Token 数", defaultValue: 4096, min: 1, max: 32768, step: 1 },
        { key: "deep_thinking", type: "boolean", widget: "toggle", label: "深度思考开关", defaultValue: false }
      ]
    },
    "DeepSeek V3": {
      id: "DeepSeek V3",
      displayName: "DeepSeek V3",
      supportedParams: [
        { key: "temperature", type: "number", widget: "slider", label: "温度", defaultValue: 0.6, min: 0, max: 1, step: 0.01 },
        { key: "top_p", type: "number", widget: "slider", label: "Top P", defaultValue: 0.9, min: 0, max: 1, step: 0.01 },
        { key: "max_tokens", type: "number", widget: "stepper", label: "最大输出 Token 数", defaultValue: 8192, min: 1, max: 32768, step: 1 },
        { key: "deep_thinking", type: "boolean", widget: "toggle", label: "深度思考开关", defaultValue: false }
      ]
    },
    "DeepSeek-R1": {
      id: "DeepSeek-R1",
      displayName: "DeepSeek-R1",
      supportedParams: [
        { key: "temperature", type: "number", widget: "slider", label: "温度", defaultValue: 0.6, min: 0, max: 1, step: 0.01 },
        { key: "top_p", type: "number", widget: "slider", label: "Top P", defaultValue: 0.9, min: 0, max: 1, step: 0.01 },
        { key: "max_tokens", type: "number", widget: "stepper", label: "最大输出 Token 数", defaultValue: 8192, min: 1, max: 32768, step: 1 },
        { key: "deep_thinking", type: "boolean", widget: "toggle", label: "深度思考开关", defaultValue: true }
      ]
    }
  };

  const HIDDEN_MODEL_PARAM_KEYS = ["context_turns", "current_time"];

  const CLAW_CONFIG_DETAIL = {
    id: "claw-office-shrimp",
    name: "办公虾",
    primaryModel: "Qwen3-32B",
    coreFiles: [
      {
        key: "agents",
        title: "AGENTS.md",
        description: "声明与本 Claw 协同的子 Agent（如验票、填单）及委派边界。",
        note: "AGENTS",
        sizeLabel: "0.8 KB",
        content: `# AGENTS — 办公虾

## 子 Agent
- 验票子 Agent：票据 OCR 结果复核，不发起 ERP 写入
- 填单子 Agent：按模板生成报销草稿，等待 HitL 后提交

## 委派规则
- 制度解读与科目映射由本 Claw 主控
- 子 Agent 不得跳过 HitL 节点`
      },
      {
        key: "soul",
        title: "SOUL.md",
        description: "定义办公虾的交互风格和办公流程中的默认行为。",
        note: "SOUL",
        sizeLabel: "1.2 KB",
        content: `# SOUL — 办公虾

## Personality
- 轻快、清晰、强执行感
- 优先给员工“下一步怎么做”
- 对流程节点和异常项解释简洁，不堆砌术语

## Working Style
- 优先调用差旅报销等标准技能
- 固定走标准工作流，不临时重规划执行路径
- 对需要人工确认的节点显式提示 HitL`
      },
      {
        key: "identity",
        title: "IDENTITY.md",
        description: "定义办公虾在智能办公场景中的职责边界与标准化执行范围。",
        note: "IDENTITY",
        sizeLabel: "1.3 KB",
        content: `# IDENTITY — 办公虾

## 名称
- 办公虾

## 角色
- 企业办公协同 Agent

## 核心职责
- 负责差旅报销、表单填写、审批发起和办公事项提醒
- 优先调用标准化技能和工作流完成稳定执行
- 在执行前明确给出当前步骤、处理结果和待确认项

## 边界
- 涉及 ERP 正式写入和审批提交时必须经过 HitL 确认
- 不修改企业制度，不绕过财务和审批链
- 输出结果需保留可追溯的票据与表单依据`
      },
      {
        key: "user",
        title: "USER.md",
        description: "记录当前使用者的偏好、组织上下文与个性化协作约定。",
        note: "USER",
        sizeLabel: "0.6 KB",
        content: `# USER — 办公虾

## 使用者
- 姓名：张三
- 部门：财务运营 · 产品部
- 工号：EMP-10248

## 协作偏好
- 报销相关事项优先走差旅报销标准技能
- 需要 HitL 的节点请用简短列表说明待确认项
- 审批发起前汇总：票据张数、预计金额、下一审批人

## 通知与交付
- 结果摘要推送到 AF 平台待办
- 异常与补件提醒单独发送，不合并到日报`
      }
    ]
  };

  function getModelSchema(modelId) {
    return MODEL_SCHEMAS[modelId] || MODEL_SCHEMAS["Qwen3-32B"];
  }

  function getDefaultModelParams(modelId) {
    const schema = getModelSchema(modelId);
    const defaults = {};
    schema.supportedParams.forEach((param) => {
      defaults[param.key] = param.defaultValue;
    });
    return defaults;
  }

  function getVisibleParams(modelId) {
    const hidden = new Set(HIDDEN_MODEL_PARAM_KEYS);
    return getModelSchema(modelId).supportedParams.filter((param) => !hidden.has(param.key));
  }

  window.CLAW_CONFIG_DATA = {
    PRESET_MODEL_IDS,
    HIDDEN_MODEL_PARAM_KEYS,
    CLAW_CONFIG_DETAIL,
    getModelSchema,
    getDefaultModelParams,
    getVisibleParams
  };
})();
