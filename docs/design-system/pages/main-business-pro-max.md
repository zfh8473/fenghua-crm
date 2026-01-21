# 批次二（19.3）Pro Max 原始输出

由 **ui-ux-pro-max-skill** 生成并人工校订；本文件仅供依据追溯，正式约定见 [main-business.md](./main-business.md)。

---

## 1. `search.py "B2B CRM list form detail table" --design-system -p "fenghua-crm" -f markdown`

- **Pattern:** Comparison Table + CTA（本批未采用，改采自定 list/form/detail 约定）
- **Style:** Trust & Authority — certificates, expert credentials, case studies, security badges；Performance ⚡ Excellent | Accessibility ✓ WCAG AAA
- **Colors:** Primary #0F172A, Secondary #334155, CTA #0369A1, Background #F8FAFC, Text #020617（与 MASTER 一致）
- **Typography:** Plus Jakarta Sans（本批采用 MASTER 的 Fira Code / Fira Sans 以统一）
- **Key Effects:** Badge hover, metric pulse, smooth stat reveal
- **Avoid:** Playful, hidden credentials, AI purple/pink gradients
- **Pre-Delivery:** 无 emoji、cursor-pointer、hover 150–300ms、对比度 4.5:1、焦点、prefers-reduced-motion、375/768/1024/1440

---

## 2. `search.py "CRM data table list detail record" --design-system -p "fenghua-crm" -f markdown`

- **Style:** Data-Dense Dashboard — multiple charts, data tables, KPI cards, minimal padding, grid, space-efficient
- **Colors:** Primary #2563EB, Secondary #3B82F6, CTA #F97316（本批不采用，沿用 MASTER uipro-*）
- **Typography:** Fira Code + Fira Sans（与 MASTER 一致，本批采用）
- **Key Effects:** Hover tooltips, chart zoom, row highlighting, smooth filter animations, data loading spinners
- **Avoid:** Ornate design, No filtering（本批采纳：列表必须提供筛选）

---

## 3. `search.py "form label validation accessible" --domain ux`

- Input Labels：每输入有 visible label（above/beside），不用 placeholder 当唯一标签
- Inline Validation：onBlur 校验为主，不仅提交时校验
- Submit Feedback：Loading → Success/Error，不无反馈
- ARIA Labels：图标按钮加 aria-label
- Keyboard Navigation：Tab 顺序合理、无 trap
- Form Labels：`<label for="...">` 或 wrap input

---

## 4. `search.py "table form layout" --stack html-tailwind`

- Responsive padding：`px-4 md:px-6 lg:px-8`，不同断点不同
- Text truncation：`truncate`、`line-clamp-*`
- Grid gaps：`gap-4`、`gap-6`、`gap-8`，少用单侧 margin
- Flexbox：`items-center`、`justify-between`，少嵌套
- `shrink-0`、`size-*` 等 Tailwind 用法
