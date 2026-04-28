const DEMO_DATA = (() => {
  const planItems = [
    { title: "识别三份附件票据", tool: "File Read / OCR", eta: "约 20 秒" },
    { title: "核验行程、住宿与交通金额", tool: "Code Execution", eta: "约 15 秒" },
    { title: "对齐住宿晚数与可报销发票", tool: "Policy Engine", eta: "约 8 秒" },
    { title: "连接 ERP 创建报销草稿", tool: "ERP Connector", eta: "约 30 秒" },
    { title: "提交至 OA 审批并生成申请文档", tool: "OA Connector / Document Gen", eta: "约 45 秒" }
  ];

  const todoItems = [
    { title: "解析机票、酒店、打车票据", detail: "提取金额、日期、税号与行程信息" },
    { title: "住宿与发票自动核对", detail: "已按行程与票据自动对齐" },
    { title: "创建 ERP 报销单草稿", detail: "需要访问财务 ERP 连接器" },
    { title: "补全组织信息与差旅标准", detail: "并行拉取 OA 与知识库" },
    { title: "提交 OA 审批并生成文件", detail: "提交后不可撤销,随后生成申请文档" }
  ];

  const draftDocumentArtifact = {
    name: "差旅申请草稿.docx",
    path: "/ClawAgent/差旅报销/BX20260423001/差旅申请草稿.docx",
    size: "126 KB"
  };

  const artifacts = [
    draftDocumentArtifact,
    { name: "报销申请表.pdf", path: "/ClawAgent/差旅报销/BX20260423001/报销申请表.pdf", size: "428 KB" },
    { name: "附件清单.xlsx", path: "/ClawAgent/差旅报销/BX20260423001/附件清单.xlsx", size: "84 KB" }
  ];
  const artifactsAfterDeletion = artifacts.filter((artifact) => artifact.name !== draftDocumentArtifact.name);

  const recentTasks = [
    { id: "task-001", title: "上海出差报销", status: "completed", active: true, pinned: true, kind: "expense" },
    { id: "task-002", title: "桌面助手前端设计", status: "awaiting", pinned: true },
    { id: "task-003", title: "华东经营周报整理", status: "running", pinned: false },
    { id: "task-004", title: "Q1 销售复盘报告", status: "idle", pinned: false },
    { id: "task-005", title: "供应商合同摘要", status: "error", pinned: false },
    { id: "task-006", title: "招聘 JD 批量生成", status: "idle", pinned: false },
    { id: "task-007", title: "差旅制度版本对比", status: "completed", pinned: false },
    { id: "task-008", title: "客户拜访纪要归档", status: "awaiting", pinned: false }
  ];

  const enterpriseAgentCategoryTabs = [
    { id: "all", label: "全部" },
    { id: "product_design", label: "产品设计" },
    { id: "software_dev", label: "软件开发" },
    { id: "project_management", label: "项目管理" },
    { id: "marketing", label: "市场营销" },
    { id: "sales", label: "销售" },
    { id: "quality_testing", label: "质量测试" },
    { id: "strategic_analysis", label: "战略分析" },
    { id: "scientific_research", label: "科研实验" },
    { id: "media", label: "媒体" }
  ];

  const enterpriseAgents = [
    {
      id: "cloud-factory-ops",
      name: "云码工厂维护专员",
      description: "自动化维护云码工厂迭代、故事、任务、缺陷等",
      category: "software_dev",
      chatFlowKey: "cloudFactoryOps"
    },
    {
      id: "prd-writer",
      name: "PRD写手",
      description: "把需求要点整理为可评审的 PRD：场景、流程、边界与验收口径一次写清楚。",
      category: "product_design",
      chatFlowKey: "prdWriter"
    },
    {
      id: "product-planning",
      name: "产品规划专家",
      description: "结合机会与组织能力拆解节奏与里程碑，输出路线图级规划与优先级建议。",
      category: "product_design"
    },
    {
      id: "market-insight",
      name: "市场洞察",
      description: "汇聚行业信号、竞品动作与用户线索，沉淀成可执行的小结与下一步假设。",
      category: "marketing",
      chatFlowKey: "marketInsight"
    },
    {
      id: "vibe-coder",
      name: "Vibe Coder",
      description: "以快速原型为导向，把想法落成可点可用的小功能，加速试错与演示闭环。",
      category: "software_dev",
      chatFlowKey: "vibeCoder"
    },
    {
      id: "architect",
      name: "资深架构师",
      description: "在高并发与演进约束下给出分层、边界与关键技术取舍，控制长期复杂度。",
      category: "software_dev"
    },
    {
      id: "content-creator",
      name: "内容创作专家",
      description: "产出品牌一致的传播与营销文案，兼顾要点提炼、叙事结构与多平台适配。",
      category: "media",
      chatFlowKey: "contentCreator"
    },
    {
      id: "senior-dev",
      name: "高级开发工程师",
      description: "落地核心业务功能，关注性能、可观测性、代码规范与线上稳定性。",
      category: "software_dev",
      chatFlowKey: "seniorDev"
    },
    {
      id: "ml-engineer",
      name: "模型训练算法工程师",
      description: "围绕任务的数据处理、训练策略与评测闭环迭代，持续提升模型效果与成本。",
      category: "scientific_research",
      suggestedPrompts: [
        "请帮我设计一个小规模文本分类实验方案：数据标注规范、训练/验证划分、基线模型选型与评测指标。"
      ]
    },
    {
      id: "ui-designer",
      name: "UI设计师",
      description: "以可用性与一致性为核心，完善信息架构、组件规范与关键界面表达。",
      category: "product_design",
      suggestedPrompts: [
        "请围绕企业级智能体广场与 Chat 联动，输出一版关键界面的信息架构、组件拆分与空态/加载态建议。"
      ]
    },
    {
      id: "pm-senior",
      name: "高级项目经理",
      description: "统筹范围、风险与干系人沟通，保障里程碑透明交付与问题及时上升。",
      category: "project_management",
      suggestedPrompts: [
        "请帮我把当前跨团队需求拆成两周节奏：里程碑、依赖、风险登记与干系人沟通要点。"
      ]
    },
    {
      id: "agent-orchestrator",
      name: "智能体编排师",
      description: "设计多智能体协同工作流，编排工具调用、知识检索与人类审核节点。",
      category: "software_dev",
      suggestedPrompts: [
        "请把「用户提问 → 多智能体分工 → 工具调用 → 人工审核」的典型链路拆成可编排节点与异常分支。"
      ]
    },
    {
      id: "security",
      name: "网安专家",
      description: "从威胁建模、访问控制到合规检查，给出加固清单、审计要点与演练建议。",
      category: "quality_testing",
      suggestedPrompts: [
        "请对企业级智能体接入场景做一次简要威胁建模，列出关键控制点、审计要点与演练建议。"
      ]
    },
    {
      id: "strategy",
      name: "战略咨询顾问",
      description: "用结构化方法澄清商业问题，支持决策材料、关键假设验证与路径推演。",
      category: "strategic_analysis",
      suggestedPrompts: [
        "请用一页纸结构梳理某业务线的增长假设、验证路径、资源投入与止损条件，便于上会讨论。"
      ]
    },
    {
      id: "sdet",
      name: "测开工程师",
      description: "建设自动化测试与质量门禁，覆盖接口、端到端与持续集成中的回归效率。",
      category: "quality_testing",
      suggestedPrompts: [
        "请为关键接口与核心用户路径给出自动化测试分层、回归门禁与 CI 集成要点建议。"
      ]
    }
  ];

  const enterpriseFlowPresets = {
    default: {
      defaultQuery: "请围绕当前任务目标，给我一版结构清楚、可直接落地的执行方案与结果草稿。",
      recentTaskTitle: "生成企业智能体处理结果",
      planningText: "收到，我会先理解目标和约束，再组织资料、整理方案，最后输出一版可复用的结果草稿。",
      planItems: [
        { title: "理解任务目标与约束", tool: "任务理解", eta: "约 10 秒" },
        { title: "检索相关资料并提炼重点", tool: "资料整理", eta: "约 15 秒" },
        { title: "生成结果草稿与交付建议", tool: "内容生成", eta: "约 20 秒" }
      ],
      stages: [
        {
          title: "任务理解与拆解",
          logs: ["已识别任务目标、输入上下文与预期输出。", "已拆成可执行步骤并准备进入资料处理阶段。"]
        },
        {
          title: "资料整合与方案生成",
          logs: ["已整理关键信息并形成结构化提纲。", "正在生成可直接交付的结果草稿。"]
        }
      ],
      artifacts: [
        { name: "企业智能体结果草稿.docx", path: "/ClawAgent/企业智能体/企业智能体结果草稿.docx", size: "146 KB" }
      ],
      finalMessage: "已生成结果草稿与下一步建议，可直接继续补充或导出。"
    },
    cloudFactoryOps: {
      defaultQuery: "请帮我梳理当前迭代中阻塞交付的故事、任务和缺陷，输出优先级、负责人和建议动作。",
      recentTaskTitle: "生成云码工厂维护清单",
      planningText: "收到，我会先聚合当前迭代的故事、任务和缺陷，再识别阻塞关系与责任人，最后生成一版可确认的维护清单。",
      planItems: [
        { title: "聚合当前迭代的故事、任务、缺陷", tool: "云码工厂维护 Skill", eta: "约 12 秒" },
        { title: "识别阻塞关系与责任人", tool: "迭代查询", eta: "约 16 秒" },
        { title: "生成维护清单与风险摘要", tool: "清单生成", eta: "约 18 秒" }
      ],
      stages: [
        {
          title: "云码工厂维护 Skill",
          logs: ["已识别目标项目：CCCloud 企业智能体接入。", "已连接迭代、任务、缺陷与成员信息。"]
        },
        {
          title: "维护清单生成",
          logs: ["共识别阻塞事项 11 个，其中高优先级 5 个。", "已输出《云码工厂阻塞事项清单》与沟通摘要。"]
        }
      ],
      artifacts: [
        { name: "云码工厂阻塞事项清单.xlsx", path: "/ClawAgent/企业智能体/云码工厂阻塞事项清单.xlsx", size: "96 KB" },
        { name: "迭代风险沟通摘要.md", path: "/ClawAgent/企业智能体/迭代风险沟通摘要.md", size: "18 KB" }
      ],
      finalMessage: "已生成当前迭代维护清单和风险沟通摘要，可直接用于后续跟进。"
    },
    prdWriter: {
      defaultQuery: "请根据“企业级智能体广场点击智能体后回到 Chat 页面，自动回显推荐问并可一键发送；默认态仅在点击办公助手时展示差旅报销推荐问和三张附件”这个需求，整理一版可评审 PRD。",
      recentTaskTitle: "生成企业智能体联动 PRD",
      planningText: "收到，我会先把需求背景、范围和交互变化拆清楚，再整理关键流程与验收口径，最后输出一版可评审 PRD。",
      planItems: [
        { title: "结构化需求背景与范围", tool: "需求结构化 Skill", eta: "约 12 秒" },
        { title: "梳理页面联动与状态回填", tool: "交互流程", eta: "约 18 秒" },
        { title: "生成 PRD 与流程说明", tool: "文档草拟", eta: "约 20 秒" }
      ],
      stages: [
        {
          title: "需求结构化 Skill",
          logs: ["已提炼需求背景、目标用户与关键变化点。", "已识别涉及企业级智能体广场、Chat 空态与推荐问机制。"]
        },
        {
          title: "PRD 文档草拟",
          logs: ["已生成需求概述、交互流程、状态逻辑和验收标准章节。", "已补充《企业级智能体对话联动 PRD》初稿。"]
        }
      ],
      artifacts: [
        { name: "企业级智能体对话联动PRD.docx", path: "/ClawAgent/企业智能体/企业级智能体对话联动PRD.docx", size: "208 KB" },
        { name: "交互流程说明.md", path: "/ClawAgent/企业智能体/交互流程说明.md", size: "24 KB" }
      ],
      finalMessage: "已生成可评审 PRD 初稿与交互流程说明，可直接进入评审。"
    },
    marketInsight: {
      defaultQuery: "请帮我分析企业级智能体产品近期的市场机会与竞品动作，整理成一个可执行的洞察摘要。",
      recentTaskTitle: "生成企业级智能体市场洞察",
      planningText: "收到，我会先归集市场信号和竞品动作，再抽取机会点与竞争压力，最后整理成一份可确认的洞察摘要。",
      planItems: [
        { title: "归集市场信号与竞品动态", tool: "市场信号聚合 Skill", eta: "约 12 秒" },
        { title: "归类竞争动作与机会点", tool: "竞品动作归类", eta: "约 15 秒" },
        { title: "生成洞察摘要与清单", tool: "摘要生成", eta: "约 18 秒" }
      ],
      stages: [
        {
          title: "市场信号聚合 Skill",
          logs: ["已归集企业智能体领域近两周的产品发布、行业活动与客户线索。", "识别出效率提升、企业知识助手和多智能体协同是高频关注点。"]
        },
        {
          title: "机会点摘要生成",
          logs: ["已整理 3 个可重点跟进的市场机会。", "已输出《企业级智能体市场洞察摘要》初稿。"]
        }
      ],
      artifacts: [
        { name: "企业级智能体市场洞察摘要.docx", path: "/ClawAgent/企业智能体/企业级智能体市场洞察摘要.docx", size: "192 KB" },
        { name: "竞品动作清单.xlsx", path: "/ClawAgent/企业智能体/竞品动作清单.xlsx", size: "88 KB" }
      ],
      finalMessage: "已生成市场洞察摘要、竞品动作清单与下一步建议。"
    },
    vibeCoder: {
      defaultQuery: "请基于企业级智能体广场跳转 Chat 的需求，快速给出一个可演示的前端原型实现方案。",
      recentTaskTitle: "生成前端原型实现方案",
      planningText: "收到，我会先明确交互目标与页面状态，再快速拼出一个可演示的前端原型方案，最后整理成可确认的实现说明。",
      planItems: [
        { title: "识别关键交互与原型范围", tool: "快速原型 Skill", eta: "约 10 秒" },
        { title: "编排页面状态与组件职责", tool: "页面状态编排", eta: "约 16 秒" },
        { title: "输出原型方案与状态映射", tool: "原型脚本", eta: "约 20 秒" }
      ],
      stages: [
        {
          title: "快速原型 Skill",
          logs: ["已识别关键交互：广场点击、Chat 回显、推荐问发送、办公助手默认态。", "已确认原型范围聚焦在页面联动与对话态切换。"]
        },
        {
          title: "交互原型脚本",
          logs: ["已生成状态切换说明与组件职责草稿。", "已输出原型方案说明，可用于演示和联调。"]
        }
      ],
      artifacts: [
        { name: "企业智能体联动原型方案.md", path: "/ClawAgent/企业智能体/企业智能体联动原型方案.md", size: "26 KB" },
        { name: "前端状态映射表.xlsx", path: "/ClawAgent/企业智能体/前端状态映射表.xlsx", size: "74 KB" }
      ],
      finalMessage: "已生成可演示的前端原型方案与状态映射说明。"
    },
    contentCreator: {
      defaultQuery: "请围绕企业级智能体广场新能力，产出一版面向内部宣发的功能介绍文案和发布话术。",
      recentTaskTitle: "生成功能宣发文案",
      planningText: "收到，我会先提炼这次功能变更的卖点和场景价值，再整理发布文案与渠道话术，最后输出一版可确认的内容包。",
      planItems: [
        { title: "提炼功能变化与目标受众", tool: "内容策划 Skill", eta: "约 10 秒" },
        { title: "沉淀卖点与表达主线", tool: "卖点提炼", eta: "约 14 秒" },
        { title: "生成发布文案与渠道话术", tool: "文案生成", eta: "约 18 秒" }
      ],
      stages: [
        {
          title: "内容策划 Skill",
          logs: ["已提炼功能变化：广场智能体可直接带推荐问进入 Chat，办公助手默认态更明确。", "已确认目标受众为产品、设计、研发和内部运营团队。"]
        },
        {
          title: "宣发文案生成",
          logs: ["已生成《功能发布文案》和《渠道话术清单》。", "已形成一版适合内部传播的内容包。"]
        }
      ],
      artifacts: [
        { name: "企业智能体功能发布文案.docx", path: "/ClawAgent/企业智能体/企业智能体功能发布文案.docx", size: "154 KB" },
        { name: "渠道话术清单.xlsx", path: "/ClawAgent/企业智能体/渠道话术清单.xlsx", size: "61 KB" }
      ],
      finalMessage: "已生成内部宣发文案、发布话术与使用场景摘要。"
    },
    seniorDev: {
      defaultQuery: "请把企业级智能体广场智能体跳转 Chat 的需求拆成开发任务，给出接口、前端状态、联调和测试重点。",
      recentTaskTitle: "生成研发执行清单",
      planningText: "收到，我会先拆解需求涉及的状态和入口，再细化成开发、联调和测试任务，最后输出一版可确认的研发执行清单。",
      planItems: [
        { title: "拆解页面入口与状态点", tool: "开发任务拆解 Skill", eta: "约 12 秒" },
        { title: "梳理接口、联调与回归重点", tool: "接口与状态梳理", eta: "约 16 秒" },
        { title: "生成研发清单与检查单", tool: "执行清单生成", eta: "约 18 秒" }
      ],
      stages: [
        {
          title: "开发任务拆解 Skill",
          logs: ["已识别需求涉及广场列表、Chat 输入态、flow 配置与默认态逻辑。", "将任务拆为数据配置、路由回填、页面状态同步和验证四类。"]
        },
        {
          title: "研发执行清单生成",
          logs: ["已整理开发任务、联调关注点和回归测试点。", "已输出《开发任务拆解表》和《联调检查单》。"]
        }
      ],
      artifacts: [
        { name: "开发任务拆解表.xlsx", path: "/ClawAgent/企业智能体/开发任务拆解表.xlsx", size: "82 KB" },
        { name: "联调检查单.md", path: "/ClawAgent/企业智能体/联调检查单.md", size: "22 KB" }
      ],
      finalMessage: "已输出开发任务拆解、联调重点与测试检查单。"
    }
  };

  const staticAnnotations = {
    shell: {
      label: "APP_SHELL",
      type: "layout",
      schema: {
        layout: "three_column",
        columns: { sidebar_px: 240, main_min_px: 720, right_panel_px: 300 },
        regions: ["sidebar", "main_stream", "right_panel", "composer"]
      }
    },
    sidebar: {
      label: "SIDEBAR_NAV",
      type: "navigation",
      schema: {
        active_route: "new_task",
        nav_items: ["新建任务", "企业级智能体", "SkillHub", "自动化任务", "心跳"],
        recent_task_limit: recentTasks.length,
        supports: ["pin", "rename", "delete"]
      }
    },
    rightPanel: {
      label: "RIGHT_PANEL",
      type: "context_panel",
      schema: {
        cards: ["task_progress", "task_files", "context"],
        update_source: "current_step"
      }
    },
    composer: {
      label: "COMPOSER",
      type: "input_composer",
      schema: {
        project_id: "proj-travel-ops",
        supports: ["attachments", "skill_mentions", "skill_picker", "stop", "steer"]
      }
    },
    stepper: {
      label: "TIMELINE_STEPPER",
      type: "demo_controller",
      schema: {
        total_steps: 32,
        controls: ["keyboard_prev", "keyboard_next"]
      }
    }
  };

  const steps = [
    {
      id: 1,
      title: "用户提交模糊的报销请求",
      kind: "USER_MESSAGE",
      items: [
        {
          kind: "user_message",
          id: "msg-user-001",
          text: "帮我把上海出差这次报销处理一下,附件里有票据,按公司要求帮我提一下。",
          attachments: ["上海机票行程单.pdf", "酒店发票.jpg", "打车发票-03-18.png"],
          annotation: {
            label: "USER_MESSAGE",
            type: "user_message",
            schema: {
              message_id: "msg-user-001",
              role: "user",
              attachments: [
                { file_id: "file-flight-001", name: "上海机票行程单.pdf", mime_type: "application/pdf" },
                { file_id: "file-hotel-001", name: "酒店发票.jpg", mime_type: "image/jpeg" },
                { file_id: "file-taxi-001", name: "打车发票-03-18.png", mime_type: "image/png" }
              ],
              intent_hint: "travel_expense_submission"
            }
          }
        }
      ]
    },
    {
      id: 2,
      title: "澄清提交方式",
      kind: "HITL_CLARIFY",
      hitl: "intake_submit_mode",
      items: [
        {
          kind: "clarify",
          id: "clarify-intake-001",
          questionKey: "submit_mode",
          question: "本次需要我直接提交审批，还是先整理成草稿给您确认？",
          options: [
            { label: "直接提交审批", value: "direct_submit", summary: "直接提交审批" },
            { label: "先生成草稿给我确认", value: "draft_first", summary: "先生成草稿给我确认" },
            { label: "只整理材料不提交", value: "materials_only", summary: "只整理材料不提交" }
          ],
          freeInputLabel: "自己输入"
        }
      ]
    },
    {
      id: 3,
      title: "澄清报销范围",
      kind: "HITL_CLARIFY",
      hitl: "intake_scope",
      items: [
        {
          kind: "clarify",
          id: "clarify-intake-002",
          questionKey: "expense_scope",
          question: "这次报销范围按哪一类处理？",
          options: [
            { label: "只报机票 / 酒店 / 打车", value: "travel_basic", summary: "仅机票、酒店和打车" },
            { label: "含餐补和市内交通", value: "travel_plus_allowance", summary: "含餐补和市内交通" },
            { label: "按全部附件和标准一起判断", value: "all_by_policy", summary: "按全部附件和公司标准判断" }
          ],
          freeInputLabel: "自己输入"
        }
      ]
    },
    {
      id: 4,
      title: "澄清归属项目",
      kind: "HITL_CLARIFY",
      hitl: "intake_project",
      items: [
        {
          kind: "clarify",
          id: "clarify-intake-003",
          questionKey: "project_code",
          question: "报销归属项目或成本中心要怎么填写？",
          options: [
            { label: "沿用默认差旅项目", value: "default_travel_project", summary: "沿用默认差旅项目" },
            { label: "归属上海客户拜访项目", value: "shanghai_client_visit", summary: "归属上海客户拜访项目" },
            { label: "先留空，后续再补", value: "leave_blank", summary: "先留空，后续再补" }
          ],
          freeInputLabel: "自己输入"
        }
      ]
    },
    {
      id: 5,
      title: "汇总已明确需求",
      kind: "CLARIFY_SUMMARY",
      items: [
        {
          kind: "clarify_summary",
          id: "clarify-summary-001",
          entries: [
            {
              question: "本次需要我怎么提交？",
              answerKey: "submit_mode",
              fallbackValue: "draft_first",
              customLabel: "用户自定义提交方式",
              options: [
                { label: "直接提交审批", value: "direct_submit", summary: "直接提交审批" },
                { label: "先生成草稿给我确认", value: "draft_first", summary: "先生成草稿给我确认" },
                { label: "只整理材料不提交", value: "materials_only", summary: "只整理材料不提交" }
              ]
            },
            {
              question: "这次报销范围按什么规则处理？",
              answerKey: "expense_scope",
              fallbackValue: "travel_basic",
              customLabel: "用户自定义报销范围",
              options: [
                { label: "只报机票 / 酒店 / 打车", value: "travel_basic", summary: "仅机票、酒店和打车" },
                { label: "含餐补和市内交通", value: "travel_plus_allowance", summary: "含餐补和市内交通" },
                { label: "按全部附件和标准一起判断", value: "all_by_policy", summary: "按全部附件和公司标准判断" }
              ]
            },
            {
              question: "报销归属项目或成本中心怎么填写？",
              answerKey: "project_code",
              fallbackValue: "default_travel_project",
              customLabel: "用户自定义归属项目",
              options: [
                { label: "沿用默认差旅项目", value: "default_travel_project", summary: "沿用默认差旅项目" },
                { label: "归属上海客户拜访项目", value: "shanghai_client_visit", summary: "归属上海客户拜访项目" },
                { label: "先留空，后续再补", value: "leave_blank", summary: "先留空，后续再补" }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 6,
      title: "Agent 明确需求并开始规划",
      kind: "NARRATION",
      items: [
        {
          kind: "narration",
          id: "msg-narration-001",
          text: "已收到并明确您的报销需求,正在规划任务。",
          annotation: {
            label: "NARRATION",
            type: "agent_narration",
            schema: { message_id: "msg-narration-001", role: "assistant", display: "inline_text" }
          }
        }
      ]
    },
    {
      id: 7,
      title: "模型思考任务路径",
      kind: "THINKING",
      items: [
        {
          kind: "thinking",
          id: "thinking-001",
          duration: 3,
          content: "用户已确认提交方式、报销范围和归属项目。接下来需要先识别三份附件并核验票据字段,再确认酒店晚数是否完整。ERP 写入和 OA 提交属于外部系统操作,需要在创建草稿和最终提交前请求授权。",
          annotation: {
            label: "THINKING",
            type: "model_thinking",
            schema: { duration_sec: 3, collapsed_by_default: true, retention_policy: "ephemeral" }
          }
        }
      ]
    },
    {
      id: 8,
      title: "载入差旅报销技能",
      kind: "SKILL_CHIP",
      items: [
        {
          kind: "skill_chip",
          id: "skill-001",
          skill: "差旅报销",
          request: { skill: "enterprise-skills:travel-expense" },
          response: "Launching skill: enterprise-skills:travel-expense",
          description: "按公司制度识别票据、核验标准、生成报销单并提交审批。",
          annotation: {
            label: "SKILL_CHIP",
            type: "skill",
            schema: {
              skill_id: "skill-travel-expense",
              name: "差旅报销",
              trigger: "用户请求提交差旅报销且含票据附件",
              required_connectors: ["ERP", "OA", "企业知识库"]
            }
          }
        }
      ]
    },
    {
      id: 9,
      title: "生成执行计划",
      kind: "PLAN_CARD",
      items: [
        {
          kind: "plan_card",
          id: "plan-001",
          status: "已建立",
          items: planItems,
          annotation: {
            label: "PLAN_CARD",
            type: "plan",
            schema: {
              plan_id: "plan-expense-001",
              status: "ready",
              approval_required: false,
              items: planItems.map((item, index) => ({ order: index + 1, ...item }))
            }
          }
        }
      ]
    },
    {
      id: 10,
      title: "计划转为任务推进清单",
      kind: "TODO_LIST",
      items: [
        {
          kind: "todo_list",
          id: "todo-001",
          items: todoItems,
          annotation: {
            label: "TODO_ITEM",
            type: "todo_list",
            schema: {
              plan_id: "plan-expense-001",
              source: "generated_plan",
              statuses: ["done", "in_progress", "pending", "blocked"]
            }
          }
        },
        {
          kind: "tool_call",
          id: "tool-pending-001",
          toolName: "file_queue",
          category: "file",
          status: "pending",
          headline: "read file",
          action: "排队读取三份附件",
          target: "会话工作区",
          elapsed: "0.0s",
          summary: "即将运行",
          annotation: {
            label: "TOOL_CALL[pending]",
            type: "tool_call",
            subtype: "file",
            schema: {
              tool_name: "file_queue",
              args: { files: ["上海机票行程单.pdf", "酒店发票.jpg", "打车发票-03-18.png"] },
              output: null,
              status: "pending"
            }
          }
        }
      ]
    },
    {
      id: 11,
      title: "读取上海机票行程单",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-read-flight",
          toolName: "file_read",
          category: "file",
          status: "success_collapsed",
          headline: "Read file 上海机票行程单",
          action: "读取",
          target: "上海机票行程单.pdf",
          elapsed: "1.8s",
          summary: "读取 上海机票行程单.pdf · 1 页 · 1.8s",
          args: { path: "/workspace/attachments/上海机票行程单.pdf", mode: "ocr_ready" },
          output: { passenger: "张三", route: "北京 → 上海", amount: "¥1,280", invoice_code: "144032026041" },
          annotation: {
            label: "TOOL_CALL[success]",
            type: "tool_call",
            subtype: "file",
            schema: {
              tool_name: "file_read",
              args: { path: "/workspace/attachments/上海机票行程单.pdf" },
              output: { pages: 1, extracted_fields: ["passenger", "route", "amount"] },
              latency_ms: 1842
            }
          }
        }
      ]
    },
    {
      id: 12,
      title: "OCR 识别酒店发票",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-ocr-hotel",
          toolName: "ocr_extract",
          category: "doc",
          status: "success_expanded",
          headline: "OCR extract 酒店发票.jpg",
          action: "OCR 识别",
          target: "酒店发票.jpg",
          elapsed: "2.4s",
          summary: "识别 酒店发票.jpg · 11 个字段 · 2.4s",
          args: { file: "酒店发票.jpg", schema: "vat_invoice_cn", strict: true },
          output: {
            seller: "上海虹桥商务酒店有限公司",
            buyer: "中国电信集团有限公司",
            stay_date: "2026-03-18",
            amount: "¥1,080",
            tax_rate: "6%"
          },
          annotation: {
            label: "TOOL_CALL[success]",
            type: "tool_call",
            subtype: "document_ocr",
            schema: {
              tool_name: "ocr_extract",
              args: { file_id: "file-hotel-001", schema: "vat_invoice_cn" },
              output: { fields_count: 11, confidence: 0.96 },
              latency_ms: 2410
            }
          }
        }
      ]
    },
    {
      id: 13,
      title: "OCR 识别打车发票",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-ocr-taxi",
          toolName: "ocr_extract",
          category: "doc",
          status: "success_collapsed",
          headline: "OCR extract 打车发票-03-18.png",
          action: "OCR 识别",
          target: "打车发票-03-18.png",
          elapsed: "1.1s",
          summary: "识别 打车发票-03-18.png · 3 张行程 · 1.1s",
          args: { file: "打车发票-03-18.png", schema: "ride_receipt_cn" },
          output: { rides: 3, amount: "¥187", route_match: true },
          annotation: {
            label: "TOOL_CALL[success]",
            type: "tool_call",
            subtype: "document_ocr",
            schema: {
              tool_name: "ocr_extract",
              args: { file_id: "file-taxi-001", schema: "ride_receipt_cn" },
              output: { rides: 3, total_amount: 187 },
              latency_ms: 1130
            }
          }
        }
      ]
    },
    {
      id: 14,
      title: "完成票据查验叙述",
      kind: "NARRATION",
      items: [
        {
          kind: "narration",
          id: "msg-narration-002",
          text: "已完成差旅、机酒、交通 4 份票据查验。",
          annotation: {
            label: "NARRATION",
            type: "agent_narration",
            schema: { message_id: "msg-narration-002", role: "assistant", derived_from_tools: ["tool-read-flight", "tool-ocr-hotel", "tool-ocr-taxi"] }
          }
        }
      ]
    },
    {
      id: 15,
      title: "ERP 创建草稿运行并成功",
      kind: "TOOL_CALL",
      autoSuccess: true,
      items: [
        {
          kind: "tool_call",
          id: "tool-erp-draft-run",
          toolName: "erp.expense.create_draft",
          category: "connector",
          connector: "ERP",
          status: "running_to_success",
          headline: "erp.expense.create_draft",
          action: "创建",
          target: "ERP 报销单草稿",
          elapsed: "3.2s",
          summary: "已创建草稿 BX-DRAFT-7781",
          args: { employee_id: "E1024", category: "差旅费", amount: 3847 },
          output: { draft_id: "BX-DRAFT-7781", status: "draft", editable: true },
          stream: ["连接 ERP 租户...", "写入基础字段...", "关联三份票据附件...", "草稿创建完成。"],
          annotation: {
            label: "TOOL_CALL[running]",
            type: "tool_call",
            subtype: "mcp_connector",
            schema: {
              tool_name: "erp.expense.create_draft",
              status_flow: ["running", "success"],
              output: { draft_id: "BX-DRAFT-7781" },
              latency_ms: 3200
            }
          }
        }
      ]
    },
    {
      id: 16,
      title: "并行子代理调度",
      kind: "SUBAGENT_GROUP",
      items: [
        {
          kind: "subagent_group",
          id: "subagents-001",
          principalAgent: "ExpenseContext-α",
          principalAction: "为 ERP 草稿写入并行准备组织、政策与界面上下文",
          tasks: [
            {
              title: "组织信息查询",
              detail: "从 OA 拉取张三的部门与上级信息",
              status: "success",
              elapsed: "4.8s"
            },
            {
              title: "制度核验",
              detail: "查询公司差旅标准(2024 版)",
              status: "success",
              elapsed: "5.3s"
            }
          ],
          annotation: {
            label: "SUBAGENT_GROUP",
            type: "subagent_group",
            schema: {
              group_id: "parallel-001",
              fanout: 2,
              join_strategy: "wait_all",
              results: ["department_manager", "travel_policy_2024"]
            }
          }
        }
      ]
    },
    {
      id: 17,
      title: "请求 ERP 写入授权",
      kind: "TOOL_CALL",
      hitl: "permission",
      items: [
        {
          kind: "tool_call",
          id: "tool-erp-write-approval",
          toolName: "erp.expense.write",
          category: "connector",
          connector: "ERP",
          status: "needs_approval",
          headline: "erp.expense.write",
          action: "连接器 ERP",
          target: "写入报销单草稿",
          elapsed: "等待授权",
          summary: "将把已核验的费用明细写入 ERP 草稿,不会提交 OA 审批。",
          args: {
            draft_id: "BX-DRAFT-7781",
            lines: 6,
            attachments: 3,
            include_policy_fields: true
          },
          feedbackMessages: {
            "deny-permission": "已拒绝 ERP 写入授权,当前流程停留在草稿阶段。"
          },
          annotation: {
            label: "HITL[permission]",
            type: "tool_call",
            subtype: "mcp_connector",
            schema: {
              tool_name: "erp.expense.write",
              connector: "ERP",
              args: { draft_id: "BX-DRAFT-7781", lines: 6, attachments: 3 },
              output: null
            },
            hitl_policy: "allow_once_or_always"
          }
        }
      ]
    },
    {
      id: 18,
      title: "写入 ERP 报销单",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-erp-write-running",
          toolName: "erp.expense.write",
          category: "connector",
          connector: "ERP",
          status: "running",
          headline: "erp.expense.write",
          action: "写入",
          target: "ERP 报销单",
          elapsed: "00:08",
          summary: "正在写入 ERP 报销单字段与附件。",
          stream: ["校验员工成本中心...", "写入机票 ¥1,280...", "写入酒店 ¥1,080...", "写入交通 ¥187...", "关联差旅补贴与项目编码..."],
          args: { draft_id: "BX-DRAFT-7781", mode: "streaming_update" },
          annotation: {
            label: "TOOL_CALL[running]",
            type: "tool_call",
            subtype: "mcp_connector",
            schema: {
              tool_name: "erp.expense.write",
              args: { draft_id: "BX-DRAFT-7781" },
              stream: true,
              output: "partial"
            }
          }
        }
      ]
    },
    {
      id: 19,
      title: "ERP 接口超时",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-erp-error",
          toolName: "erp.expense.write",
          category: "connector",
          connector: "ERP",
          status: "error",
          headline: "erp.expense.write",
          action: "调用",
          target: "ERP 接口失败",
          elapsed: "10.0s",
          summary: "超时: ERP 网关 10 秒内未返回。",
          autoRetry: true,
          retryMessage: "系统已自动发起重试,正在重新提交 ERP 写入请求。",
          args: { draft_id: "BX-DRAFT-7781", retryable: true },
          output: { code: "ERP_GATEWAY_TIMEOUT", retry_after_ms: 2000 },
          annotation: {
            label: "TOOL_CALL[error]",
            type: "tool_call",
            subtype: "mcp_connector",
            schema: {
              tool_name: "erp.expense.write",
              args: { draft_id: "BX-DRAFT-7781" },
              error: { code: "ERP_GATEWAY_TIMEOUT", retryable: true },
              latency_ms: 10000
            },
            hitl_policy: "retry_or_skip"
          }
        }
      ]
    },
    {
      id: 20,
      title: "重试后 ERP 写入成功",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-erp-write-success",
          toolName: "erp.expense.write",
          category: "connector",
          connector: "ERP",
          status: "success_expanded",
          headline: "erp.expense.write",
          action: "重试写入",
          target: "ERP 报销单",
          elapsed: "2.9s",
          summary: "写入成功 · BX-DRAFT-7781 · 2.9s",
          args: { draft_id: "BX-DRAFT-7781", retry: 1 },
          output: { amount: "¥3,847", lines: 6, attachments: 3, validation: "passed" },
          annotation: {
            label: "TOOL_CALL[success]",
            type: "tool_call",
            subtype: "mcp_connector",
            schema: {
              tool_name: "erp.expense.write",
              args: { draft_id: "BX-DRAFT-7781", retry: 1 },
              output: { validation: "passed", lines: 6 },
              latency_ms: 2930
            }
          }
        }
      ]
    },
    {
      id: 21,
      title: "最终提交前破坏性确认",
      kind: "DESTRUCTIVE_CONFIRMATION",
      hitl: "destructive",
      items: [
        {
          kind: "tool_call",
          id: "tool-oa-destructive",
          toolName: "oa.approval.submit",
          category: "connector",
          connector: "OA",
          status: "destructive",
          headline: "oa.approval.submit",
          action: "即将提交至 OA 审批流",
          target: "提交后不可撤销",
          elapsed: "等待确认",
          summary: "提交后将进入上级审批,草稿不可继续编辑。",
          impact: [
            "将提交报销单 BX-DRAFT-7781 至 OA 审批流",
            "将锁定 6 条费用明细与 3 份票据附件",
            "将通知直属上级 李经理 和财务共享中心"
          ],
          paths: [
            "/ERP/expense/BX-DRAFT-7781",
            "/OA/approval/travel/BX-DRAFT-7781",
            "/ClawAgent/差旅报销/BX20260423001"
          ],
          args: { draft_id: "BX-DRAFT-7781", submit: true, irreversible: true },
          annotation: {
            label: "HITL[destructive]",
            type: "tool_call",
            subtype: "mcp_connector",
            schema: {
              tool_name: "oa.approval.submit",
              args: { draft_id: "BX-DRAFT-7781", irreversible: true },
              output: null,
              impact_count: 3
            },
            hitl_policy: "confirm_only_no_always"
          }
        }
      ]
    },
    {
      id: 22,
      title: "OA 审批提交成功",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-oa-submit-success",
          toolName: "oa.approval.submit",
          category: "connector",
          connector: "OA",
          status: "success_collapsed",
          headline: "oa.approval.submit",
          action: "提交",
          target: "OA 审批流",
          elapsed: "1.6s",
          summary: "提交成功 · 审批单 BX20260423001 · 1.6s",
          args: { draft_id: "BX-DRAFT-7781" },
          output: { approval_no: "BX20260423001", assignee: "李经理", sla: "2 工作日" },
          annotation: {
            label: "TOOL_CALL[success]",
            type: "tool_call",
            subtype: "mcp_connector",
            schema: {
              tool_name: "oa.approval.submit",
              args: { draft_id: "BX-DRAFT-7781" },
              output: { approval_no: "BX20260423001", status: "submitted" },
              latency_ms: 1610
            }
          }
        }
      ]
    },
    {
      id: 23,
      title: "提交完成说明",
      kind: "NARRATION",
      items: [
        {
          kind: "narration",
          id: "msg-narration-004",
          text: "报销申请已提交至 OA 审批流,ERP 草稿已锁定并完成附件归档。直属上级将收到审批提醒,财务共享中心会在审批完成后复核发票。",
          annotation: {
            label: "NARRATION",
            type: "agent_narration",
            schema: { message_id: "msg-narration-004", role: "assistant", derived_from_tools: ["tool-oa-submit-success"] }
          }
        }
      ]
    },
    {
      id: 24,
      title: "正在创建申请文档",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-docx-generate-running",
          toolName: "document.generate_docx",
          category: "doc",
          presentation: "local_file_create",
          status: "running",
          headline: "正在创建：差旅申请草稿.docx",
          action: "创建",
          target: "差旅申请草稿.docx",
          elapsed: "00:06",
          summary: "正在整理报销摘要、审批单号与附件索引。",
          stream: ["加载报销草稿 BX-DRAFT-7781...", "写入审批单号 BX20260423001...", "编排费用明细与附件目录...", "生成 Word 文档版式..."],
          annotation: {
            label: "TOOL_CALL[running]",
            type: "tool_call",
            subtype: "document_generation",
            schema: {
              tool_name: "document.generate_docx",
              args: { draft_id: "BX-DRAFT-7781", format: "docx" },
              stream: true,
              output: "partial"
            }
          }
        }
      ]
    },
    {
      id: 25,
      title: "申请文档生成完成",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-docx-generate-success",
          toolName: "document.generate_docx",
          category: "doc",
          presentation: "local_file_create",
          status: "success_collapsed",
          headline: "已完成：差旅申请草稿.docx",
          action: "完成",
          target: "差旅申请草稿.docx",
          elapsed: "6.4s",
          summary: "已完成 差旅申请草稿.docx · 126 KB · 6.4s",
          output: {
            file_name: "差旅申请草稿.docx",
            path: draftDocumentArtifact.path,
            size: draftDocumentArtifact.size
          },
          annotation: {
            label: "TOOL_CALL[success]",
            type: "tool_call",
            subtype: "document_generation",
            schema: {
              tool_name: "document.generate_docx",
              args: { draft_id: "BX-DRAFT-7781", format: "docx" },
              output: { file_name: "差旅申请草稿.docx", size_kb: 126 },
              latency_ms: 6400
            }
          }
        }
      ]
    },
    {
      id: 26,
      title: "引导查看任务产物",
      kind: "NARRATION",
      items: [
        {
          kind: "narration",
          id: "msg-narration-005",
          text: "下面是本次任务产物。",
          annotation: {
            label: "NARRATION",
            type: "agent_narration",
            schema: { message_id: "msg-narration-005", role: "assistant", display: "inline_text" }
          }
        }
      ]
    },
    {
      id: 27,
      title: "生成并展示交付产物",
      kind: "ARTIFACT_CARD",
      items: [
        {
          kind: "artifact_list",
          id: "artifacts-001",
          artifacts,
          annotation: {
            label: "ARTIFACT_CARD",
            type: "artifact_list",
            schema: {
              session_id: "sess-expense-20260423",
              artifacts: artifacts.map((artifact, index) => ({ artifact_id: `artifact-${index + 1}`, ...artifact })),
              actions: ["preview", "download", "push_to_drive", "share"]
            }
          }
        }
      ]
    },
    {
      id: 28,
      title: "用户要求删除本地草稿文件",
      kind: "USER_MESSAGE",
      items: [
        {
          kind: "user_message",
          id: "msg-user-002",
          text: "差旅申请草稿.docx 不需要保留了，帮我删除掉。",
          attachments: [],
          annotation: {
            label: "USER_MESSAGE",
            type: "user_message",
            schema: {
              message_id: "msg-user-002",
              role: "user",
              intent_hint: "delete_generated_local_file"
            }
          }
        }
      ]
    },
    {
      id: 29,
      title: "删除本地文件前的破坏性确认",
      kind: "DESTRUCTIVE_CONFIRMATION",
      hitl: "destructive",
      items: [
        {
          kind: "tool_call",
          id: "tool-local-delete-destructive",
          toolName: "local.file.delete",
          category: "file",
          status: "destructive",
          headline: "local.file.delete",
          action: "即将删除本地文件",
          target: "删除后不可恢复",
          elapsed: "等待确认",
          summary: "将删除当前任务目录中的本地草稿文件,删除后将无法直接恢复。",
          impact: [
            "将删除差旅申请草稿.docx",
            "将从当前任务产物中移除该文件",
            "不会影响已提交的 OA 审批单与 ERP 草稿"
          ],
          paths: [draftDocumentArtifact.path],
          confirmLabel: "确认删除",
          cancelLabel: "保留文件",
          showEdit: false,
          confirmAdvanceSteps: 3,
          feedbackMessages: {
            "cancel-destructive": "已取消删除,本地草稿文件会继续保留。"
          },
          annotation: {
            label: "HITL[destructive]",
            type: "tool_call",
            subtype: "local_file_system",
            schema: {
              tool_name: "local.file.delete",
              args: { path: draftDocumentArtifact.path, recursive: false },
              output: null,
              impact_count: 3
            },
            hitl_policy: "confirm_only_no_always"
          }
        }
      ]
    },
    {
      id: 30,
      title: "本地文件删除完成",
      kind: "TOOL_CALL",
      items: [
        {
          kind: "tool_call",
          id: "tool-local-delete-success",
          toolName: "local.file.delete",
          category: "file",
          presentation: "local_file_delete",
          status: "success_collapsed",
          headline: "已删除：差旅申请草稿.docx",
          action: "删除",
          target: "差旅申请草稿.docx",
          elapsed: "0.4s",
          summary: "删除成功 · 差旅申请草稿.docx · 0.4s",
          output: {
            file_name: "差旅申请草稿.docx",
            path: draftDocumentArtifact.path,
            removed: true
          },
          annotation: {
            label: "TOOL_CALL[success]",
            type: "tool_call",
            subtype: "local_file_system",
            schema: {
              tool_name: "local.file.delete",
              args: { path: draftDocumentArtifact.path },
              output: { removed: true },
              latency_ms: 420
            }
          }
        }
      ]
    },
    {
      id: 31,
      title: "删除完成说明",
      kind: "NARRATION",
      items: [
        {
          kind: "narration",
          id: "msg-narration-006",
          text: "本地草稿文件已删除，当前任务产物已同步更新为仅保留正式交付件。",
          annotation: {
            label: "NARRATION",
            type: "agent_narration",
            schema: { message_id: "msg-narration-006", role: "assistant", derived_from_tools: ["tool-local-delete-success"] }
          }
        }
      ]
    },
    {
      id: 32,
      title: "更新任务产物列表",
      kind: "ARTIFACT_CARD",
      items: [
        {
          kind: "artifact_list",
          id: "artifacts-after-delete",
          artifacts: artifactsAfterDeletion,
          annotation: {
            label: "ARTIFACT_CARD",
            type: "artifact_list",
            schema: {
              session_id: "sess-expense-20260423",
              artifacts: artifactsAfterDeletion.map((artifact, index) => ({ artifact_id: `artifact-keep-${index + 1}`, ...artifact })),
              actions: ["preview", "download", "push_to_drive", "share"]
            }
          }
        }
      ]
    }
  ];

  return {
    steps,
    planItems,
    todoItems,
    artifacts,
    artifactsAfterDeletion,
    draftDocumentArtifact,
    recentTasks,
    enterpriseAgentCategoryTabs,
    enterpriseAgents,
    enterpriseFlowPresets,
    staticAnnotations
  };
})();

window.DEMO_DATA = DEMO_DATA;
