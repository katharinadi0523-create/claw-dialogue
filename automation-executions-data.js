/**
 * 自动化任务执行历史（对齐 nexus-platform CLAW_AUTOMATED_TASK_EXECUTIONS_SAMPLE）
 * 由任务 mock 的 recent_runs 展开，并补充若干独立记录。
 */
(function () {
  const DELIVERY_CHANNELS = ["飞书", "蓝信", "钉钉", "企微", "QQ", "AF平台"];
  const tasks = Array.isArray(window.AUTOMATION_TASKS_MOCK) ? window.AUTOMATION_TASKS_MOCK : [];
  const executions = [];
  let seq = 0;

  function padExecutedAt(value) {
    const raw = String(value || "").trim();
    if (!raw) return "—";
    if (/:\d{2}$/.test(raw)) return raw;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(raw)) return `${raw}:00`;
    return raw;
  }

  function normalizeStatus(result) {
    if (result === "failed" || result === "failure") return "failure";
    return "success";
  }

  const CLAW_LABELS = {
    "claw-mine-general": "我的 Claw",
    "claw-af-prd-writer": "PRD 写手",
    "claw-af-cloud-factory": "云码工厂维护专员",
    "claw-af-market": "市场洞察",
    "claw-af-frontend": "前端原型实现",
    "agent-language-coach": "语言教练",
    "agent-morning-boost": "晨间鼓励助手",
    "agent-ops-sync": "库存同步助手",
    "agent-board-pack": "经营周报助手",
    "agent-ci-diagnosis": "CI 诊断助手",
    "agent-api-watch": "接口监测助手",
    "agent-general": "通用 Agent"
  };

  function resolveClawLabel(task) {
    const id = String(task.claw_id || task.agent_id || "").trim();
    if (!id) return "—";
    return CLAW_LABELS[id] || id;
  }

  tasks.forEach((task, taskIndex) => {
    const channel = DELIVERY_CHANNELS[taskIndex % DELIVERY_CHANNELS.length];
    const target = `${channel} / ${task.workspace_name || task.name}`;
    (task.recent_runs || []).forEach((run, runIndex) => {
      if (run.result === "running") return;
      const status = normalizeStatus(run.result);
      executions.push({
        id: `auto-exec-${task.id}-${runIndex}`,
        taskId: task.id,
        taskName: task.name,
        executionClaw: resolveClawLabel(task),
        finalOutput: run.summary || "—",
        status,
        resultSummary:
          status === "failure"
            ? `执行失败：${run.summary || "任务未正常完成。"}`
            : `执行成功：${run.summary || "任务已按计划完成。"}`,
        executedAt: padExecutedAt(run.triggered_at),
        deliveryChannel: channel,
        deliveryTarget: target,
        traceId: `trace-${task.id}-${String(runIndex + 1).padStart(2, "0")}`
      });
      seq += 1;
    });
  });

  const extras = [
    {
      id: "auto-exec-board-pack-20260420-1400",
      taskId: "auto-once-board-pack",
      taskName: "董事会材料预检查",
      executionClaw: "经营周报助手",
      finalOutput: "生成 1 份预检查摘要，包含 4 项缺失附件提醒。",
      status: "failure",
      resultSummary: "执行失败：部分财务指标附件未上传，已保留检查清单。",
      executedAt: "2026-04-20 14:00:23",
      deliveryChannel: "企微",
      deliveryTarget: "企微 / 董事会材料协同群",
      traceId: "trace-auto-board-pack-20260420-1400"
    },
    {
      id: "auto-exec-inventory-20260413-1200",
      taskId: "auto-interval-inventory-sync",
      taskName: "库存同步检查",
      executionClaw: "我的 Claw",
      finalOutput: "正在比对 1,284 个 SKU，同步检查尚未结束。",
      status: "success",
      resultSummary: "执行成功：巡检任务已启动，结果将在完成后推送。",
      executedAt: "2026-04-13 12:00:11",
      deliveryChannel: "钉钉",
      deliveryTarget: "钉钉 / 库存运营群",
      traceId: "trace-auto-inventory-20260413-1200"
    }
  ];

  extras.forEach((item) => {
    if (!executions.some((row) => row.id === item.id)) {
      executions.push(item);
    }
  });

  window.AUTOMATION_EXECUTIONS_MOCK = executions.sort((a, b) => String(b.executedAt).localeCompare(String(a.executedAt)));
})();
