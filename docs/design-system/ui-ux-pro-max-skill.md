# ui-ux-pro-max-skill 使用说明

**来源：** [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（Epic 19 接入，用于设计系统生成与页面级规范）

---

## 接入方式（已完成）

- **Cursor：** `.cursor/commands/ui-ux-pro-max.md`、`.shared/ui-ux-pro-max/`（通过 `uipro init --ai cursor` 或 `npx uipro-cli init --ai cursor` 安装）
- **验证：** 重启 Cursor 后，在输入框使用 **`/ui-ux-pro-max`** 或输入自然语言 UI/UX 需求，即可触发该技能

---

## 使用方式

### 1. Cursor 内：`/ui-ux-pro-max`

- 在 Cursor 聊天中输入 **`/ui-ux-pro-max`** 加需求，例如：  
  `/ui-ux-pro-max 为 B2B CRM 仪表盘生成一套设计系统（色板、字体、间距）`
- 或直接描述：`Build a landing page for a SaaS product`，技能会自动参与生成

### 2. 命令行：`search.py`（设计系统生成、持久化）

**前置：** 本机需安装 **Python 3.x**（`python3 --version`）。

**路径：** `.shared/ui-ux-pro-max/scripts/search.py`

**示例：**

```bash
# 为 B2B CRM 生成设计系统，项目名 fenghua-crm
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B CRM dashboard" --design-system -p "fenghua-crm"

# 输出为 Markdown
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B CRM dashboard" --design-system -f markdown

# 持久化到 design-system/MASTER.md（若与 docs/design-system 合并，可再手动移动）
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B CRM dashboard" --design-system --persist -p "fenghua-crm"
```

**说明：** `--persist` 会生成 `design-system/MASTER.md`；若项目统一使用 `docs/design-system/`，可将该文件移入 `docs/design-system/` 或合并进 `design-tokens.md` / `ui-design-standards.md`，并注明「由 ui-ux-pro-max-skill 生成并人工校订」。

---

## 与 Epic 19 的约定

- **Story 19.1：** 接入与本说明文档。
- **Story 19.2–19.5：** 每批页面的视觉方案须引用 Pro Max 输出（`/ui-ux-pro-max` 或 `search.py --design-system`），并在 PR 或 `docs/design-system/pages/` 中记录所依据的 Pro Max 规则或片段。

---

## 上游文档

- [ui-ux-pro-max-skill README](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
