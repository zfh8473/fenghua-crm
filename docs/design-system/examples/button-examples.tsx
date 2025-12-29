/**
 * Button 组件使用示例
 * 
 * 本文件包含 Button 组件的各种使用场景示例。
 * 所有代码都可以直接复制使用。
 * 
 * 参考：fenghua-frontend/src/components/ui/Button.tsx
 * 
 * 导入说明：
 * 实际使用时，根据文件位置调整导入路径：
 * - src/pages/ 目录：import { Button } from '../components/ui';
 * - src/components/ 目录：import { Button } from './ui';
 * - src/ 根目录：import { Button } from './components/ui';
 * 
 * 注意：本文件中的代码是示例性的，实际使用时请取消注释并根据文件位置调整导入路径
 */

// 取消下面的注释并根据文件位置调整导入路径
// import React from 'react';
// import { Button } from '../components/ui';
// import type { ButtonProps } from '../components/ui';

// 基础用法示例
export function BasicButtonExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">基础用法</h2>
      
      <div className="flex flex-wrap gap-linear-2">
        {/* 实际使用时取消注释 */}
        {/* <Button variant="primary">主要按钮</Button> */}
        {/* <Button variant="secondary">次要按钮</Button> */}
        {/* <Button variant="outline">轮廓按钮</Button> */}
        {/* <Button variant="ghost">幽灵按钮</Button> */}
      </div>
    </div>
  );
}

// 不同尺寸示例
export function ButtonSizesExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">不同尺寸</h2>
      
      <div className="flex items-center gap-linear-2">
        {/* <Button size="sm">小按钮</Button> */}
        {/* <Button size="md">中等按钮</Button> */}
        {/* <Button size="lg">大按钮</Button> */}
      </div>
    </div>
  );
}

// 带图标示例
export function ButtonWithIconExample() {
  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const ArrowIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">带图标</h2>
      
      <div className="flex flex-wrap gap-linear-2">
        {/* <Button variant="primary" leftIcon={<SearchIcon />}>搜索</Button> */}
        {/* <Button variant="secondary" rightIcon={<ArrowIcon />}>下一步</Button> */}
        {/* <Button variant="outline" leftIcon={<SearchIcon />} rightIcon={<ArrowIcon />}>搜索并前进</Button> */}
      </div>
    </div>
  );
}

// 加载状态示例
export function ButtonLoadingExample() {
  // const [isLoading, setIsLoading] = React.useState(false);

  // const handleClick = async () => {
  //   setIsLoading(true);
  //   await new Promise(resolve => setTimeout(resolve, 2000));
  //   setIsLoading(false);
  // };

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">加载状态</h2>
      
      {/* <Button variant="primary" isLoading={isLoading} onClick={handleClick}>提交</Button> */}
    </div>
  );
}

// 禁用状态示例
export function ButtonDisabledExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">禁用状态</h2>
      
      <div className="flex flex-wrap gap-linear-2">
        {/* <Button variant="primary" disabled>禁用主要按钮</Button> */}
        {/* <Button variant="secondary" disabled>禁用次要按钮</Button> */}
        {/* <Button variant="outline" disabled>禁用轮廓按钮</Button> */}
      </div>
    </div>
  );
}

// 表单中使用示例
export function ButtonInFormExample() {
  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log('表单提交');
  // };

  // const handleCancel = () => {
  //   console.log('取消');
  // };

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">表单中使用</h2>
      
      {/* <form onSubmit={handleSubmit} className="space-y-linear-4">
        <div className="flex justify-end gap-linear-2">
          <Button variant="outline" type="button" onClick={handleCancel}>取消</Button>
          <Button variant="primary" type="submit">提交</Button>
        </div>
      </form> */}
    </div>
  );
}

// 完整示例
export function ButtonCompleteExample() {
  return (
    <div className="space-y-linear-8 p-linear-8 bg-linear-dark">
      <BasicButtonExample />
      <ButtonSizesExample />
      <ButtonWithIconExample />
      <ButtonLoadingExample />
      <ButtonDisabledExample />
      <ButtonInFormExample />
    </div>
  );
}
