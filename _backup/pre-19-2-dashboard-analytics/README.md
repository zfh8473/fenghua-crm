# 批次一（19.2 仪表盘与分析页）改代码前备份

**备份时间：** 执行备份命令时  
**用途：** 在 19.2 UI 优化改代码前，保存 `fenghua-frontend/src/dashboard/` 的原始内容，便于随时回滚。

---

## 备份内容

- `fenghua-frontend/src/dashboard/` 完整目录（含 pages、components、services、utils）

---

## 恢复方法

### 方式一：从本目录覆盖恢复（会覆盖当前 dashboard）

```bash
# 在项目根目录执行
rm -rf fenghua-frontend/src/dashboard
cp -r _backup/pre-19-2-dashboard-analytics/fenghua-frontend/src/dashboard fenghua-frontend/src/
```

### 方式二：用 Git 标签恢复（恢复到打标签时的提交状态）

若你打了标签 `pre-19-2-dashboard-analytics`，可只恢复 dashboard 目录：

```bash
git checkout pre-19-2-dashboard-analytics -- fenghua-frontend/src/dashboard
```

或从该标签切出新分支查看旧版：

```bash
git checkout -b temp-restore pre-19-2-dashboard-analytics
# 查看完毕后切回主分支
git checkout main
git branch -D temp-restore
```

---

## 说明

- **文件备份**：保存的是执行备份时磁盘上的文件，包含当时未提交的修改。
- **Git 标签**：`pre-19-2-dashboard-analytics` 指向执行备份时 HEAD 的提交，不包含未提交的修改。若当时有未提交修改且需纳入“可回滚状态”，请先 `git add` 并 `git commit` 后再打标签（或仅依赖本目录的文件备份）。
