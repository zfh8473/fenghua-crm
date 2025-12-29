/**
 * Table 组件使用示例
 * 
 * 本文件包含 Table 组件的各种使用场景示例。
 * 所有代码都可以直接复制使用。
 * 
 * 参考：fenghua-frontend/src/components/ui/Table.tsx
 * 
 * 导入说明：
 * 实际使用时，根据文件位置调整导入路径：
 * - src/pages/ 目录：import { Table, Column } from '../components/ui';
 * - src/components/ 目录：import { Table, Column } from './ui';
 * - src/ 根目录：import { Table, Column } from './components/ui';
 * 
 * 注意：本文件中的代码是示例性的，实际使用时请取消注释并根据文件位置调整导入路径
 */

// 取消下面的注释并根据文件位置调整导入路径
// import React from 'react';
// import { Table, Column } from '../components/ui';
// import type { TableProps } from '../components/ui';

// 用户数据类型
interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// 基础用法示例
export function BasicTableExample() {
  // const columns: Column<UserData>[] = [
  //   { key: 'id', header: 'ID' },
  //   { key: 'name', header: '姓名' },
  //   { key: 'email', header: '邮箱' },
  //   { key: 'role', header: '角色' },
  // ];

  // const data: UserData[] = [
  //   { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'Admin', createdAt: '2025-01-01' },
  //   { id: 2, name: '李四', email: 'lisi@example.com', role: 'User', createdAt: '2025-01-02' },
  //   { id: 3, name: '王五', email: 'wangwu@example.com', role: 'Editor', createdAt: '2025-01-03' },
  // ];

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">基础用法</h2>
      
      {/* <Table
        columns={columns}
        data={data}
        aria-label="用户列表"
      /> */}
    </div>
  );
}

// 可排序示例
export function SortableTableExample() {
  // const columns: Column<UserData>[] = [
  //   { key: 'id', header: 'ID', sortable: true },
  //   { key: 'name', header: '姓名', sortable: true },
  //   { key: 'email', header: '邮箱', sortable: true },
  //   { key: 'role', header: '角色' },
  // ];

  // const data: UserData[] = [
  //   { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'Admin', createdAt: '2025-01-01' },
  //   { id: 2, name: '李四', email: 'lisi@example.com', role: 'User', createdAt: '2025-01-02' },
  //   { id: 3, name: '王五', email: 'wangwu@example.com', role: 'Editor', createdAt: '2025-01-03' },
  // ];

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">可排序</h2>
      
      {/* <Table
        columns={columns}
        data={data}
        sortable={true}
        aria-label="可排序用户列表"
      /> */}
    </div>
  );
}

// 行点击示例
export function TableRowClickExample() {
  // const columns: Column<UserData>[] = [
  //   { key: 'id', header: 'ID' },
  //   { key: 'name', header: '姓名' },
  //   { key: 'email', header: '邮箱' },
  //   { key: 'role', header: '角色' },
  // ];

  // const data: UserData[] = [
  //   { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'Admin', createdAt: '2025-01-01' },
  //   { id: 2, name: '李四', email: 'lisi@example.com', role: 'User', createdAt: '2025-01-02' },
  // ];

  // const handleRowClick = (row: UserData) => {
  //   console.log('点击行:', row);
  //   // 可以导航到详情页
  //   // navigate(`/users/${row.id}`);
  // };

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">行点击</h2>
      
      {/* <Table
        columns={columns}
        data={data}
        onRowClick={handleRowClick}
        aria-label="可点击用户列表"
      /> */}
    </div>
  );
}

// 自定义渲染示例
export function TableCustomRenderExample() {
  // const columns: Column<UserData>[] = [
  //   { key: 'id', header: 'ID' },
  //   { key: 'name', header: '姓名' },
  //   {
  //     key: 'role',
  //     header: '角色',
  //     render: (value) => (
  //       <span className="font-semibold text-primary-blue">
  //         {value}
  //       </span>
  //     ),
  //   },
  //   {
  //     key: 'createdAt',
  //     header: '创建时间',
  //     render: (value) => new Date(value).toLocaleDateString('zh-CN'),
  //   },
  // ];

  // const data: UserData[] = [
  //   { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'Admin', createdAt: '2025-01-01' },
  //   { id: 2, name: '李四', email: 'lisi@example.com', role: 'User', createdAt: '2025-01-02' },
  // ];

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">自定义渲染</h2>
      
      {/* <Table
        columns={columns}
        data={data}
        aria-label="自定义渲染用户列表"
      /> */}
    </div>
  );
}

// 空状态示例
export function TableEmptyStateExample() {
  // const columns: Column<UserData>[] = [
  //   { key: 'id', header: 'ID' },
  //   { key: 'name', header: '姓名' },
  //   { key: 'email', header: '邮箱' },
  // ];

  return (
    <div className="space-y-linear-4">
      <h2 className="text-linear-2xl font-semibold">空状态</h2>
      
      {/* <Table
        columns={columns}
        data={[]}
        aria-label="空用户列表"
      /> */}
    </div>
  );
}

// 完整示例
export function TableCompleteExample() {
  return (
    <div className="space-y-linear-8 p-linear-8 bg-linear-dark">
      <BasicTableExample />
      <SortableTableExample />
      <TableRowClickExample />
      <TableCustomRenderExample />
      <TableEmptyStateExample />
    </div>
  );
}
