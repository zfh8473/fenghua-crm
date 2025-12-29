# 自动化测试设置方案

**日期：** 2025-12-26  
**目标：** 为 Story 0.8 回归测试设置自动化测试框架

---

## 📋 当前状态

### 现有测试基础设施
- ❌ 未安装测试框架（Jest/Vitest/Playwright）
- ✅ 有一个测试文件 `auth.service.test.ts`（使用 Jest 语法，但未配置）
- ✅ 项目使用 Vite（可以轻松集成 Vitest）
- ✅ 有 MCP Browser Extension 可用于浏览器自动化

---

## 🎯 自动化测试方案

### 方案 1: 使用 MCP Browser Extension（快速开始）

**优点：**
- 无需安装额外依赖
- 可以立即开始测试
- 适合快速验证功能

**缺点：**
- 需要应用运行
- 测试脚本需要手动编写
- 不适合 CI/CD

### 方案 2: 设置 Vitest + Playwright（推荐）

**优点：**
- 完整的测试框架
- 可以集成到 CI/CD
- 支持单元测试和 E2E 测试
- 可以生成测试报告

**缺点：**
- 需要安装和配置
- 需要一些时间设置

---

## 🚀 推荐方案：Vitest + Playwright

### 步骤 1: 安装依赖

```bash
cd fenghua-frontend
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test
npx playwright install
```

### 步骤 2: 配置 Vitest

创建 `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 步骤 3: 配置 Playwright

创建 `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3002',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 步骤 4: 创建测试文件

**单元测试示例：** `src/components/ui/Button.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })
})
```

**E2E 测试示例：** `e2e/login.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test('login flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/')
})
```

---

## 📝 测试覆盖范围

### 单元测试（Vitest）
- ✅ UI 组件（Button, Input, Card, Table）
- ✅ 工具函数
- ✅ Auth Service
- ✅ API 调用（Mock）

### E2E 测试（Playwright）
- ✅ 登录流程
- ✅ 用户管理流程
- ✅ 产品管理流程
- ✅ 系统设置流程
- ✅ 响应式布局
- ✅ 可访问性（键盘导航）

---

## 🎯 立即行动方案

### 选项 A: 使用 MCP Browser Extension（现在）

我可以使用浏览器自动化工具立即开始测试，但需要：
1. 应用正在运行（`npm run dev`）
2. 后端 API 正常运行
3. 测试用户账号

### 选项 B: 设置完整测试框架（推荐）

我可以帮你：
1. 安装测试依赖
2. 配置 Vitest 和 Playwright
3. 创建测试文件
4. 运行自动化测试

---

**建议：** 先使用 MCP Browser Extension 进行快速验证，然后设置完整的测试框架用于长期维护。

