/**
 * Test component to verify Tailwind CSS configuration and UI components
 * This component tests:
 * - Basic utility classes
 * - Responsive classes
 * - Dark mode classes
 * - Custom theme extension (for Story 0.2)
 * - UI Components (for Story 0.3)
 */

import React, { useState } from 'react';
import { Button, Input, Card, Table } from './ui';

export const TestTailwind: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tailwind CSS 配置测试</h1>
      
      {/* Basic utility classes test */}
      <div className="bg-blue-500 text-white p-4 rounded mb-4">
        <p>基础工具类测试：bg-blue-500 text-white p-4 rounded</p>
      </div>

      {/* Responsive classes test */}
      <div className="flex flex-col md:flex-row lg:grid xl:container gap-4 mb-4">
        <div className="bg-green-500 text-white p-4 rounded">
          响应式类：md:flex lg:grid
        </div>
        <div className="bg-purple-500 text-white p-4 rounded">
          响应式类测试
        </div>
      </div>

      {/* Dark mode classes test */}
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded mb-4">
        <p>深色模式类：dark:bg-gray-900 dark:text-white</p>
        <button
          onClick={toggleDarkMode}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {isDark ? '切换到浅色模式' : '切换到深色模式'}
        </button>
        <p className="text-sm mt-2">
          当前模式: {isDark ? '深色' : '浅色'} (根元素 class: {isDark ? 'dark' : '无'})
        </p>
      </div>

      {/* Design Token Tests */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">设计 Token 测试</h2>
        
        {/* Color Tokens Test */}
        <div className="space-y-2">
          <h3 className="font-medium">颜色 Token 测试</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-linear-dark text-linear-text p-linear-4 rounded-linear-md">
              linear-dark
            </div>
            <div className="bg-linear-surface text-linear-text p-linear-4 rounded-linear-md">
              linear-surface
            </div>
            <div className="bg-primary-blue text-white p-linear-4 rounded-linear-md">
              primary-blue
            </div>
            <div className="bg-primary-purple text-white p-linear-4 rounded-linear-md">
              primary-purple
            </div>
            <div className="bg-semantic-success text-white p-linear-4 rounded-linear-md">
              success
            </div>
            <div className="bg-semantic-warning text-white p-linear-4 rounded-linear-md">
              warning
            </div>
            <div className="bg-semantic-error text-white p-linear-4 rounded-linear-md">
              error
            </div>
            <div className="bg-semantic-info text-white p-linear-4 rounded-linear-md">
              info
            </div>
          </div>
        </div>

        {/* Spacing Tokens Test */}
        <div className="space-y-2">
          <h3 className="font-medium">间距 Token 测试</h3>
          <div className="flex flex-wrap gap-2">
            <div className="bg-primary-blue text-white p-linear-1 rounded-linear-sm">p-linear-1 (4px)</div>
            <div className="bg-primary-blue text-white p-linear-2 rounded-linear-sm">p-linear-2 (8px)</div>
            <div className="bg-primary-blue text-white p-linear-4 rounded-linear-sm">p-linear-4 (16px)</div>
            <div className="bg-primary-blue text-white p-linear-6 rounded-linear-sm">p-linear-6 (24px)</div>
            <div className="bg-primary-blue text-white p-linear-8 rounded-linear-sm">p-linear-8 (32px)</div>
          </div>
        </div>

        {/* Typography Tokens Test */}
        <div className="space-y-2">
          <h3 className="font-medium">字体 Token 测试</h3>
          <div className="space-y-1">
            <p className="text-linear-xs">text-linear-xs (12px)</p>
            <p className="text-linear-sm">text-linear-sm (14px)</p>
            <p className="text-linear-base">text-linear-base (16px)</p>
            <p className="text-linear-lg">text-linear-lg (18px)</p>
            <p className="text-linear-xl">text-linear-xl (20px)</p>
            <p className="text-linear-2xl">text-linear-2xl (24px)</p>
            <p className="text-linear-3xl font-bold">text-linear-3xl (30px) Bold</p>
          </div>
        </div>

        {/* Shadow Tokens Test */}
        <div className="space-y-2">
          <h3 className="font-medium">阴影 Token 测试</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-linear-surface p-linear-4 rounded-linear-md shadow-linear-sm">
              shadow-linear-sm
            </div>
            <div className="bg-white dark:bg-linear-surface p-linear-4 rounded-linear-md shadow-linear-md">
              shadow-linear-md
            </div>
            <div className="bg-white dark:bg-linear-surface p-linear-4 rounded-linear-md shadow-linear-lg">
              shadow-linear-lg
            </div>
            <div className="bg-white dark:bg-linear-surface p-linear-4 rounded-linear-md shadow-linear-soft">
              shadow-linear-soft
            </div>
          </div>
        </div>

        {/* Backdrop Blur Test */}
        <div className="space-y-2">
          <h3 className="font-medium">模糊效果测试（玻璃态）</h3>
          <div className="relative bg-linear-dark p-linear-8 rounded-linear-lg overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-blue to-primary-purple opacity-20"></div>
            <div className="relative bg-white/10 backdrop-blur-linear-md p-linear-4 rounded-linear-md border border-white/20">
              <p className="text-linear-text">backdrop-blur-linear-md (玻璃态效果)</p>
            </div>
          </div>
        </div>

        {/* Border Radius Test */}
        <div className="space-y-2">
          <h3 className="font-medium">圆角 Token 测试</h3>
          <div className="flex flex-wrap gap-2">
            <div className="bg-primary-blue text-white p-linear-2 rounded-linear-sm">rounded-linear-sm</div>
            <div className="bg-primary-blue text-white p-linear-2 rounded-linear-md">rounded-linear-md</div>
            <div className="bg-primary-blue text-white p-linear-2 rounded-linear-lg">rounded-linear-lg</div>
            <div className="bg-primary-blue text-white p-linear-2 rounded-linear-xl">rounded-linear-xl</div>
            <div className="bg-primary-blue text-white p-linear-2 rounded-linear-2xl">rounded-linear-2xl</div>
            <div className="bg-primary-blue text-white p-linear-2 rounded-linear-full">rounded-linear-full</div>
          </div>
        </div>

        {/* Gradient Test */}
        <div className="space-y-2">
          <h3 className="font-medium">渐变效果测试</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">使用 Tailwind 类名（推荐）：</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-primary p-linear-6 rounded-linear-lg text-white">
                  bg-gradient-primary (品牌渐变)
                </div>
                <div className="bg-gradient-success p-linear-6 rounded-linear-lg text-white">
                  bg-gradient-success (成功渐变)
                </div>
                <div className="bg-gradient-progress p-linear-6 rounded-linear-lg text-white">
                  bg-gradient-progress (进度渐变)
                </div>
                <div className="bg-gradient-dark p-linear-6 rounded-linear-lg text-white">
                  bg-gradient-dark (深色渐变)
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm mb-2">使用 inline style（兼容性测试）：</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className="p-linear-6 rounded-linear-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)' }}
                >
                  品牌渐变 (primary) - inline
                </div>
                <div 
                  className="p-linear-6 rounded-linear-lg text-white"
                  style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)' }}
                >
                  成功渐变 (success) - inline
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Typography 5xl Test */}
        <div className="space-y-2">
          <h3 className="font-medium">字体 Token 测试 - 5xl (48px H1)</h3>
          <p className="text-linear-5xl font-bold">text-linear-5xl (48px) - H1 Title</p>
        </div>

        {/* Light Mode Text Colors Test */}
        <div className="space-y-2">
          <h3 className="font-medium">浅色模式文本颜色测试</h3>
          <div className="bg-white p-linear-4 rounded-linear-md space-y-2">
            <p className="text-linear-text-on-light">text-linear-text-on-light (深色文本，用于浅色背景)</p>
            <p className="text-linear-text-secondary-on-light">text-linear-text-secondary-on-light (次要文本)</p>
            <p className="text-linear-text-placeholder-on-light">text-linear-text-placeholder-on-light (占位符文本)</p>
          </div>
        </div>
      </div>

      {/* UI Components Tests */}
      <div className="space-y-6 mt-8">
        <h2 className="text-2xl font-bold mb-4">UI 组件测试</h2>
        
        {/* Button Component Tests */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Button 组件测试</h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm mb-2">变体测试：</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm mb-2">尺寸测试：</p>
              <div className="flex flex-wrap gap-2 items-center">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            
            <div>
              <p className="text-sm mb-2">状态测试：</p>
              <div className="flex flex-wrap gap-2">
                <Button>Normal</Button>
                <Button disabled>Disabled</Button>
                <Button isLoading>Loading</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Input Component Tests */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Input 组件测试</h3>
          
          <div className="space-y-3 max-w-md">
            <Input
              label="正常输入框"
              placeholder="Enter text here"
              defaultValue=""
            />
            
            <Input
              label="带错误状态"
              error={true}
              errorMessage="This field is required"
              defaultValue=""
            />
            
            <Input
              label="禁用状态"
              disabled
              defaultValue="Disabled input"
            />
            
            <Input
              label="不同尺寸"
              size="sm"
              placeholder="Small input"
              defaultValue=""
            />
            
            <Input
              label="带帮助文本"
              helperText="This is helper text"
              defaultValue=""
            />
          </div>
        </div>

        {/* Card Component Tests */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Card 组件测试</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="default" title="Default Card">
              <p className="text-linear-text-secondary">
                This is a default card with glassmorphism effect.
              </p>
            </Card>
            
            <Card variant="elevated" title="Elevated Card">
              <p className="text-linear-text-secondary">
                This card has stronger shadow.
              </p>
            </Card>
            
            <Card variant="outlined" title="Outlined Card" hoverable>
              <p className="text-linear-text-secondary">
                This card has border emphasis and hover effect.
              </p>
            </Card>
            
            <Card title="Card with Footer" footer={<Button size="sm">Action</Button>}>
              <p className="text-linear-text-secondary">
                Card with footer content.
              </p>
            </Card>
          </div>
        </div>

        {/* Table Component Tests */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Table 组件测试</h3>
          
          <Table
            columns={[
              { key: 'id', header: 'ID', sortable: true },
              { key: 'name', header: 'Name', sortable: true },
              { key: 'email', header: 'Email' },
              { key: 'status', header: 'Status', render: (value) => (
                <span className={`px-2 py-1 rounded-linear-sm ${
                  value === 'Active' ? 'bg-semantic-success/20 text-semantic-success' : 'bg-semantic-error/20 text-semantic-error'
                }`}>
                  {value}
                </span>
              )},
            ]}
            data={[
              { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
              { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Active' },
            ]}
            onRowClick={(row) => {
              console.log('Row clicked:', row);
            }}
            sortable={true}
            aria-label="Sample data table"
          />
        </div>

        {/* Responsive Test */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">响应式测试</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card title="响应式卡片 1">
              <p className="text-linear-text-secondary">在移动端单列，平板两列，桌面三列</p>
            </Card>
            <Card title="响应式卡片 2">
              <p className="text-linear-text-secondary">使用 Tailwind 响应式类</p>
            </Card>
            <Card title="响应式卡片 3">
              <p className="text-linear-text-secondary">自动适配不同屏幕尺寸</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTailwind;

