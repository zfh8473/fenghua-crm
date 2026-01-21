# 批次四（19.5）管理类与设置类 — 备份说明

**备份时间：** 执行 19.5 代码修改前  
**设计规范：** `docs/design-system/pages/admin-settings.md`

## 备份内容

`fenghua-frontend/src/` 下：

- `users/` — UserManagementPage、UserForm、UserList
- `audit-logs/` — AuditLogsPage
- `audit/` — AuditLogDetailDialog、ValueComparison
- `logs/` — SystemLogsPage、ErrorLogsPage、LogsList
- `settings/` — SystemSettingsPage、SettingsForm、DataRetentionStatistics
- `import/` — Customer/Product/InteractionImportPage 及 Import*、MappingPreview、ValidationResults
- `export/` — ExportPage、ExportHistory、ExportProgress、FieldSelector
- `backup/` — BackupStatusPage、BackupStatusPanel
- `restore/` — DataRestorePage、RestoreOperation
- `monitoring/` — SystemMonitoringPage、HealthStatusPanel
- `gdpr/` — GdprExportPage、GdprDeletionPage

## 恢复方式

### 方式一：从本目录复制回退

```bash
# 在项目根目录执行
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/users fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/audit-logs fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/audit fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/logs fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/settings fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/import fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/export fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/backup fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/restore fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/monitoring fenghua-frontend/src/
cp -R _backup/pre-19-5-admin-settings/fenghua-frontend/src/gdpr fenghua-frontend/src/
```

### 方式二：从 Git 标签检出（恢复为打标签时的提交状态）

```bash
git checkout pre-19-5-admin-settings -- fenghua-frontend/src/users fenghua-frontend/src/audit-logs fenghua-frontend/src/audit fenghua-frontend/src/logs fenghua-frontend/src/settings fenghua-frontend/src/import fenghua-frontend/src/export fenghua-frontend/src/backup fenghua-frontend/src/restore fenghua-frontend/src/monitoring fenghua-frontend/src/gdpr
```

**说明：** 方式一基于本备份目录的当前文件；方式二基于打 tag 时的 Git 版本，若之后改过且未提交，两种结果可能不同。
