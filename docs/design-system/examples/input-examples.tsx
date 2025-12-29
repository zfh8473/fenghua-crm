/**
 * Input 组件使用示例
 * 
 * 本文件包含 Input 组件的各种使用场景示例。
 * 所有代码都可以直接复制使用。
 * 
 * 参考：fenghua-frontend/src/components/ui/Input.tsx
 * 
 * 导入说明：
 * 实际使用时，根据文件位置调整导入路径：
 * - src/pages/ 目录：import { Input } from '../components/ui';
 * - src/components/ 目录：import { Input } from './ui';
 * - src/ 根目录：import { Input } from './components/ui';
 * 
 * 注意：本文件中的代码是示例性的，实际使用时请取消注释并根据文件位置调整导入路径
 */

// 取消下面的注释并根据文件位置调整导入路径
// import React, { useState } from 'react';
// import { Input } from '../components/ui';
// import type { InputProps } from '../components/ui';

// 基础用法示例
export function BasicInputExample() {
  // const [value, setValue] = useState('');

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">基础用法</h2>
      
      {/* <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="请输入文本"
      /> */}
    </div>
  );
}

// 带标签示例
export function InputWithLabelExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">带标签</h2>
      
      {/* <Input
        label="邮箱地址"
        type="email"
        placeholder="name@example.com"
      /> */}
    </div>
  );
}

// 错误状态示例
export function InputErrorExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">错误状态</h2>
      
      {/* <Input
        label="密码"
        type="password"
        error={true}
        errorMessage="密码长度不能少于6个字符"
      /> */}
    </div>
  );
}

// 帮助文本示例
export function InputHelperTextExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">帮助文本</h2>
      
      {/* <Input
        label="用户名"
        helperText="用户名只能包含字母、数字和下划线"
      /> */}
    </div>
  );
}

// 带图标示例
export function InputWithIconExample() {
  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">带图标</h2>
      
      {/* <Input
        label="搜索"
        leftIcon={<SearchIcon />}
        placeholder="搜索..."
      /> */}
      
      {/* <Input
        label="密码"
        type="password"
        rightIcon={<EyeIcon />}
      /> */}
    </div>
  );
}

// 不同尺寸示例
export function InputSizesExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">不同尺寸</h2>
      
      <div className="space-y-linear-4">
        {/* <Input size="sm" label="小输入框" placeholder="小尺寸" /> */}
        {/* <Input size="md" label="中等输入框" placeholder="中等尺寸（默认）" /> */}
        {/* <Input size="lg" label="大输入框" placeholder="大尺寸" /> */}
      </div>
    </div>
  );
}

// 禁用状态示例
export function InputDisabledExample() {
  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">禁用状态</h2>
      
      {/* <Input
        label="禁用输入框"
        disabled
        defaultValue="禁用状态"
      /> */}
    </div>
  );
}

// 表单中使用示例
export function InputInFormExample() {
  // const [formData, setFormData] = useState({
  //   email: '',
  //   password: '',
  //   username: '',
  // });

  // const [errors, setErrors] = useState<Record<string, string>>({});

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   const newErrors: Record<string, string> = {};
  //   if (!formData.email) {
  //     newErrors.email = '邮箱不能为空';
  //   }
  //   if (!formData.password) {
  //     newErrors.password = '密码不能为空';
  //   }
  //   setErrors(newErrors);
  //   
  //   if (Object.keys(newErrors).length === 0) {
  //     console.log('表单提交:', formData);
  //   }
  // };

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">表单中使用</h2>
      
      {/* <form onSubmit={handleSubmit} className="space-y-linear-4">
        <Input
          label="邮箱"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={!!errors.email}
          errorMessage={errors.email}
        />
        
        <Input
          label="密码"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          error={!!errors.password}
          errorMessage={errors.password}
        />
        
        <Input
          label="用户名"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          helperText="用户名只能包含字母、数字和下划线"
        />
      </form> */}
    </div>
  );
}

// 完整示例
export function InputCompleteExample() {
  return (
    <div className="space-y-linear-8 p-linear-8 bg-linear-dark">
      <BasicInputExample />
      <InputWithLabelExample />
      <InputErrorExample />
      <InputHelperTextExample />
      <InputWithIconExample />
      <InputSizesExample />
      <InputDisabledExample />
      <InputInFormExample />
    </div>
  );
}
