# 批次三（19.4）Pro Max 原始输出

**说明：** 由 ui-ux-pro-max-skill 生成并人工校订，供 `login-nav-layout.md` 综合时追溯。

---

## 1. design-system（主命令）

**命令：**
```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "B2B enterprise login navigation layout" --design-system -p "fenghua-crm" -f markdown
```

**输出摘要：**
- **Pattern:** Enterprise Gateway — CTA: Contact Sales (Primary) + Login (Secondary)；色板 Corporate: Navy/Grey。
- **Style:** Trust & Authority；Healthcare/enterprise/financial；WCAG AAA。
- **Colors:** Primary #0F172A, Secondary #334155, CTA #0369A1, Background #F8FAFC, Text #020617（与 MASTER 一致）。
- **Typography:** Plus Jakarta Sans（本批与 MASTER 保持一致，采用 Fira Code / Fira Sans）。
- **Avoid:** Playful, Hidden credentials, AI purple/pink gradients.
- **Pre-Delivery:** 无 emoji 图标、cursor-pointer、hover 150–300ms、对比度 4.5:1、焦点可见、prefers-reduced-motion、响应式 375/768/1024/1440。

---

## 2. landing（login / form）

**命令：**
```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "login form auth enterprise" --domain landing -n 6
```

**要点：**
- **Enterprise Gateway:** Login 作为 Secondary CTA；表单简洁、高对比白底。
- **Lead Magnet + Form:** Form 字段 ≤3 更佳；Input 浅边框 #CCCCCC；CTA 用品牌色；提交后 Loading → Success/Error。
- **Form:** 白底、输入框轻边框、CTA 品牌色。

---

## 3. ux（navigation / layout）

**命令：**
```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "sidebar top navigation responsive" --domain ux -n 6
```

**要点：**
- **Sticky Navigation:** 固定顶栏不得遮挡内容；`padding-top` = 导航高度（如 `pt-20` 若 `h-20`）。
- **Horizontal Scroll:** 避免横向滚动；`max-w-full overflow-x-hidden`。
- **Keyboard Navigation:** 全部可键盘操作；Tab 顺序与视觉一致；无键盘陷阱。
- **Breadcrumbs:** 3+ 层级时使用；本系统若未用可略。

---

## 4. ux（form / focus / label）

**命令：**
```bash
python3 .shared/ui-ux-pro-max/scripts/search.py "focus form label accessibility" --domain ux -n 4
```

**要点：**
- **Form Labels:** 每个 input 有 `<label for="id">` 或包裹，不可仅用 placeholder。
- **Focus States:** 键盘用户需可见 focus ring；`focus:ring-2 focus:ring-*`；不可 `outline-none` 且无替代。
- **Submit Feedback:** 提交后 Loading → Success/Error，不可无反馈。

---

## 5. 与 MASTER 的协调

- **色板、Avoid、Pre-Delivery：** 与 [MASTER.md](../MASTER.md) 一致；优先 `uipro-*`，**不引入紫/粉**（含 `primary-purple` 渐变）。
- **字体：** 沿用 MASTER 的 Fira Code / Fira Sans，不采用本次 design-system 的 Plus Jakarta Sans。
