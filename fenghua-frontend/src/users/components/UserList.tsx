import { User } from '../users.service';
import { Button } from '../../components/ui';

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

  return (
    <div className="w-full">
      {/* Page Title */}
      <h2 className="text-monday-2xl font-bold text-monday-text mb-monday-6 tracking-tight">用户列表</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
        <thead>
          <tr className="bg-monday-bg border-b border-gray-200">
            <th className="p-monday-2 p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">邮箱</th>
            <th className="p-monday-2 p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">姓名</th>
            <th className="p-monday-2 p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">角色</th>
            <th className="p-monday-2 p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">部门</th>
            <th className="p-monday-2 p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">联系方式</th>
            <th className="p-monday-2 p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">创建时间</th>
            <th className="p-monday-2 p-monday-3 text-left text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-monday-6 text-center text-monday-text-secondary text-monday-sm">
                暂无用户
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 hover:bg-monday-bg transition-colors duration-150"
              >
                <td className="p-monday-2 p-monday-3 text-monday-sm text-monday-text">{user.email}</td>
                <td className="p-monday-2 p-monday-3 text-monday-sm text-monday-text">
                  {user.firstName || user.lastName
                    ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                    : '-'}
                </td>
                <td className="p-monday-2 p-monday-3 text-monday-sm">
                  {user.role ? (
                    <span className={`inline-flex items-center px-monday-2 py-monday-1 rounded-monday-sm text-monday-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-monday-2 py-monday-1 rounded-monday-sm bg-gray-100 text-monday-text-secondary text-monday-sm font-medium">
                      无角色
                    </span>
                  )}
                </td>
                <td className="p-monday-2 p-monday-3 text-monday-sm text-monday-text">{user.department || '-'}</td>
                <td className="p-monday-2 p-monday-3 text-monday-sm text-monday-text">{user.phone || '-'}</td>
                <td className="p-monday-2 p-monday-3 text-monday-sm text-monday-text">
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('zh-CN')
                    : '-'}
                </td>
                <td className="p-monday-2 p-monday-4 text-monday-sm">
                  {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
                  <div 
                    className="flex gap-monday-2" 
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
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

