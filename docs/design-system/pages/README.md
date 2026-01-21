# 页面级设计说明（Epic 19）

本目录存放**各批页面优化**的设计约定与 Pro Max 依据，供 19.2–19.5 使用。

## 建议文件

| 文件 | 批次 | 说明 |
|------|------|------|
| `dashboard-analytics.md` | 19.2 | 仪表盘与分析页的约定与 Pro Max 依据 |
| `main-business.md` | 19.3 | 客户、产品、互动的列表/表单/详情 |
| `login-nav-layout.md` | 19.4 | 登录、首页、导航与 MainLayout |
| `admin-settings.md` | 19.5 | 管理类与设置类 |

可选：`*-pro-max.md` 存放 `search.py --design-system` 的原始输出，便于追溯。

## 各文件至少应包含

- 本批涉及的页面与组件
- 所依据的 Pro Max 输出（`/ui-ux-pro-max` 概要或 `search.py` 命令及产出）
- 相对 `MASTER.md` 的差异（若无则写「与 MASTER 一致」）

详见 [页面优化操作指南](../page-optimization-guide.md)。
