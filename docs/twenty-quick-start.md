# Twenty CRM 快速开始指南

**项目：** fenghua-crm  
**目标：** 快速部署并开始评估 Twenty CRM

---

## 🚀 快速部署（5 分钟）

### 方式 1：使用部署脚本（推荐）

```bash
# 运行部署脚本
./scripts/deploy-twenty.sh
```

脚本会自动：
- 检查前置条件
- 克隆或更新 Twenty 仓库
- 根据你的选择进行 Docker 或本地部署
- 提供访问地址和下一步指引

### 方式 2：手动部署

#### Docker 部署（最快）

```bash
# 1. 克隆仓库
cd ~/Documents/GitHub
git clone https://github.com/twentyhq/twenty.git
cd twenty

# 2. 启动服务
docker-compose up -d

# 3. 访问
# 前端: http://localhost:3000
# GraphQL: http://localhost:3000/graphql
```

#### 本地开发环境

```bash
# 1. 克隆仓库
cd ~/Documents/GitHub
git clone https://github.com/twentyhq/twenty.git
cd twenty

# 2. 安装依赖
yarn install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，设置数据库和 Redis 连接

# 4. 运行迁移
yarn prisma migrate deploy
yarn prisma generate

# 5. 启动服务
yarn dev
```

---

## 📋 评估流程

### 第一步：功能测试（1-2 小时）

1. **访问前端界面**
   - 打开 http://localhost:3000
   - 创建测试账户或使用默认账户登录

2. **测试核心功能**
   - 添加测试客户数据
   - 测试联系人管理
   - 检查多语言支持
   - 查看 GraphQL API

3. **记录初步印象**
   - 界面易用性
   - 功能完整性
   - 性能表现

### 第二步：深度评估（3-5 小时）

参考 `docs/twenty-evaluation-checklist.md` 进行详细评估：

1. **功能适配性**
   - 客户信息管理
   - 联系人管理
   - AI 客户分析
   - 多语言支持

2. **技术适配性**
   - 技术栈匹配度
   - 代码质量
   - 可扩展性
   - 性能

3. **定制开发评估**
   - AI 集成可行性
   - 多语言定制需求
   - 下一阶段扩展（订单/合同管理）

### 第三步：决策（1 小时）

根据评估结果：
- 填写评估清单总结
- 做出最终决策
- 制定下一步行动计划

---

## 📚 相关文档

- **部署指南：** `docs/twenty-deployment-guide.md`
- **评估清单：** `docs/twenty-evaluation-checklist.md`
- **部署脚本：** `scripts/deploy-twenty.sh`

---

## 🔗 有用链接

- [Twenty GitHub](https://github.com/twentyhq/twenty)
- [Twenty 文档](https://twenty.com/docs)
- [GraphQL Playground](http://localhost:3000/graphql) (部署后访问)

---

## ❓ 常见问题

**Q: 部署失败怎么办？**  
A: 查看 `docs/twenty-deployment-guide.md` 中的"常见问题排查"部分

**Q: 如何查看日志？**  
A: Docker 方式：`docker-compose logs -f`  
   本地方式：查看终端输出

**Q: 如何停止服务？**  
A: Docker 方式：`docker-compose down`  
   本地方式：按 Ctrl+C

---

**开始评估吧！** 🎉

