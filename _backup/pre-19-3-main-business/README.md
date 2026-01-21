# 批次二（19.3）主业务列表/表单/详情 — 改代码前备份

**Story：** 19.3 主业务列表 / 表单 / 详情 UI 优化  
**依据：** [docs/design-system/pages/main-business.md](../docs/design-system/pages/main-business.md)

## 备份范围

- `fenghua-frontend/src/customers/`
- `fenghua-frontend/src/products/`
- `fenghua-frontend/src/product-categories/`
- `fenghua-frontend/src/interactions/`
- `fenghua-frontend/src/attachments/`
- `fenghua-frontend/src/components/ui/`

## 恢复方式

### 从本备份目录恢复（覆盖为备份时磁盘状态）

```bash
# 在项目根执行
rm -rf fenghua-frontend/src/customers fenghua-frontend/src/products fenghua-frontend/src/product-categories fenghua-frontend/src/interactions fenghua-frontend/src/attachments
cp -r _backup/pre-19-3-main-business/fenghua-frontend/src/customers \
      _backup/pre-19-3-main-business/fenghua-frontend/src/products \
      _backup/pre-19-3-main-business/fenghua-frontend/src/product-categories \
      _backup/pre-19-3-main-business/fenghua-frontend/src/interactions \
      _backup/pre-19-3-main-business/fenghua-frontend/src/attachments \
      fenghua-frontend/src/

rm -rf fenghua-frontend/src/components/ui
cp -r _backup/pre-19-3-main-business/fenghua-frontend/src/components/ui fenghua-frontend/src/components/
```

### 从 Git 标签恢复（仅恢复已提交状态）

```bash
git checkout pre-19-3-main-business -- \
  fenghua-frontend/src/customers \
  fenghua-frontend/src/products \
  fenghua-frontend/src/product-categories \
  fenghua-frontend/src/interactions \
  fenghua-frontend/src/attachments \
  fenghua-frontend/src/components/ui
```

## 说明

- **文件备份：** 含未提交改动，与执行备份时磁盘一致。
- **Git 标签 `pre-19-3-main-business`：** 仅含该时刻已提交内容。
