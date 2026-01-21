# 备份说明：19.4 登录、首页、导航与布局 修改前

**对应：** Epic 19 Story 19.4（批次三）  
**备份时间：** 修改前  
**用途：** 若 19.4 优化效果不满意，可由此恢复。

## 备份内容

- `fenghua-frontend/src/auth/`（LoginPage、AuthContext、ProtectedRoute、RoleProtectedRoute 等）
- `fenghua-frontend/src/App.tsx`（含 HomePage）
- `fenghua-frontend/src/components/layout/`（MainLayout、TopNavigation、index）

## 恢复方式

### 方式一：按文件覆盖

从本目录对应路径复制回 `fenghua-frontend/src/`：

```bash
cp -R _backup/pre-19-4-login-nav-layout/fenghua-frontend/src/auth fenghua-frontend/src/
cp _backup/pre-19-4-login-nav-layout/fenghua-frontend/src/App.tsx fenghua-frontend/src/
cp -R _backup/pre-19-4-login-nav-layout/fenghua-frontend/src/components/layout fenghua-frontend/src/components/
```

### 方式二：Git 检出

```bash
git checkout pre-19-4-login-nav-layout -- fenghua-frontend/src/auth fenghua-frontend/src/App.tsx fenghua-frontend/src/components/layout
```

**说明：** 文件备份为备份当时的磁盘状态；Git 标签为备份当时的提交状态，二者可能略有差异。
