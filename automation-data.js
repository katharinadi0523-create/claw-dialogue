window.AUTOMATION_TASKS_MOCK = [
  {
    id: "auto-schedule-daily-brief",
    name: "每日销售简报",
    description: "汇总 CRM 新增线索、成交情况与异常客户，工作日上午推送给销售负责人。",
    trigger_type: "time",
    trigger_mode: "schedule",
    trigger_summary: "每天 09:00",
    last_run_at: "2026-04-13 09:00",
    last_run_status: "success",
    enabled: true,
    agent_id: "agent-sales-ops",
    instruction:
      "统计昨日 18:00 到今日 09:00 的新增线索、成交单和高风险跟进项，生成 300 字以内中文摘要，并附上需要优先处理的客户名单，输出到销售群日报频道。",
    schedule_config: {
      execution_type: "schedule",
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
        triggered_at: "2026-04-13 09:00",
        result: "success",
        summary: "已发送晨报，包含 12 条新增线索与 3 个高风险客户提醒。"
      },
      {
        triggered_at: "2026-04-12 09:00",
        result: "success",
        summary: "日报生成成功，自动附带前一日成交漏斗趋势。"
      },
      {
        triggered_at: "2026-04-11 09:00",
        result: "success",
        summary: "日报按时投递，未发现数据采集异常。"
      }
    ]
  },
  {
    id: "auto-schedule-risk-weekly",
    name: "周一风控巡检",
    description: "每周一检查异常付款、退款激增与审批逾期情况，生成风控复盘清单。",
    trigger_type: "time",
    trigger_mode: "schedule",
    trigger_summary: "每周一 10:00",
    last_run_at: "2026-04-13 10:00",
    last_run_status: "failed",
    enabled: true,
    agent_id: "agent-risk-review",
    instruction:
      "扫描上周交易、退款、审批流与访问日志，找出异常金额、重复退款和超期审批单，输出风控复盘摘要并提醒财务负责人确认。",
    schedule_config: {
      execution_type: "schedule",
      frequency: "weekly",
      weekdays: ["mon"],
      time: "10:00",
      interval_value: 1,
      interval_unit: "day",
      run_at_date: "",
      run_at_time: "",
      effective_from: "",
      effective_until: ""
    },
    recent_runs: [
      {
        triggered_at: "2026-04-13 10:00",
        result: "failed",
        summary: "退款接口返回 502，风控摘要未能生成。"
      },
      {
        triggered_at: "2026-04-06 10:00",
        result: "success",
        summary: "已输出 4 项异常清单并分配给财务团队。"
      },
      {
        triggered_at: "2026-03-30 10:00",
        result: "success",
        summary: "巡检完成，无高优先级异常。"
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
    agent_id: "agent-ops-sync",
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
