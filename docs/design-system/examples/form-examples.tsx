/**
 * 表单组合使用示例
 * 
 * 本文件包含表单组合使用的示例。
 * 所有代码都可以直接复制使用。
 * 
 * 导入说明：
 * 实际使用时，根据文件位置调整导入路径：
 * - src/pages/ 目录：import { Card, Input, Button } from '../components/ui';
 * - src/components/ 目录：import { Card, Input, Button } from './ui';
 * - src/ 根目录：import { Card, Input, Button } from './components/ui';
 * 
 * 注意：本文件中的代码是示例性的，实际使用时请取消注释并根据文件位置调整导入路径
 */

// 取消下面的注释并根据文件位置调整导入路径
// import React, { useState } from 'react';
// import { Card, Input, Button } from '../components/ui';

// 登录表单示例
export function LoginFormExample() {
  // const [formData, setFormData] = useState({
  //   email: '',
  //   password: '',
  // });
  // const [errors, setErrors] = useState<Record<string, string>>({});
  // const [isLoading, setIsLoading] = useState(false);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsLoading(true);
  //   
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
  //     await new Promise(resolve => setTimeout(resolve, 1000));
  //     console.log('登录成功');
  //   }
  //   
  //   setIsLoading(false);
  // };

  return (
    <div className="min-h-screen bg-linear-dark flex items-center justify-center p-linear-4">
      {/* <Card className="w-full max-w-md">
        <div className="mb-linear-6 text-center">
          <h1 className="text-linear-3xl font-bold mb-linear-2">登录</h1>
          <p className="text-linear-text-secondary">登录您的账户</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-linear-4">
          <Input
            label="邮箱"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
            errorMessage={errors.email}
            placeholder="name@example.com"
          />

          <Input
            label="密码"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!errors.password}
            errorMessage={errors.password}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            登录
          </Button>
        </form>
      </Card> */}
    </div>
  );
}

// 创建用户表单示例
export function CreateUserFormExample() {
  // const [formData, setFormData] = useState({
  //   name: '',
  //   email: '',
  //   password: '',
  //   role: '',
  // });
  // const [errors, setErrors] = useState<Record<string, string>>({});

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   
  //   const newErrors: Record<string, string> = {};
  //   if (!formData.name) {
  //     newErrors.name = '姓名不能为空';
  //   }
  //   if (!formData.email) {
  //     newErrors.email = '邮箱不能为空';
  //   }
  //   if (!formData.password) {
  //     newErrors.password = '密码不能为空';
  //   }
  //   setErrors(newErrors);
  //   
  //   if (Object.keys(newErrors).length === 0) {
  //     console.log('创建用户:', formData);
  //   }
  // };

  // const handleCancel = () => {
  //   console.log('取消');
  // };

  return (
    <div className="p-linear-8 bg-linear-dark">
      {/* <Card title="创建用户" className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-linear-4">
          <Input
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={!!errors.name}
            errorMessage={errors.name}
          />

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
            helperText="密码长度至少6个字符"
          />

          <div className="flex justify-end gap-linear-2 pt-linear-4">
            <Button variant="outline" type="button" onClick={handleCancel}>
              取消
            </Button>
            <Button variant="primary" type="submit">
              创建
            </Button>
          </div>
        </form>
      </Card> */}
    </div>
  );
}

// 搜索表单示例
export function SearchFormExample() {
  // const [searchTerm, setSearchTerm] = useState('');

  // const SearchIcon = () => (
  //   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  //   </svg>
  // );

  return (
    <div className="p-linear-8 bg-linear-dark">
      {/* <Card title="搜索" className="max-w-md">
        <Input
          label="搜索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<SearchIcon />}
          placeholder="搜索..."
        />
      </Card> */}
    </div>
  );
}

// 完整示例
export function FormCompleteExample() {
  return (
    <div className="space-y-linear-8">
      <LoginFormExample />
      <CreateUserFormExample />
      <SearchFormExample />
    </div>
  );
}
