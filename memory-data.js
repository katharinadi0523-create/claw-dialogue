window.MEMORY_DATA = (() => {
  const memoryClaims = [
    {
      id: "mem-pref-architecture",
      content: "方案文档先给架构图，再展开实现细节。",
      scope: "user",
      type: "feedback",
      sourceSessionId: "task-003",
      sourceSessionTitle: "华东经营周报整理",
      createdAt: "2026-06-10",
      status: "active"
    },
    {
      id: "mem-decision-poc-deadline",
      content: "某局 POC 计划在 6 月底前完成首轮交付。",
      scope: "user",
      type: "project",
      sourceSessionId: "task-008",
      sourceSessionTitle: "客户拜访纪要归档",
      createdAt: "2026-06-09",
      status: "marked_material",
      updateMaterial: {
        storeId: "store-customer-bureau",
        markedAt: "2026-06-10",
        status: "waiting_update"
      }
    },
    {
      id: "mem-exp-weekly-anomaly",
      content: "经营周报先列数据异常，再给原因分析和行动建议。",
      scope: "claw",
      type: "feedback",
      sourceSessionId: "task-003",
      sourceSessionTitle: "华东经营周报整理",
      createdAt: "2026-06-08",
      status: "active"
    },
    {
      id: "mem-profile-private-deploy",
      content: "涉及客户数据时，优先给出私有化部署方案。",
      scope: "user",
      type: "user",
      sourceSessionId: "task-002",
      sourceSessionTitle: "桌面助手前端设计",
      createdAt: "2026-06-07",
      status: "active"
    },
    {
      id: "mem-decision-security-level",
      content: "某局新增等保三级要求，方案需补充安全建设范围。",
      scope: "user",
      type: "project",
      sourceSessionId: "task-008",
      sourceSessionTitle: "客户拜访纪要归档",
      createdAt: "2026-06-05",
      status: "included_in_version",
      updateMaterial: {
        storeId: "store-customer-bureau",
        markedAt: "2026-06-05",
        status: "included",
        version: "v2"
      }
    },
    {
      id: "mem-exp-budget-order",
      content: "标书预算章节先核对财政口径，再拆分软硬件成本。",
      scope: "claw",
      type: "feedback",
      sourceSessionId: "task-004",
      sourceSessionTitle: "Q1 销售复盘报告",
      createdAt: "2026-06-03",
      status: "active"
    },
    {
      id: "mem-pref-markdown",
      content: "中间过程优先使用 Markdown，定稿后再导出 Word。",
      scope: "user",
      type: "feedback",
      sourceSessionId: "task-006",
      sourceSessionTitle: "招聘 JD 批量生成",
      createdAt: "2026-06-01",
      status: "active"
    },
    {
      id: "mem-profile-role",
      content: "当前主要负责产品方案、售前材料与跨团队需求推进。",
      scope: "user",
      type: "user",
      sourceSessionId: "task-004",
      sourceSessionTitle: "Q1 销售复盘报告",
      createdAt: "2026-05-29",
      status: "active"
    },
    {
      id: "mem-pref-visual-first",
      content: "复杂方案先给一张结构图，再补充文字说明。",
      scope: "user",
      type: "feedback",
      sourceSessionId: "task-002",
      sourceSessionTitle: "桌面助手前端设计",
      createdAt: "2026-05-26",
      status: "active"
    },
    {
      id: "mem-exp-meeting-notes",
      content: "客户纪要要明确决策人、承诺时间和待确认事项。",
      scope: "claw",
      type: "feedback",
      sourceSessionId: "task-008",
      sourceSessionTitle: "客户拜访纪要归档",
      createdAt: "2026-05-24",
      status: "active"
    },
    {
      id: "mem-old-weekly-template",
      content: "继续使用 2025 年旧版经营周报模板。",
      scope: "user",
      type: "reference",
      sourceSessionId: "task-003",
      sourceSessionTitle: "华东经营周报整理",
      createdAt: "2025-12-18",
      status: "outdated"
    }
  ];

  const organizationStores = [
    {
      id: "store-customer-bureau",
      name: "客户某局",
      description: "沉淀客户组织关系、项目状态、关键决策与沟通约定。",
      maintainer: "华东售前团队",
      access: "propose-only",
      authorizedBy: "李敏 · 售前负责人",
      updatedAt: "2026-06-11 16:40",
      entries: [
        {
          id: "org-bureau-chain",
          title: "项目决策链",
          summary: "王主任主导业务决策，李工负责技术方案与安全范围把关。",
          section: "组织关系",
          updatedAt: "2026-06-11"
        },
        {
          id: "org-bureau-poc",
          title: "POC 当前状态",
          summary: "首轮范围已确认，交付节点调整为 7 月上旬，等待测试环境开放。",
          section: "项目状态",
          updatedAt: "2026-06-11"
        },
        {
          id: "org-bureau-security",
          title: "安全建设要求",
          summary: "客户要求按等保三级范围设计身份、审计和数据隔离能力。",
          section: "关键决策",
          updatedAt: "2026-06-10"
        }
      ]
    },
    {
      id: "store-presales-playbook",
      name: "售前打法",
      description: "组织沉淀的方案结构、需求澄清方法和典型风险处理经验。",
      maintainer: "解决方案中心",
      access: "read-only",
      authorizedBy: "组织策略自动授权",
      updatedAt: "2026-06-12 09:20",
      entries: [
        {
          id: "org-playbook-structure",
          title: "一页方案结构",
          summary: "先说明业务目标和总体架构，再给场景闭环、实施路径与价值指标。",
          section: "方案写作",
          updatedAt: "2026-06-12"
        },
        {
          id: "org-playbook-discovery",
          title: "首次需求澄清",
          summary: "优先确认业务责任人、数据边界、成功指标和不可变约束。",
          section: "需求澄清",
          updatedAt: "2026-06-10"
        },
        {
          id: "org-playbook-risk",
          title: "POC 延期处理",
          summary: "先固定最小验证范围，再把环境、数据和接口依赖拆成责任清单。",
          section: "风险处理",
          updatedAt: "2026-06-09"
        }
      ]
    }
  ];

  const conversationMemory = {
    expense: {
      used: [
        { memoryId: "org-playbook-risk", storeId: "store-presales-playbook", source: "organization", label: "风险项拆成责任清单" }
      ],
      remembered: [],
      events: [
        {
          id: "event-remember-expense-draft",
          kind: "remembered",
          memoryId: "mem-pref-short-confirm",
          summary: "差旅报销先生成草稿确认，再提交审批",
          afterItemId: "clarify-summary-001",
          memory: {
            id: "mem-pref-short-confirm",
            content: "差旅报销先生成草稿确认，再提交审批。",
            scope: "user",
            type: "feedback",
            sourceSessionId: "task-001",
            sourceSessionTitle: "上海出差报销",
            createdAt: "2026-06-12",
            status: "active"
          },
          when: {
            answerKey: "submit_mode",
            equals: "draft_first"
          },
          status: "active"
        }
      ]
    }
  };

  const expertHandoffs = {
    default: {
      selectedMemoryIds: ["mem-exp-weekly-anomaly", "org-bureau-chain"],
      userMemoryIds: ["mem-pref-architecture", "mem-profile-private-deploy", "mem-pref-markdown", "mem-profile-role", "mem-pref-visual-first"],
      signals: [
        {
          id: "suggest-security-level",
          content: "某局新增等保三级要求，方案需补充安全建设范围。",
          target: "organization",
          storeId: "store-customer-bureau",
          status: "pending"
        },
        {
          id: "suggest-architecture-preference",
          content: "你偏好先看架构图，再阅读详细说明。",
          target: "personal",
          memoryScope: "user",
          memoryType: "feedback",
          status: "pending"
        }
      ]
    }
  };

  const notifications = [
    {
      id: "notice-submitted-poc",
      kind: "marked",
      title: "材料已标记",
      detail: "“某局 POC 计划在 6 月底前完成首轮交付”已标为《客户某局》的更新材料，等待组织下次整理。",
      createdAt: "2026-06-10 10:15",
      read: false
    },
    {
      id: "notice-included-security",
      kind: "included",
      title: "材料已并入新版本",
      detail: "你贡献的“某局新增等保三级要求”已并入《客户某局》v2 新版本。",
      createdAt: "2026-06-11 17:20",
      read: false
    },
    {
      id: "notice-rejected-template",
      kind: "not_included",
      title: "材料未纳入本次更新",
      detail: "“继续使用旧版周报模板”与组织当前规范冲突，未纳入《售前打法》本次更新。",
      createdAt: "2026-06-10 14:08",
      read: true
    }
  ];

  const organizeChanges = [
    {
      id: "organize-merge-visual",
      kind: "merge",
      title: "合并 2 处重复协作反馈",
      detail: "“先给架构图”和“复杂方案先给结构图”表达相同偏好。",
      memoryIds: ["mem-pref-architecture", "mem-pref-visual-first"]
    },
    {
      id: "organize-update-poc",
      kind: "update",
      title: "修正 1 处过时项目语境",
      detail: "根据组织记忆，将某局 POC 节点从 6 月底更新为 7 月上旬。",
      memoryIds: ["mem-decision-poc-deadline"],
      nextContent: "某局 POC 首轮交付节点已调整为 7 月上旬。"
    },
    {
      id: "organize-remove-old-template",
      kind: "remove",
      title: "删除 1 处无效信息入口",
      detail: "2025 年旧版经营周报模板已不再适用。",
      memoryIds: ["mem-old-weekly-template"]
    }
  ];

  return {
    userMemories: memoryClaims.filter((memory) => memory.scope === "user"),
    clawMemories: memoryClaims.filter((memory) => memory.scope === "claw"),
    organizationStores,
    conversationMemory,
    expertHandoffs,
    notifications,
    organizeChanges,
    organizeHistory: []
  };
})();
