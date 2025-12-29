# Docker 安装指南

**项目：** fenghua-crm  
**目的：** 安装 Docker 以支持 Twenty CRM 的 Docker 部署

---

## 🍎 macOS 安装 Docker

### 方式 1：使用 Homebrew（推荐）

**步骤：**

1. **打开终端**，运行以下命令：
   ```bash
   brew install --cask docker
   ```

2. **输入管理员密码**（如果需要）

3. **等待安装完成**

4. **启动 Docker Desktop**
   - 打开"应用程序"文件夹
   - 双击 "Docker" 图标
   - 首次启动需要一些时间来完成初始化

5. **验证安装**
   ```bash
   docker --version
   docker-compose --version
   ```

---

### 方式 2：从官网下载

**步骤：**

1. **访问 Docker 官网**
   - 打开：https://www.docker.com/products/docker-desktop/
   - 或直接访问：https://desktop.docker.com/mac/main/arm64/Docker.dmg

2. **下载 Docker Desktop**
   - 选择适合你 Mac 的版本（Apple Silicon 或 Intel）

3. **安装**
   - 打开下载的 `.dmg` 文件
   - 将 `Docker.app` 拖到 `Applications` 文件夹

4. **启动 Docker Desktop**
   - 从"应用程序"文件夹启动 Docker
   - 首次启动需要完成初始化设置

5. **验证安装**
   ```bash
   docker --version
   docker-compose --version
   ```

---

## ✅ 安装验证

安装完成后，运行以下命令验证：

```bash
# 检查 Docker 版本
docker --version
# 应该显示类似：Docker version 24.x.x

# 检查 Docker Compose 版本
docker-compose --version
# 应该显示类似：Docker Compose version v2.x.x

# 测试 Docker 是否运行
docker ps
# 应该显示容器列表（可能为空）
```

---

## 🚀 启动 Docker Desktop

**重要：** 在使用 Docker 之前，必须启动 Docker Desktop 应用程序。

1. 打开"应用程序"文件夹
2. 双击 "Docker" 图标
3. 等待 Docker 图标出现在菜单栏（顶部状态栏）
4. 当图标显示为运行状态时，Docker 已准备就绪

---

## 🐛 常见问题

### 问题 1：Docker 命令未找到

**解决方案：**
- 确保 Docker Desktop 已启动
- 重启终端
- 检查 PATH 环境变量

### 问题 2：Docker Desktop 无法启动

**解决方案：**
- 检查系统要求（macOS 10.15 或更高版本）
- 重启 Mac
- 查看 Docker Desktop 的错误日志

### 问题 3：权限问题

**解决方案：**
- 确保有管理员权限
- 检查系统偏好设置中的安全设置

---

## 📝 下一步

Docker 安装完成后：

1. **验证安装**（运行上面的验证命令）
2. **启动 Docker Desktop**
3. **继续部署 Twenty CRM**
   ```bash
   ./scripts/deploy-twenty.sh
   ```

---

## 🔗 相关资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- [Docker Compose 文档](https://docs.docker.com/compose/)

---

**安装完成后，请告诉我，我们可以继续部署 Twenty CRM！** 🚀

