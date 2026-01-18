# Twenty CRM 代码清理报告

**日期：** 2026-01-14  
**项目：** fenghua-crm  
**目的：** 检查代码中仍在使用 Twenty CRM 的地方

---

## 📋 检查结果总结

### ✅ 前端代码
**状态：** 未使用 Twenty CRM

- `fenghua-frontend/src/services/twenty-api/twenty-api.ts` - 定义了 API 客户端，但**未被任何组件或服务导入使用**
- 可以安全删除

### ⚠️ 后端代码
**状态：** 仍有部分使用 Twenty CRM

#### 1. BackupService（正在使用）

**位置：** `fenghua-backend/src/backup/backup.service.ts`

**使用情况：**
- `getWorkspaceId(token)` 方法使用 `twentyClient.executeQueryWithToken` 从 Twenty CRM 获取 workspace ID
- `scheduledBackup()` 方法使用 `TWENTY_SERVICE_TOKEN` 或 `TWENTY_API_TOKEN` 环境变量
- `executeBackup(token)` 方法调用 `getWorkspaceId(token)`

**影响：**
- 备份功能依赖 Twenty CRM 来获取 workspace ID
- 如果不移除，部署时需要配置 `TWENTY_API_URL` 和 `TWENTY_API_TOKEN`

**建议：**
- 移除对 Twenty CRM 的依赖，改为从 JWT token 中解析 workspace ID（参考 `AttachmentsService` 的实现）
- 或者使用系统配置中的默认 workspace ID

#### 2. TwentyClientModule（被导入但仅用于备份）

**位置：** 
- `fenghua-backend/src/app.module.ts` - 导入 `TwentyClientModule`
- `fenghua-backend/src/backup/backup.module.ts` - 导入 `TwentyClientModule`

**使用情况：**
- 仅在 `BackupService` 中使用
- 如果移除 `BackupService` 中的 Twenty CRM 依赖，可以完全移除 `TwentyClientModule`

#### 3. AttachmentsService（已迁移）

**位置：** `fenghua-backend/src/attachments/attachments.service.ts`

**状态：** ✅ 已移除 Twenty CRM 依赖
- `getWorkspaceId` 方法使用 JWT token 解析，不依赖 Twenty CRM
- 可以作为参考实现

---

## 🔧 需要清理的代码

### 高优先级（影响部署）

1. **BackupService.getWorkspaceId()**
   - 移除 `twentyClient.executeQueryWithToken` 调用
   - 改为从 JWT token 解析或使用配置的默认值

2. **BackupService.scheduledBackup()**
   - 移除 `TWENTY_SERVICE_TOKEN` 和 `TWENTY_API_TOKEN` 环境变量依赖
   - 使用系统配置的 token 或服务账户

### 中优先级（代码清理）

3. **移除 TwentyClientModule**
   - 从 `app.module.ts` 移除导入
   - 从 `backup.module.ts` 移除导入
   - 删除 `TwentyClientService` 和 `TwentyClientModule` 文件

4. **删除前端 twenty-api**
   - 删除 `fenghua-frontend/src/services/twenty-api/` 目录
   - 删除相关的 README 文件

### 低优先级（注释和文档）

5. **清理注释中的 Twenty CRM 引用**
   - `fenghua-backend/src/products/products.service.ts` - TODO 注释中提到 Twenty CRM
   - `fenghua-backend/src/roles/dto/role-response.dto.ts` - 注释中提到 Twenty CRM role ID

---

## 📝 清理步骤建议

### 步骤 1: 修复 BackupService（必须）

**目标：** 移除 BackupService 对 Twenty CRM 的依赖

**实现方案：**

```typescript
// 在 backup.service.ts 中
async getWorkspaceId(token: string): Promise<string> {
  try {
    // 方案 1: 从 JWT token 解析（推荐）
    const workspaceId = this.extractWorkspaceIdFromToken(token);
    if (workspaceId) {
      return workspaceId;
    }

    // 方案 2: 使用默认配置
    const defaultWorkspaceId = this.configService.get<string>('DEFAULT_WORKSPACE_ID');
    if (defaultWorkspaceId) {
      this.logger.warn('Using default workspace ID from config');
      return defaultWorkspaceId;
    }

    throw new BadRequestException('无法从 token 中获取工作空间ID');
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    this.logger.error('Failed to get workspace ID', error);
    throw new BadRequestException('获取工作空间ID失败');
  }
}

// 添加 JWT token 解析方法（参考 AttachmentsService）
private extractWorkspaceIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.workspaceId || decoded?.workspace_id || null;
  } catch (error) {
    return null;
  }
}
```

**修改 scheduledBackup 方法：**

```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)
async scheduledBackup(): Promise<void> {
  this.logger.log('Starting scheduled backup...');

  try {
    const settings = await this.settingsService.getAllSettings();
    
    // 使用系统配置的 token 或服务账户 token
    const serviceToken = this.configService.get<string>('BACKUP_SERVICE_TOKEN');
    
    if (!serviceToken) {
      this.logger.warn('No service token configured for scheduled backup');
      return;
    }

    await this.executeBackup(serviceToken);
    this.logger.log('Scheduled backup completed successfully');
  } catch (error) {
    this.logger.error('Scheduled backup failed', error);
  }
}
```

### 步骤 2: 移除 TwentyClientModule（推荐）

1. 从 `app.module.ts` 移除 `TwentyClientModule` 导入
2. 从 `backup.module.ts` 移除 `TwentyClientModule` 导入
3. 删除 `fenghua-backend/src/services/twenty-client/` 目录

### 步骤 3: 删除前端代码（推荐）

1. 删除 `fenghua-frontend/src/services/twenty-api/` 目录

### 步骤 4: 清理注释（可选）

1. 更新 `products.service.ts` 中的 TODO 注释
2. 更新 `role-response.dto.ts` 中的注释

---

## ⚠️ 风险评估

### 高风险
- **BackupService** - 如果部署时没有配置 Twenty CRM 环境变量，定时备份功能会失败
- **影响：** 备份功能不可用

### 低风险
- **前端代码** - 未使用，删除不影响功能
- **注释** - 不影响功能，但可能造成混淆

---

## ✅ 清理检查清单

### 必须完成（影响部署）

- [ ] 修复 `BackupService.getWorkspaceId()` 方法
- [ ] 修复 `BackupService.scheduledBackup()` 方法
- [ ] 更新备份相关的单元测试

### 推荐完成（代码清理）

- [ ] 从 `app.module.ts` 移除 `TwentyClientModule`
- [ ] 从 `backup.module.ts` 移除 `TwentyClientModule`
- [ ] 删除 `TwentyClientService` 和 `TwentyClientModule` 文件
- [ ] 删除前端 `twenty-api` 目录

### 可选完成（代码质量）

- [ ] 清理注释中的 Twenty CRM 引用
- [ ] 更新相关文档

---

## 🔗 参考实现

可以参考 `AttachmentsService.getWorkspaceId()` 的实现方式：

```typescript
// fenghua-backend/src/attachments/attachments.service.ts
private async getWorkspaceId(token: string): Promise<string> {
  try {
    // Extract workspace ID from JWT payload
    const workspaceId = this.extractWorkspaceIdFromToken(token);
    if (workspaceId) {
      return workspaceId;
    }

    // Fallback: Use default workspace (for development/testing only)
    const defaultWorkspaceId = this.configService.get<string>('DEFAULT_WORKSPACE_ID');
    if (defaultWorkspaceId) {
      this.logger.warn('Using default workspace ID from config');
      return defaultWorkspaceId;
    }

    throw new BadRequestException('无法从 token 中获取工作空间ID');
  } catch (error) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    this.logger.error('Failed to get workspace ID', error);
    throw new BadRequestException('获取工作空间ID失败');
  }
}
```

---

## 📊 清理优先级

| 优先级 | 项目 | 影响 | 工作量 |
|--------|------|------|--------|
| 🔴 高 | 修复 BackupService | 部署失败 | 1-2小时 |
| 🟡 中 | 移除 TwentyClientModule | 代码清理 | 30分钟 |
| 🟡 中 | 删除前端 twenty-api | 代码清理 | 10分钟 |
| 🟢 低 | 清理注释 | 代码质量 | 15分钟 |

---

**报告版本：** 1.0  
**最后更新：** 2026-01-14
