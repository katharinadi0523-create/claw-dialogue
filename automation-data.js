window.AUTOMATION_TASKS_MOCK = [
  {
    id: "auto-schedule-daily-english",
    workspace_name: "英语单词推荐",
    name: "每天推荐 5 个实用英语单词",
    description: "每天早上推荐 5 个实用英语单词，附音标、中文释义与简短例句。",
    trigger_type: "time",
    trigger_mode: "schedule",
    trigger_summary: "每天 08:30",
    last_run_at: "2026-04-30 08:42",
    last_run_status: "success",
    enabled: true,
    agent_id: "claw-mine-general",
    claw_id: "claw-mine-general",
    instruction:
      "每天早上推荐 5 个实用英语单词；每个单词输出音标、词性、中文释义和一个不超过 12 个词的英文例句，整体保持简洁、易记、适合晨读。",
    schedule_config: {
      execution_type: "schedule",
      frequency: "daily",
      weekdays: [],
      time: "08:30",
      interval_value: 6,
      interval_unit: "hour",
      run_at_date: "",
      run_at_time: "",
      effective_from: "",
      effective_until: ""
    },
    recent_runs: [
      {
        triggered_at: "2026-04-30 08:42",
        result: "success",
        summary: "已推荐 practical、nudge、cozy、steady、glimpse 5 个单词。",
        sidebar_relative: "刚刚"
      },
      {
        triggered_at: "2026-04-29 21:30",
        result: "success",
        summary: "已推荐 vivid、boost、tidy、humble、thrive 5 个单词。",
        sidebar_relative: "11小时前"
      },
      {
        triggered_at: "2026-04-29 08:30",
        result: "success",
        summary: "已推荐 clarity、gentle、spark、rely、brief 5 个单词。",
        sidebar_relative: "1天前"
      },
      {
        triggered_at: "2026-04-24 08:30",
        result: "success",
        summary: "已推荐 adapt、focus、kind、notion、value 5 个单词。",
        sidebar_relative: "6天前"
      },
      {
        triggered_at: "2026-04-24 07:55",
        result: "success",
        summary: "已推荐 settle、curious、measure、prompt、calm 5 个单词。",
        sidebar_relative: "6天前"
      }
    ]
  },
  {
    id: "auto-schedule-morning-boost",
    workspace_name: "automation-202604210800",
    name: "每天早上给我加油打气",
    description: "每天早上发送一句简短打气话和一个当天行动提醒。",
    trigger_type: "time",
    trigger_mode: "schedule",
    trigger_summary: "每天 08:00",
    last_run_at: "2026-04-30 08:00",
    last_run_status: "success",
    enabled: true,
    agent_id: "claw-mine-general",
    claw_id: "claw-mine-general",
    instruction:
      "每天早上生成一句不超过 30 字的中文鼓励语，再补一句当天可执行的小提醒，整体要温和、有力量，不要鸡汤式空话。",
    schedule_config: {
      execution_type: "schedule",
      frequency: "daily",
      weekdays: [],
      time: "08:00",
      interval_value: 1,
      interval_unit: "day",
      run_at_date: "",
      run_at_time: "",
      effective_from: "",
      effective_until: ""
    },
    recent_runs: [
      {
        triggered_at: "2026-04-30 08:00",
        result: "success",
        summary: "已发送今日鼓励：先把最重要的一件事做完，今天就已经赢了一半。"
      },
      {
        triggered_at: "2026-04-29 08:00",
        result: "success",
        summary: "已发送今日鼓励：节奏稳一点，专注一点，事情就会一点点向前走。"
      }
    ]
  },
  {
    id: "auto-interval-inventory-sync",
    name: "库存同步检查",
    description: "轮询 ERP 与商城库存差异，发现差值后提醒运营处理。",
    trigger_type: "time",
    trigger_mode: "interval",
    trigger_summary: "每 6 小时",
    last_run_at: "2026-04-13 12:00",
    last_run_status: "running",
    enabled: true,
    agent_id: "claw-mine-general",
    claw_id: "claw-mine-general",
    instruction:
      "对比 ERP 与电商平台 SKU 库存，识别差值超过 5 的商品，输出差异表并推送给运营值班群。",
    schedule_config: {
      execution_type: "interval",
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
    recent_runs: [
      {
        triggered_at: "2026-04-13 12:00",
        result: "running",
        summary: "正在比对 1,284 个 SKU，同步检查尚未结束。"
      },
      {
        triggered_at: "2026-04-13 06:00",
        result: "success",
        summary: "发现 8 个差异 SKU，已向运营群发送处理列表。"
      },
      {
        triggered_at: "2026-04-13 00:00",
        result: "success",
        summary: "夜间库存检查完成，无需人工处理。"
      }
    ]
  },
  {
    id: "auto-once-board-pack",
    name: "董事会材料预检查",
    description: "会前单次整理财务与经营指标，输出给董事会材料负责人。",
    trigger_type: "time",
    trigger_mode: "once",
    trigger_summary: "单次：2026-04-20 14:00",
    last_run_at: "",
    last_run_status: "never",
    enabled: false,
    agent_id: "agent-board-pack",
    instruction:
      "汇总一季度经营指标、预算执行率和重点项目里程碑，生成董事会材料预检查摘要，并列出缺失附件和异常指标。",
    schedule_config: {
      execution_type: "once",
      frequency: "daily",
      weekdays: [],
      time: "09:00",
      interval_value: 1,
      interval_unit: "day",
      run_at_date: "2026-04-20",
      run_at_time: "14:00",
      effective_from: "",
      effective_until: ""
    },
    recent_runs: []
  },
  {
    id: "auto-webhook-build-alert",
    name: "构建失败自动诊断",
    description: "接收 GitHub 构建失败 Webhook，自动汇总失败日志并生成修复建议。",
    trigger_type: "event",
    trigger_mode: "webhook",
    trigger_summary: "Webhook 触发",
    last_run_at: "2026-04-13 11:42",
    last_run_status: "success",
    enabled: true,
    agent_id: "agent-ci-diagnosis",
    instruction:
      "收到构建失败事件后，提取失败 job、关键报错和最近相关提交，输出修复建议，并将摘要通知给对应项目负责人。",
    event_config: {
      source_type: "webhook",
      source_name: "GitHub 构建通知",
      event_description: "仓库 CI / CD 失败回调",
      endpoint: "https://hooks.cec-claw.mock/automation/auto-webhook-build-alert",
      secret: "whsec_v3aP6nq0Q7zL",
      trigger_note: "当 workflow 结论为 failure 或 cancelled 时触发。",
      rate_limit: "30 次/分钟",
      dedupe_window: "10 分钟",
      recent_requests: [
        {
          at: "2026-04-13 11:42",
          status: "success",
          summary: "接收到 build-failure 事件，已定位到 test 阶段超时。"
        },
        {
          at: "2026-04-12 18:05",
          status: "success",
          summary: "接收到 deployment-failure 事件，已提醒负责人回滚。"
        }
      ]
    },
    recent_runs: [
      {
        triggered_at: "2026-04-13 11:42",
        result: "success",
        summary: "已生成失败原因、影响范围和建议修复步骤。"
      },
      {
        triggered_at: "2026-04-12 18:05",
        result: "success",
        summary: "发布回滚建议已发送给值班同学。"
      }
    ]
  },
  {
    id: "auto-poll-api-drift",
    name: "价格接口变更检查",
    description: "定期拉取价格接口响应，对比字段和值变化后通知商品运营。",
    trigger_type: "event",
    trigger_mode: "poll",
    trigger_summary: "Poll（接口变化检查）",
    last_run_at: "2026-04-13 08:30",
    last_run_status: "failed",
    enabled: false,
    agent_id: "agent-api-watch",
    instruction:
      "检查价格接口字段和值变化；若检测到价格状态值变化或折扣比例异常，生成变更摘要并通知商品运营与研发接口人。",
    event_config: {
      source_type: "poll",
      target_name: "价格聚合接口",
      url: "https://api.mock-claw.local/pricing/v1/snapshot",
      frequency: "每 30 分钟",
      detection: "status_change",
      request_method: "GET",
      headers: "Accept: application/json\nX-App: cec-claw",
      auth: "Bearer ************",
      timeout_seconds: "12",
      recent_checks: [
        {
          at: "2026-04-13 08:30",
          status: "failed",
          summary: "接口超时，未获取到本次快照。"
        },
        {
          at: "2026-04-13 08:00",
          status: "success",
          summary: "发现 status 字段由 stable 变为 degraded，已发送预警。"
        }
      ]
    },
    recent_runs: [
      {
        triggered_at: "2026-04-13 08:00",
        result: "success",
        summary: "检测到价格状态变化，已触发运营通知。"
      },
      {
        triggered_at: "2026-04-13 08:30",
        result: "failed",
        summary: "轮询接口超时，未能生成本次检查结果。"
      }
    ]
  }
];
