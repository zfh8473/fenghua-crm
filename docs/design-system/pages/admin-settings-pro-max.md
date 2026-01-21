# 批次四（19.5）Pro Max 原始输出

**说明：** 由 ui-ux-pro-max-skill 生成并人工校订，供 `admin-settings.md` 综合时追溯。

---

## 1. design-system（主命令）

**命令：**
```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B admin settings management" --design-system -p "fenghua-crm" -f markdown
```

**输出摘要：**
- **Pattern:** Feature-Rich Showcase + Trust（与 MASTER 一致）
- **Style:** Trust & Authority；enterprise software；WCAG AAA
- **Colors:** Primary #0F172A, Secondary #334155, CTA #0369A1, Background #F8FAFC, Text #020617（与 MASTER 一致）
- **Typography:** Plus Jakarta Sans（本批与 MASTER 保持一致，采用 Fira Code / Fira Sans）
- **Avoid:** Playful, Hidden credentials, AI purple/pink gradients
- **Pre-Delivery:** 无 emoji 图标、cursor-pointer、hover 150–300ms、对比度 4.5:1、焦点可见、prefers-reduced-motion、响应式 375/768/1024/1440

---

## 2. ux（table / admin / density）

**命令：**
```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "table density admin data" --domain ux -n 6
```

**要点：**
- **Table Handling:** 表格易溢出；用 `overflow-x-auto` 包裹；移动端可考虑卡片布局
- **Bulk Actions:** 支持多选 + 批量操作；Checkbox 列 + 操作栏；避免只能单行操作

---

## 3. ux（progress / status / warning / danger）

**命令：**
```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "progress status warning danger" --domain ux -n 6
```

**要点：**
- **Progress Indicators:** 多步骤流程需进度（步骤 2/4 或进度条）
- **Submit Feedback:** 提交后 Loading → Success/Error，不可无反馈
- **Loading Indicators:** 操作 >300ms 需 skeleton/spinner，不可冻结界面

---

## 4. ux（form / labels）

**命令：**
```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "form group settings" --domain ux -n 4
```

**要点：**
- **Form Labels:** 每 input 有 `<label for="id">` 或包裹，不可仅 placeholder
- **Submit Feedback:** 同上

---

## 5. 与 MASTER 的协调

- **色板、Avoid、Pre-Delivery：** 与 [MASTER.md](../MASTER.md) 一致；优先 `uipro-*`、`semantic-*`
- **字体：** 沿用 MASTER 的 Fira Code / Fira Sans
- **本批强调：** 管理类信息密度高，需在数据密集与可读性之间平衡；**危险操作**（删除、覆盖、GDPR 删除等）需明确视觉层级（`semantic-error`、确认弹窗）
