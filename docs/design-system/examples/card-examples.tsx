/**
 * Card 组件使用示例
 * 
 * 本文件包含 Card 组件的各种使用场景示例。
 * 所有代码都可以直接复制使用。
 * 
 * 参考：fenghua-frontend/src/components/ui/Card.tsx
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
// import type { CardProps } from '../components/ui';

// 基础用法示例
export function BasicCardExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">基础用法</h2>
      
      {/* <Card>
        <p className="text-linear-text">这是基础卡片内容</p>
      </Card> */}
    </div>
  );
}

// 带标题示例
export function CardWithTitleExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">带标题</h2>
      
      {/* <Card title="卡片标题">
        <p className="text-linear-text">卡片内容</p>
      </Card> */}
    </div>
  );
}

// 带页脚示例
export function CardWithFooterExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">带页脚</h2>
      
      {/* <Card
        title="卡片标题"
        footer={
          <div className="flex justify-end gap-linear-2">
            <Button variant="outline" size="sm">取消</Button>
            <Button variant="primary" size="sm">确认</Button>
          </div>
        }
      >
        <p className="text-linear-text">卡片内容</p>
      </Card> */}
    </div>
  );
}

// 不同变体示例
export function CardVariantsExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">不同变体</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-linear-4">
        {/* <Card variant="default" title="标准卡片">
          <p className="text-linear-text-secondary">标准阴影</p>
        </Card> */}
        
        {/* <Card variant="elevated" title="提升卡片">
          <p className="text-linear-text-secondary">强阴影</p>
        </Card> */}
        
        {/* <Card variant="outlined" title="轮廓卡片">
          <p className="text-linear-text-secondary">边框强调</p>
        </Card> */}
      </div>
    </div>
  );
}

// 可悬停示例
export function CardHoverableExample() {
  // const handleClick = () => {
  //   console.log('卡片被点击');
  // };

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">可悬停</h2>
      
      {/* <Card hoverable onClick={handleClick}>
        <p className="text-linear-text">点击或悬停此卡片</p>
      </Card> */}
    </div>
  );
}

// 信息卡片示例
export function CardInfoExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">信息卡片</h2>
      
      {/* <Card title="用户信息">
        <div className="space-y-linear-2">
          <p className="text-linear-text">
            <span className="font-semibold">姓名：</span>张三
          </p>
          <p className="text-linear-text">
            <span className="font-semibold">邮箱：</span>zhangsan@example.com
          </p>
          <p className="text-linear-text">
            <span className="font-semibold">角色：</span>管理员
          </p>
        </div>
      </Card> */}
    </div>
  );
}

// 网格布局示例
export function CardGridExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">网格布局</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-linear-4">
        {/* <Card title="卡片 1">
          <p className="text-linear-text-secondary">内容 1</p>
        </Card>
        <Card title="卡片 2">
          <p className="text-linear-text-secondary">内容 2</p>
        </Card>
        <Card title="卡片 3">
          <p className="text-linear-text-secondary">内容 3</p>
        </Card> */}
      </div>
    </div>
  );
}

// 完整示例
export function CardCompleteExample() {
  return (
    <div className="space-y-linear-8 p-linear-8 bg-linear-dark">
      <BasicCardExample />
      <CardWithTitleExample />
      <CardWithFooterExample />
      <CardVariantsExample />
      <CardHoverableExample />
      <CardInfoExample />
      <CardGridExample />
    </div>
  );
}
