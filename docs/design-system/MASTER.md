# 设计系统 MASTER（Epic 19 参考）

**来源：** 由 **ui-ux-pro-max-skill** 生成并人工校订。  
**生成命令：** `python3 .shared/ui-ux-pro-max/scripts/search.py "B2B CRM dashboard" --design-system -p "fenghua-crm" -f markdown`  
**用途：** Epic 19 全站 UI 优化时，作为色板、字体、间距、反模式与 Pre-delivery 清单的参考；Token 落地点到 `tailwind.config.ts` / `theme.ts` 时与本文件及现有 `design-tokens.md`、`theme.ts` 协调。

---

## 与现有体系的关系

- 现有 `theme.ts`、`design-tokens.md` 为 **Monday**、**Linear + Data-Dense Minimalism** 等既有风格。
- 本 MASTER 为 Pro Max 对 **B2B CRM / 仪表盘** 的推荐，供 Epic 19 的 Task 19.1（Token 落地）与 19.2–19.5（页面优化）使用。
- Token 落地时：可**扩展**现有 Token、或**部分覆盖**；若废弃旧 Token，会在 `docs/design-system/` 中注明迁移说明。

---

## Pattern

- **Name:** Feature-Rich Showcase + Trust
- **CTA Placement:** Above fold
- **Sections:** Hero > Features > CTA

---

## Style

- **Name:** Trust & Authority
- **Keywords:** Certificates/badges displayed, expert credentials, case studies with metrics, before/after comparisons, industry recognition, security badges
- **Best For:** Healthcare/medical landing pages, financial services, enterprise software, premium/luxury products, legal services
- **Performance:** ⚡ Excellent | **Accessibility:** ✓ WCAG AAA

---

## Colors

| Role       | Hex     |
|-----------|---------|
| Primary   | #0F172A |
| Secondary | #334155 |
| CTA       | #0369A1 |
| Background| #F8FAFC |
| Text      | #020617 |

*Notes: Professional blue + neutral grey*

---

## Typography

- **Heading:** Fira Code
- **Body:** Fira Sans
- **Mood:** dashboard, data, analytics, code, technical, precise
- **Best For:** Dashboards, analytics, data visualization, admin panels
- **Google Fonts:** https://fonts.google.com/share?selection.family=Fira+Code:wght@400;500;600;700|Fira+Sans:wght@300;400;500;600;700
- **CSS Import:**
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');
  ```

---

## Key Effects

Badge hover effects, metric pulse animations, certificate carousel, smooth stat reveal

---

## Avoid (Anti-patterns)

- Playful design
- Hidden credentials
- AI purple/pink gradients

---

## Pre-Delivery Checklist

- [ ] No emojis as icons (use SVG: Heroicons/Lucide)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard nav
- [ ] prefers-reduced-motion respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
