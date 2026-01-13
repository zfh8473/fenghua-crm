import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { User, getUsers, createUser, updateUser, deleteUser, CreateUserData, UpdateUserData } from './users.service';
import { UserList } from './components/UserList';
import { UserForm } from './components/UserForm';
import { isAdmin } from '../common/constants/roles';
import { Card, Button } from '../components/ui';
import { MainLayout } from '../components/layout';
import { Input } from '../components/ui/Input';
import { getErrorMessage } from '../utils/error-handling';

type ViewMode = 'list' | 'create' | 'edit';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const userList = await getUsers(roleFilter || undefined, searchQuery || undefined);
      setUsers(userList);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setViewMode('create');
    setError(null);
    setSuccessMessage(null);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setViewMode('edit');
    setError(null);
    setSuccessMessage(null);
  };

  const handleDelete = async (user: User) => {
    if (!window.confirm(`确定要删除用户 ${user.email} 吗？`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      setSuccessMessage('用户删除成功');
      await loadUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (data: CreateUserData | UpdateUserData) => {
    try {
      setError(null);
      if (viewMode === 'create') {
        await createUser(data as CreateUserData);
        setSuccessMessage('用户创建成功');
      } else {
        if (!editingUser) return;
        await updateUser(editingUser.id, data);
        setSuccessMessage('用户更新成功');
      }
      setViewMode('list');
      await loadUsers();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingUser(null);
    setError(null);
    setSuccessMessage(null);
  };

  // Check if current user is admin
  const userIsAdmin = isAdmin(currentUser?.role);

  if (!userIsAdmin) {
    return (
      <MainLayout title="用户管理">
        <Card variant="default" className="max-w-7xl mx-auto">
          <div className="p-linear-4 bg-semantic-error/20 border border-semantic-error rounded-linear-md text-semantic-error text-linear-base" role="alert">
            只有管理员可以访问此页面
          </div>
        </Card>
      </MainLayout>
    );
  }

  // Toolbar component - Linear style, all in one line, wrapped in card
  const toolbar = viewMode === 'list' ? (
    <Card variant="default" className="w-full p-linear-4">
      <div className="flex items-center gap-linear-3 flex-wrap sm:flex-nowrap">
        <Input
          type="text"
          placeholder="搜索用户..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-64 min-w-[200px]"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-linear-3 py-linear-2 text-linear-sm text-linear-text bg-linear-surface border border-gray-200 rounded-linear-md focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-colors font-semibold"
        >
          <option value="">所有角色</option>
          <option value="ADMIN">管理员</option>
          <option value="DIRECTOR">总监</option>
          <option value="FRONTEND_SPECIALIST">前端专员</option>
          <option value="BACKEND_SPECIALIST">后端专员</option>
        </select>
        <Button 
          variant="primary" 
          size="md" 
          onClick={handleCreate} 
          leftIcon={<span>✨</span>}
          className="bg-gradient-to-r from-primary-blue to-primary-blue-hover shadow-linear-md hover:shadow-linear-lg font-semibold"
        >
          创建新用户
        </Button>
      </div>
    </Card>
  ) : null;


  return (
    <MainLayout
      title=""
    >
      {viewMode === 'list' ? (
        <div className="space-y-linear-4">
          {/* Toolbar Card */}
          {toolbar}

          {/* User List Card */}
          <Card variant="default" className="w-full">
            {successMessage && (
              <div className="mb-linear-4 p-linear-4 bg-primary-green/20 border border-primary-green rounded-linear-md text-primary-green text-linear-sm" role="alert">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="mb-linear-4 p-linear-4 bg-primary-red/20 border border-primary-red rounded-linear-md text-primary-red text-linear-sm" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center p-linear-8 text-linear-text-secondary">加载中...</div>
            ) : (
            <UserList
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
              currentUserId={currentUser?.id}
            />
            )}
          </Card>
        </div>
      ) : (
        <Card variant="default" className="max-w-3xl mx-auto">
          <h2 className="text-linear-2xl font-semibold text-linear-text mb-linear-6">
            {viewMode === 'create' ? '创建新用户' : '编辑用户'}
          </h2>
          <UserForm
            user={editingUser || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isEditing={viewMode === 'edit'}
          />
        </Card>
      )}
    </MainLayout>
  );
};

