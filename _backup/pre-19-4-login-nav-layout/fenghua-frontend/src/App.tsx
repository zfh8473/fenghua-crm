import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { LoginPage } from './auth/LoginPage'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { UserManagementPage } from './users/UserManagementPage'
import { SystemSettingsPage } from './settings/SystemSettingsPage'
import { SystemMonitoringPage } from './monitoring/SystemMonitoringPage'
import { SystemLogsPage } from './logs/SystemLogsPage'
import { ErrorLogsPage } from './logs/error-logs/ErrorLogsPage'
import { AuditLogsPage } from './audit-logs/AuditLogsPage'
import { BackupStatusPage } from './backup/BackupStatusPage'
import { DataRestorePage } from './restore/DataRestorePage'
import { ProductManagementPage } from './products/ProductManagementPage'
import { ProductCategoryManagementPage } from './product-categories/ProductCategoryManagementPage'
import { ProductCustomerInteractionHistoryPage } from './products/ProductCustomerInteractionHistoryPage'
import { ProductBusinessProcessPage } from './products/ProductBusinessProcessPage'
import { ProductIntegrityValidationPage } from './products/ProductIntegrityValidationPage'
import { CustomerManagementPage } from './customers/CustomerManagementPage'
import { CustomerProductInteractionHistoryPage } from './customers/CustomerProductInteractionHistoryPage'
// import { PersonManagementPage } from './people/PersonManagementPage' // Temporarily commented out - file not found
import { InteractionsPage } from './interactions/pages/InteractionsPage'
import { InteractionCreatePage } from './interactions/pages/InteractionCreatePage'
import { InteractionEditPage } from './interactions/pages/InteractionEditPage'
import { InteractionDetailPage } from './interactions/pages/InteractionDetailPage'
import { CustomerImportPage } from './import/CustomerImportPage'
import { ProductImportPage } from './import/ProductImportPage'
import { InteractionImportPage } from './import/InteractionImportPage'
import { ExportPage } from './export/ExportPage'
import { GdprExportPage } from './gdpr/GdprExportPage'
import { GdprDeletionPage } from './gdpr/GdprDeletionPage'
import { DashboardPage } from './dashboard/pages/DashboardPage'
import { ProductAssociationAnalysisPage } from './dashboard/pages/ProductAssociationAnalysisPage'
import { CustomerAnalysisPage } from './dashboard/pages/CustomerAnalysisPage'
import { SupplierAnalysisPage } from './dashboard/pages/SupplierAnalysisPage'
import { BuyerAnalysisPage } from './dashboard/pages/BuyerAnalysisPage'
import { BusinessTrendAnalysisPage } from './dashboard/pages/BusinessTrendAnalysisPage'
import { TestTailwind } from './components/TestTailwind'
import { Card } from './components/ui'
import './App.css'

import { MainLayout } from './components/layout'

function HomePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin'

  // Get role label in Chinese
  const getRoleLabel = (role: string | null): string => {
    if (!role) return '无角色'
    const roleMap: Record<string, string> = {
      ADMIN: '管理员',
      DIRECTOR: '总监',
      FRONTEND_SPECIALIST: '前端专员',
      BACKEND_SPECIALIST: '后端专员',
    }
    return roleMap[role] || role
  }

  // Quick access modules
  const quickAccessModules = [
    { path: '/users', label: '用户管理', icon: '👥', adminOnly: true },
    { path: '/products', label: '产品管理', icon: '📦', adminOnly: true },
    { path: '/product-categories', label: '类别管理', icon: '🏷️', adminOnly: true },
    { path: '/customers', label: '客户管理', icon: '👔', adminOnly: false },
    { path: '/people', label: '联系人管理', icon: '👤', adminOnly: false },
    { path: '/interactions', label: '互动记录', icon: '💬', adminOnly: false },
    { path: '/customers/import', label: '客户批量导入', icon: '📥', adminOnly: true },
    { path: '/products/import', label: '产品批量导入', icon: '📥', adminOnly: true },
    { path: '/interactions/import', label: '互动记录批量导入', icon: '📥', adminOnly: true },
    { path: '/export', label: '数据导出', icon: '📤', adminOnly: true },
    { path: '/gdpr/export', label: 'GDPR 数据导出', icon: '📋', adminOnly: false },
    { path: '/gdpr/deletion', label: 'GDPR 数据删除', icon: '🗑️', adminOnly: false },
    { path: '/settings', label: '系统设置', icon: '⚙️', adminOnly: true },
    { path: '/monitoring', label: '系统监控', icon: '📊', adminOnly: true },
    { path: '/logs', label: '系统日志', icon: '📝', adminOnly: true },
    { path: '/error-logs', label: '错误日志', icon: '⚠️', adminOnly: true },
    { path: '/audit-logs', label: '审计日志', icon: '🔍', adminOnly: true },
    { path: '/backup', label: '数据备份', icon: '💾', adminOnly: true },
    { path: '/restore', label: '数据恢复', icon: '🔄', adminOnly: true },
  ]

  const visibleModules = quickAccessModules.filter(
    (module) => !module.adminOnly || isAdmin
  )

  return (
    <MainLayout title="">
      <div className="space-y-monday-6">
        {/* Welcome Card - Redesigned */}
        <Card variant="default" className="w-full overflow-hidden">
          <div className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 p-monday-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-monday-6">
              {/* Left: Welcome Message */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-monday-4 mb-monday-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-blue to-primary-purple flex items-center justify-center text-white text-monday-2xl font-semibold shadow-monday-md flex-shrink-0">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-monday-sm text-monday-text-secondary font-medium mb-monday-1">
                      欢迎回来
                    </p>
                    <h1 className="text-monday-2xl font-semibold text-monday-text tracking-tight leading-tight truncate">
                      {user?.email?.split('@')[0] || '用户'}
                    </h1>
                  </div>
                </div>
                <p className="text-monday-sm text-monday-text-secondary mb-monday-4 font-normal truncate">
                  {user?.email}
                </p>
                {user?.role && (
                  <span className="inline-flex items-center px-monday-3 py-monday-1.5 rounded-full text-monday-sm font-semibold bg-primary-blue text-white shadow-monday-sm">
                    {getRoleLabel(user.role)}
                  </span>
                )}
              </div>
              
              {/* Right: Decorative Element (Optional) */}
              <div className="hidden md:block flex-shrink-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-blue/10 to-primary-purple/10 flex items-center justify-center">
                  <span className="text-monday-3xl opacity-30">👋</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Access Modules */}
        <Card variant="default" className="w-full p-monday-6">
          <h2 className="text-monday-2xl font-bold text-monday-text mb-monday-6 tracking-tight">快速访问</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-monday-4">
            {visibleModules.map((module) => (
              <Link
                key={module.path}
                to={module.path}
                className="group block"
              >
                <Card 
                  variant="default" 
                  hoverable 
                  className="p-monday-5 h-full transition-all duration-200 hover:shadow-monday-md border border-gray-200 hover:border-primary-blue/30"
                >
                  <div className="flex items-center gap-monday-4">
                    <div className="text-monday-3xl flex-shrink-0 transition-transform duration-200 group-hover:scale-110">
                      {module.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-monday-base font-semibold text-monday-text mb-monday-1 group-hover:text-primary-blue transition-colors tracking-tight truncate">
                        {module.label}
                      </h3>
                      <p className="text-monday-sm text-monday-text-secondary font-normal">
                        点击进入
                      </p>
                    </div>
                    <div className="text-monday-text-secondary group-hover:text-primary-blue transition-colors flex-shrink-0 text-monday-lg">
                      →
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SystemSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/product-association-analysis"
        element={
          <ProtectedRoute>
            <ProductAssociationAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/customer-analysis"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']}>
            <CustomerAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/supplier-analysis"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']}>
            <SupplierAnalysisPage />
          </ProtectedRoute>
        }
      />
            <Route
              path="/dashboard/buyer-analysis"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']}>
                  <BuyerAnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/business-trend-analysis"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'DIRECTOR']}>
                  <BusinessTrendAnalysisPage />
                </ProtectedRoute>
              }
            />
      <Route
        path="/monitoring"
        element={
          <ProtectedRoute>
            <SystemMonitoringPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute>
            <SystemLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/error-logs"
        element={
          <ProtectedRoute>
            <ErrorLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/backup"
        element={
          <ProtectedRoute>
            <BackupStatusPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restore"
        element={
          <ProtectedRoute>
            <DataRestorePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <ProductManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/product-categories"
        element={
          <ProtectedRoute>
            <ProductCategoryManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:productId/interactions"
        element={
          <ProtectedRoute>
            <ProductCustomerInteractionHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:productId/business-process"
        element={
          <ProtectedRoute>
            <ProductBusinessProcessPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/integrity"
        element={
          <ProtectedRoute>
            <ProductIntegrityValidationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers"
        element={
          <ProtectedRoute>
            <CustomerManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/:customerId/interactions"
        element={
          <ProtectedRoute>
            <CustomerProductInteractionHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/customers/import"
        element={
          <ProtectedRoute>
            <CustomerImportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/import"
        element={
          <ProtectedRoute>
            <ProductImportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interactions/import"
        element={
          <ProtectedRoute>
            <InteractionImportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/export"
        element={
          <ProtectedRoute>
            <ExportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gdpr/export"
        element={
          <ProtectedRoute>
            <GdprExportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gdpr/deletion"
        element={
          <ProtectedRoute>
            <GdprDeletionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/people"
        element={
          <ProtectedRoute>
            {/* <PersonManagementPage /> */} {/* Temporarily commented out - file not found */}
            <Card variant="default" className="p-monday-8">
              <h2 className="text-monday-2xl font-semibold mb-monday-4">联系人管理</h2>
              <p className="text-monday-text-secondary">联系人管理功能正在开发中...</p>
            </Card>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interactions"
        element={
          <ProtectedRoute>
            <InteractionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interactions/create"
        element={
          <ProtectedRoute>
            <InteractionCreatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interactions/:id"
        element={
          <ProtectedRoute>
            <InteractionDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interactions/:id/edit"
        element={
          <ProtectedRoute>
            <InteractionEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/test-tailwind"
        element={
          <ProtectedRoute>
            <TestTailwind />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

