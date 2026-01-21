/**
 * User List Component
 * 
 * Displays a list of users in a table using the Table component
 * All custom code is proprietary and not open source.
 */

import { User } from '../users.service';
import { Button } from '../../components/ui';
import { Table, Column } from '../../components/ui/Table';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  currentUserId?: string;
}

export const UserList: React.FC<UserListProps> = ({
  users,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  const getRoleLabel = (role: string | null): string => {
    if (!role) {
      return '无角色';
    }
    const roleMap: Record<string, string> = {
      ADMIN: '管理员',
      DIRECTOR: '总监',
      FRONTEND_SPECIALIST: '前端专员',
      BACKEND_SPECIALIST: '后端专员',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: string | null): string => {
    if (!role) {
      return 'bg-gray-100 text-gray-600';
    }
    const colorMap: Record<string, string> = {
      ADMIN: 'bg-primary-blue text-white',
      DIRECTOR: 'bg-primary-purple text-white',
      FRONTEND_SPECIALIST: 'bg-primary-green text-white',
      BACKEND_SPECIALIST: 'bg-primary-red text-white',
    };
    return colorMap[role] || 'bg-gray-100 text-gray-600';
  };

  const columns: Column<User>[] = [
    {
      key: 'email',
      header: '邮箱',
    },
    {
      key: 'name',
      header: '姓名',
      render: (_, user) => {
        return user.firstName || user.lastName
          ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
          : '-';
      },
    },
    {
      key: 'role',
      header: '角色',
      render: (role) => {
        if (role) {
          return (
            <span className={`inline-flex items-center px-linear-2 py-linear-1 rounded-linear-sm text-linear-sm font-medium ${getRoleBadgeColor(role as string)}`}>
              {getRoleLabel(role as string)}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-linear-2 py-linear-1 rounded-linear-sm bg-gray-100 text-linear-text-secondary text-linear-sm font-medium">
            无角色
          </span>
        );
      },
    },
    {
      key: 'department',
      header: '部门',
      render: (value) => value || '-',
    },
    {
      key: 'phone',
      header: '联系方式',
      render: (value) => value || '-',
    },
    {
      key: 'createdAt',
      header: '创建时间',
      render: (value) => {
        return value ? new Date(value as string).toLocaleDateString('zh-CN') : '-';
      },
    },
    {
      key: 'actions',
      header: '操作',
      render: (_, user) => (
        <div 
          className="flex gap-linear-2" 
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="用户操作按钮组"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onEdit(user)}
            title="编辑"
            leftIcon={<span>✏️</span>}
            className="bg-primary-blue/10 border-primary-blue/30 text-primary-blue hover:bg-primary-blue/20 hover:border-primary-blue/50"
          >
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user)}
            disabled={user.id === currentUserId}
            title={user.id === currentUserId ? '不能删除自己的账户' : '删除'}
            leftIcon={<span>🗑️</span>}
            className={`text-primary-red hover:text-primary-red hover:bg-primary-red/10 border border-transparent hover:border-primary-red/20 ${
              user.id === currentUserId ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Page Title */}
      <h2 className="text-linear-2xl font-bold text-linear-text mb-linear-6 tracking-tight">用户列表</h2>
      
      <Table
        columns={columns}
        data={users}
        sortable={false}
        aria-label="用户列表"
        rowKey={(row) => row.id}
      />
    </div>
  );
};

