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
    { id: "task-001", title: "上海出差报销", status: "completed", active: true, pinned: true },
    { id: "task-002", title: "桌面助手前端设计", status: "awaiting", pinned: true },
    { id: "task-003", title: "华东经营周报整理", status: "running", pinned: false },
    { id: "task-004", title: "Q1 销售复盘报告", status: "idle", pinned: false },
    { id: "task-005", title: "供应商合同摘要", status: "error", pinned: false },
    { id: "task-006", title: "招聘 JD 批量生成", status: "idle", pinned: false },
    { id: "task-007", title: "差旅制度版本对比", status: "completed", pinned: false },
    { id: "task-008", title: "客户拜访纪要归档", status: "awaiting", pinned: false }
  ];

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

  return { steps, planItems, todoItems, artifacts, artifactsAfterDeletion, draftDocumentArtifact, recentTasks, staticAnnotations };
})();

window.DEMO_DATA = DEMO_DATA;
