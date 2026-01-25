/**
 * User List Component
 * 
 * Displays a list of users in a table using the Table component
 * All custom code is proprietary and not open source.
 */

import { User } from '../users.service';
import { Button } from '../../components/ui';
import { Table, Column } from '../../components/ui/Table';
import { HomeModuleIcon } from '../../components/icons/HomeModuleIcons';

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

  /** 19.5 admin-settings：角色徽章用 uipro-*、semantic-*，禁止紫/粉 */
  const getRoleBadgeColor = (role: string | null): string => {
    if (!role) return 'bg-uipro-secondary/15 text-uipro-secondary';
    const colorMap: Record<string, string> = {
      ADMIN: 'bg-uipro-cta text-white',
      DIRECTOR: 'bg-uipro-secondary text-white',
      FRONTEND_SPECIALIST: 'bg-semantic-success text-white',
      BACKEND_SPECIALIST: 'bg-semantic-warning text-white',
    };
    return colorMap[role] || 'bg-uipro-secondary/15 text-uipro-secondary';
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
          <span className="inline-flex items-center px-linear-2 py-linear-1 rounded-linear-sm bg-uipro-secondary/15 text-uipro-secondary text-linear-sm font-medium">
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
          {/* 19.7 AC2：编辑 outline + uipro-cta，删除 outline + semantic-error；编辑在左、删除在右；统一图标 */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onEdit(user)}
            title="编辑"
          >
            编辑
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(user)}
            disabled={user.id === currentUserId}
            title={user.id === currentUserId ? '不能删除自己的账户' : '删除'}
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
      <h2 className="text-linear-2xl font-bold text-uipro-text font-uipro-heading mb-linear-6 tracking-tight">用户列表</h2>

      <div className="overflow-x-auto">
        <Table
          columns={columns}
          data={users}
          sortable={false}
          striped
          aria-label="用户列表"
          rowKey={(row) => row.id}
        />
      </div>
    </div>
  );
};

