/**
 * 布局使用示例
 * 
 * 本文件包含各种布局模式的示例。
 * 所有代码都可以直接复制使用。
 * 
 * 导入说明：
 * 实际使用时，根据文件位置调整导入路径：
 * - src/pages/ 目录：import { Card, Button } from '../components/ui';
 * - src/components/ 目录：import { Card, Button } from './ui';
 * - src/ 根目录：import { Card, Button } from './components/ui';
 * 
 * 注意：本文件中的代码是示例性的，实际使用时请取消注释并根据文件位置调整导入路径
 */

// 取消下面的注释并根据文件位置调整导入路径
// import React from 'react';
// import { Card, Button } from '../components/ui';

// 全宽布局示例
export function FullWidthLayoutExample() {
  return (
    <div className="min-h-screen bg-linear-dark">
      <div className="p-linear-8">
        <h1 className="text-linear-4xl font-bold mb-linear-6">全宽布局</h1>
        {/* <Card title="内容">
          <p className="text-linear-text">这是全宽布局示例</p>
        </Card> */}
      </div>
    </div>
  );
}

// 容器布局示例
export function ContainerLayoutExample() {
  return (
    <div className="min-h-screen bg-linear-dark">
      <div className="max-w-7xl mx-auto p-linear-8">
        <h1 className="text-linear-4xl font-bold mb-linear-6">容器布局</h1>
        {/* <Card title="内容">
          <p className="text-linear-text">这是容器布局示例，内容宽度限制在 max-w-7xl</p>
        </Card> */}
      </div>
    </div>
  );
}

// 三栏布局示例
export function ThreeColumnLayoutExample() {
  return (
    <div className="flex h-screen bg-linear-dark">
      {/* 侧边栏 */}
      <aside className="hidden lg:block w-64 fixed left-0 top-0 h-screen bg-linear-surface border-r border-linear-surface-alt p-linear-4">
        <h2 className="text-linear-xl font-semibold mb-linear-4">侧边栏</h2>
        <nav className="space-y-linear-2">
          {/* <Button variant="ghost" className="w-full justify-start">首页</Button> */}
          {/* <Button variant="ghost" className="w-full justify-start">产品</Button> */}
          {/* <Button variant="ghost" className="w-full justify-start">客户</Button> */}
        </nav>
      </aside>

      {/* 主内容 */}
      <main className="lg:ml-64 flex-1 overflow-y-auto p-linear-4 lg:p-linear-8">
        <h1 className="text-linear-4xl font-bold mb-linear-6">主内容</h1>
        {/* <Card title="内容区域">
          <p className="text-linear-text">这是主内容区域</p>
        </Card> */}
      </main>

      {/* 详情面板 */}
      <aside className="hidden xl:block w-80 fixed right-0 top-0 h-screen bg-linear-surface border-l border-linear-surface-alt p-linear-4">
        <h2 className="text-linear-xl font-semibold mb-linear-4">详情面板</h2>
        {/* <Card>
          <p className="text-linear-text-secondary">详情信息</p>
        </Card> */}
      </aside>
    </div>
  );
}

// 响应式网格示例
export function ResponsiveGridExample() {
  return (
    <div className="p-linear-8 bg-linear-dark">
      <h1 className="text-linear-4xl font-bold mb-linear-6">响应式网格</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-linear-4">
        {/* <Card title="卡片 1">
          <p className="text-linear-text-secondary">移动端 1 列，平板 2 列，桌面 3 列</p>
        </Card>
        <Card title="卡片 2">
          <p className="text-linear-text-secondary">响应式布局</p>
        </Card>
        <Card title="卡片 3">
          <p className="text-linear-text-secondary">自动适配</p>
        </Card> */}
      </div>
    </div>
  );
}

// 页面布局示例
export function PageLayoutExample() {
  return (
    <div className="min-h-screen bg-linear-dark">
      <div className="max-w-7xl mx-auto p-linear-8">
        {/* 页面标题 */}
        <div className="mb-linear-8">
          <h1 className="text-linear-5xl font-bold mb-linear-2">页面标题</h1>
          <p className="text-linear-text-secondary">页面描述</p>
        </div>

        {/* 操作栏 */}
        <div className="mb-linear-6 flex justify-between items-center">
          <div className="flex gap-linear-2">
            {/* <Button variant="primary">新建</Button> */}
            {/* <Button variant="outline">导入</Button> */}
          </div>
          {/* <Button variant="ghost">筛选</Button> */}
        </div>

        {/* 内容区域 */}
        <div className="space-y-linear-4">
          {/* <Card title="内容卡片 1">
            <p className="text-linear-text">内容 1</p>
          </Card>
          <Card title="内容卡片 2">
            <p className="text-linear-text">内容 2</p>
          </Card> */}
        </div>
      </div>
    </div>
  );
}

// 完整示例
export function LayoutCompleteExample() {
  return (
    <div className="space-y-linear-8">
      <FullWidthLayoutExample />
      <ContainerLayoutExample />
      <ThreeColumnLayoutExample />
      <ResponsiveGridExample />
      <PageLayoutExample />
    </div>
  );
}
