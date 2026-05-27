(function () {
  const FILE_WORKSPACE_DETAIL = {
    workspaceStorageConfig: {
      volumeDisplayName: "GF专用存储卷",
      volumeDescription: "办公虾工作空间默认绑定的项目存储卷。",
      volumeName: "s3://juicefs-vol-001",
      subdirectory: "claw-office-shrimp",
      organizationName: "综合办公中心",
      projectName: "企业办公入口",
      volumeTotalGb: 8000,
      volumeAvailableGb: 4440,
      workspaceUsedGb: 182.4,
      workspaceQuotaGb: null
    },
    workspaceRoot: {
      id: "workspace",
      name: "workspace",
      kind: "folder",
      description: "办公虾主目录，承载组织共享、用户资料、记忆与执行产物。",
      children: [
        {
          id: "core",
          name: "core",
          kind: "folder",
          description: "Claw 核心身份和行为文件。",
          children: [
            {
              id: "core-identity-md",
              name: "identity.md",
              kind: "file",
              sizeLabel: "1.3 KB",
              updatedAt: "2026-04-06 08:20",
              updatedBy: "产品运营 陈昭",
              description: "Claw 身份定义。"
            },
            {
              id: "core-bootstrap-md",
              name: "bootstrap.md",
              kind: "file",
              sizeLabel: "0.9 KB",
              updatedAt: "2026-04-06 08:20",
              updatedBy: "产品运营 陈昭",
              description: "启动说明与初始化指令。"
            },
            {
              id: "core-rules-md",
              name: "rules.md",
              kind: "file",
              sizeLabel: "1.1 KB",
              updatedAt: "2026-04-06 08:20",
              updatedBy: "产品运营 陈昭",
              description: "行为边界与执行规则。"
            },
            {
              id: "core-manifest-json",
              name: "manifest.json",
              kind: "file",
              sizeLabel: "3 KB",
              updatedAt: "2026-04-06 08:20",
              updatedBy: "系统",
              description: "工作空间元信息，不建议直接编辑。"
            }
          ]
        },
        {
          id: "users",
          name: "users",
          kind: "folder",
          description: "企业办公用户目录，每个用户单独沉淀资料与偏好。",
          children: [
            {
              id: "users-liran",
              name: "li-ran",
              kind: "folder",
              children: [
                {
                  id: "users-liran-profile",
                  name: "profile.md",
                  kind: "file",
                  sizeLabel: "12 KB",
                  updatedAt: "2026-04-06 09:58",
                  updatedBy: "办公虾",
                  description: "李然的常用报销偏好、默认成本中心和审批路径。"
                },
                {
                  id: "users-liran-preferences",
                  name: "preferences.md",
                  kind: "file",
                  sizeLabel: "4 KB",
                  updatedAt: "2026-04-06 09:58",
                  updatedBy: "办公虾"
                },
                {
                  id: "users-liran-context",
                  name: "context.md",
                  kind: "file",
                  sizeLabel: "6 KB",
                  updatedAt: "2026-04-06 09:58",
                  updatedBy: "办公虾"
                }
              ]
            },
            {
              id: "users-zhouning",
              name: "zhou-ning",
              kind: "folder",
              children: [
                {
                  id: "users-zhouning-profile",
                  name: "profile.md",
                  kind: "file",
                  sizeLabel: "10 KB",
                  updatedAt: "2026-04-06 09:08",
                  updatedBy: "办公虾"
                },
                {
                  id: "users-zhouning-preferences",
                  name: "preferences.md",
                  kind: "file",
                  sizeLabel: "3 KB",
                  updatedAt: "2026-04-06 09:08",
                  updatedBy: "办公虾"
                },
                {
                  id: "users-zhouning-context",
                  name: "context.md",
                  kind: "file",
                  sizeLabel: "4 KB",
                  updatedAt: "2026-04-06 09:08",
                  updatedBy: "办公虾"
                }
              ]
            }
          ]
        },
        {
          id: "memory",
          name: "memory",
          kind: "folder",
          description: "组织级、项目级和个人级记忆分层存储。",
          children: [
            {
              id: "memory-org",
              name: "org",
              kind: "folder",
              children: [
                {
                  id: "memory-org-memory",
                  name: "memory.md",
                  kind: "file",
                  sizeLabel: "96 KB",
                  updatedAt: "2026-04-05 18:10",
                  updatedBy: "财务共享中心",
                  description: "组织统一差旅制度与费用标准。"
                }
              ]
            },
            {
              id: "memory-claw",
              name: "claw",
              kind: "folder",
              children: [
                {
                  id: "memory-claw-memory",
                  name: "memory.md",
                  kind: "file",
                  sizeLabel: "18 KB",
                  updatedAt: "2026-04-06 10:14",
                  updatedBy: "办公虾",
                  description: "当前 Claw 的专属长期记忆。"
                }
              ]
            },
            {
              id: "memory-users",
              name: "users",
              kind: "folder",
              children: [
                {
                  id: "memory-users-liran",
                  name: "li-ran",
                  kind: "folder",
                  children: [
                    {
                      id: "memory-users-liran-memory",
                      name: "memory.md",
                      kind: "file",
                      sizeLabel: "18 KB",
                      updatedAt: "2026-04-06 10:14",
                      updatedBy: "办公虾",
                      description: "本次差旅报销过程中的偏好与确认记录。"
                    }
                  ]
                }
              ]
            },
            {
              id: "memory-sessions",
              name: "sessions",
              kind: "folder",
              children: [
                {
                  id: "memory-session-office-shrimp-expense",
                  name: "office-shrimp-expense",
                  kind: "folder",
                  children: [
                    {
                      id: "memory-session-office-shrimp-expense-memory",
                      name: "memory.md",
                      kind: "file",
                      sizeLabel: "9 KB",
                      updatedAt: "2026-04-06 10:14",
                      updatedBy: "办公虾"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "shared",
          name: "shared",
          kind: "folder",
          description: "项目和组织共享文件。",
          children: [
            {
              id: "shared-templates",
              name: "templates",
              kind: "folder",
              children: [
                {
                  id: "shared-template-expense",
                  name: "expense-form-template.xlsx",
                  kind: "file",
                  sizeLabel: "248 KB",
                  updatedAt: "2026-04-01 14:22",
                  updatedBy: "财务共享中心"
                }
              ]
            },
            {
              id: "shared-documents",
              name: "documents",
              kind: "folder",
              children: []
            },
            {
              id: "shared-examples",
              name: "examples",
              kind: "folder",
              children: []
            }
          ]
        },
        {
          id: "sessions",
          name: "sessions",
          kind: "folder",
          description: "会话上传、过程文件与最终结果。",
          children: [
            {
              id: "sessions-office-shrimp-expense",
              name: "office-shrimp-expense",
              kind: "folder",
              children: [
                {
                  id: "sessions-office-shrimp-expense-attachments",
                  name: "attachments",
                  kind: "folder",
                  children: []
                },
                {
                  id: "sessions-office-shrimp-expense-intermediate",
                  name: "intermediate",
                  kind: "folder",
                  children: []
                },
                {
                  id: "sessions-office-shrimp-expense-final",
                  name: "final",
                  kind: "folder",
                  children: [
                    {
                      id: "sessions-final-bx",
                      name: "报销申请表.pdf",
                      kind: "file",
                      sizeLabel: "428 KB",
                      updatedAt: "2026-04-06 10:14",
                      updatedBy: "办公虾",
                      description: "差旅报销最终交付件。"
                    },
                    {
                      id: "sessions-final-attachments",
                      name: "附件清单.xlsx",
                      kind: "file",
                      sizeLabel: "84 KB",
                      updatedAt: "2026-04-06 10:14",
                      updatedBy: "办公虾",
                      description: "附件明细与核验状态。"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "output",
          name: "output",
          kind: "folder",
          description: "自动化任务和会话执行产物。",
          children: [
            {
              id: "output-tasks",
              name: "tasks",
              kind: "folder",
              children: []
            },
            {
              id: "output-automations",
              name: "automations",
              kind: "folder",
              children: [
                {
                  id: "output-automation-run-20260406-1800",
                  name: "automation-run-20260406-1800",
                  kind: "folder",
                  children: [
                    {
                      id: "output-reminder-20260406",
                      name: "pending-materials-2026-04-06.md",
                      kind: "file",
                      sizeLabel: "28 KB",
                      updatedAt: "2026-04-06 09:08",
                      updatedBy: "办公虾"
                    }
                  ]
                }
              ]
            },
            {
              id: "output-exports",
              name: "exports",
              kind: "folder",
              children: [
                {
                  id: "output-approval-bx",
                  name: "BX-20260406-018.json",
                  kind: "file",
                  sizeLabel: "9 KB",
                  updatedAt: "2026-04-06 10:14",
                  updatedBy: "办公虾",
                  description: "差旅报销审批发起结果回执。"
                }
              ]
            }
          ]
        },
        {
          id: "tmp",
          name: "tmp",
          kind: "folder",
          description: "解析、转换、工具执行产生的临时文件。",
          children: [
            {
              id: "tmp-runtime-office-20260406",
              name: "runtime-office-20260406",
              kind: "folder",
              children: []
            }
          ]
        }
      ]
    }
  };

  window.FILES_DATA = {
    FILE_WORKSPACE_DETAIL
  };
})();
