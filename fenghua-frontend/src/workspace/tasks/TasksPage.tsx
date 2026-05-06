import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';
import { tasksService, Task, TeamMember, TaskPriority, TaskStatus, CreateTaskDto } from './tasks.service';
import { toast } from 'react-toastify';

// ── SVG Icons ─────────────────────────────────────────────────────────────────

const AlertTriangleIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ClockIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PlusIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PencilIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

const UserIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LinkIcon = ({ className = 'w-3 h-3' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
  </svg>
);

// ── helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<TaskPriority, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' };
const STATUS_LABEL: Record<TaskStatus, string> = { PENDING: '待办', IN_PROGRESS: '进行中', COMPLETED: '已完成' };

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  HIGH: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  MEDIUM: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  LOW: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
};

const PRIORITY_LEFT_BORDER: Record<TaskPriority, string> = {
  HIGH: 'border-l-4 border-l-red-400',
  MEDIUM: 'border-l-4 border-l-amber-400',
  LOW: 'border-l-4 border-l-gray-300',
};

const isOverdue = (dueDate: string | null) =>
  !!dueDate && new Date(dueDate) < new Date(new Date().toDateString());

const isDueSoon = (dueDate: string | null) => {
  if (!dueDate) return false;
  const diff = (new Date(dueDate).getTime() - new Date().getTime()) / 86400000;
  return diff >= 0 && diff <= 3;
};

const dueDateStyle = (task: Task) => {
  if (task.status === 'COMPLETED') return 'text-monday-text-secondary line-through';
  if (isOverdue(task.dueDate)) return 'text-red-600 font-medium';
  if (isDueSoon(task.dueDate)) return 'text-amber-600 font-medium';
  return 'text-monday-text-secondary';
};

const SELECT_CLS = 'rounded-monday-md border border-gray-300 px-monday-3 py-monday-1 text-monday-sm bg-white focus:outline-none focus:ring-2 focus:ring-uipro-cta cursor-pointer';
const TEXTAREA_CLS = 'w-full rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta resize-none bg-white';

const MANAGER_ROLES = ['ADMIN', 'DIRECTOR'];
const isManagerRole = (role?: string | null) => !!role && MANAGER_ROLES.includes(role.toUpperCase());

// ── AssigneePicker ────────────────────────────────────────────────────────────

interface AssigneePickerProps {
  value: string;
  onChange: (id: string) => void;
  members: TeamMember[];
  selfId: string;
}

const AssigneePicker: React.FC<AssigneePickerProps> = ({ value, onChange, members, selfId }) => (
  <div className="flex flex-col gap-monday-1">
    <label className="text-monday-xs font-medium text-monday-text-secondary">指派给</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.displayName}{m.id === selfId ? '（我）' : ''}
        </option>
      ))}
    </select>
  </div>
);

// ── CreateForm ────────────────────────────────────────────────────────────────

interface CreateFormProps {
  onSave: (dto: CreateTaskDto) => void;
  onCancel: () => void;
  saving: boolean;
  isManager: boolean;
  members: TeamMember[];
  selfId: string;
  initialValues?: { title?: string; interactionId?: string };
}

const CreateForm: React.FC<CreateFormProps> = ({ onSave, onCancel, saving, isManager, members, selfId, initialValues }) => {
  const [title, setTitle] = useState(initialValues?.title || '');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState(selfId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.warning('标题不能为空'); return; }
    onSave({
      title,
      description: description || undefined,
      priority,
      dueDate: dueDate || undefined,
      assigneeId: isManager ? assigneeId : undefined,
      interactionId: initialValues?.interactionId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-monday-3 p-monday-4 bg-monday-bg/60 rounded-monday-lg border border-gray-200 shadow-sm">
      {initialValues?.interactionId && (
        <div className="flex items-center gap-monday-2 text-monday-xs text-uipro-cta bg-uipro-cta/5 border border-uipro-cta/20 rounded-monday-md px-monday-3 py-monday-2">
          <LinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span>此任务将关联到对应的互动记录</span>
        </div>
      )}
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="任务标题 *"
        className="w-full"
        autoFocus
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="备注说明（可选）"
        rows={2}
        className={TEXTAREA_CLS}
      />
      <div className="flex gap-monday-4 flex-wrap items-end">
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs font-medium text-monday-text-secondary">优先级</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={SELECT_CLS}>
            <option value="HIGH">高</option>
            <option value="MEDIUM">中</option>
            <option value="LOW">低</option>
          </select>
        </div>
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs font-medium text-monday-text-secondary">截止日期</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
        </div>
        {isManager && members.length > 0 && (
          <AssigneePicker value={assigneeId} onChange={setAssigneeId} members={members} selfId={selfId} />
        )}
        <div className="flex items-end gap-monday-2 ml-auto">
          <Button variant="outline" size="sm" type="button" onClick={onCancel}>取消</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving}>
            {saving ? '保存中…' : '保存任务'}
          </Button>
        </div>
      </div>
    </form>
  );
};

// ── EditForm ──────────────────────────────────────────────────────────────────

interface EditFormProps {
  task: Task;
  onSave: (id: string, dto: any) => void;
  onCancel: () => void;
  saving: boolean;
  isManager: boolean;
  members: TeamMember[];
  selfId: string;
}

const EditForm: React.FC<EditFormProps> = ({ task, onSave, onCancel, saving, isManager, members, selfId }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [assigneeId, setAssigneeId] = useState(task.assigneeId || selfId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.warning('标题不能为空'); return; }
    onSave(task.id, {
      title,
      description: description || undefined,
      priority,
      status,
      dueDate: dueDate || null,
      ...(isManager ? { assigneeId } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-monday-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="任务标题 *" className="w-full" autoFocus />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="备注说明（可选）"
        rows={2}
        className={TEXTAREA_CLS}
      />
      <div className="flex gap-monday-4 flex-wrap items-end">
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs font-medium text-monday-text-secondary">优先级</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className={SELECT_CLS}>
            <option value="HIGH">高</option>
            <option value="MEDIUM">中</option>
            <option value="LOW">低</option>
          </select>
        </div>
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs font-medium text-monday-text-secondary">状态</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={SELECT_CLS}>
            <option value="PENDING">待办</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">已完成</option>
          </select>
        </div>
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs font-medium text-monday-text-secondary">截止日期</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
        </div>
        {isManager && members.length > 0 && (
          <AssigneePicker value={assigneeId} onChange={setAssigneeId} members={members} selfId={selfId} />
        )}
        <div className="flex items-end gap-monday-2 ml-auto">
          <Button variant="outline" size="sm" type="button" onClick={onCancel}>取消</Button>
          <Button variant="primary" size="sm" type="submit" disabled={saving}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </div>
    </form>
  );
};

// ── TaskRow ───────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  editingId: string | null;
  onSaveEdit: (id: string, dto: any) => void;
  onCancelEdit: () => void;
  saving: boolean;
  showAssignee: boolean;
  isManager: boolean;
  members: TeamMember[];
  selfId: string;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task, onToggleComplete, onEdit, onDelete,
  editingId, onSaveEdit, onCancelEdit, saving,
  showAssignee, isManager, members, selfId,
}) => {
  const completed = task.status === 'COMPLETED';

  if (editingId === task.id) {
    return (
      <div className="p-monday-4 border-b border-gray-100">
        <EditForm
          task={task}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          saving={saving}
          isManager={isManager}
          members={members}
          selfId={selfId}
        />
      </div>
    );
  }

  const overdue = !completed && isOverdue(task.dueDate);

  return (
    <div className={`flex items-start gap-monday-3 px-monday-4 py-monday-3 border-b border-gray-100 hover:bg-monday-bg/50 transition-colors duration-150 group ${PRIORITY_LEFT_BORDER[task.priority]} ${completed ? 'opacity-55' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task)}
        aria-label={completed ? '标记为未完成' : '标记为完成'}
        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-uipro-cta focus:ring-offset-1 ${
          completed
            ? 'bg-uipro-cta border-uipro-cta scale-105'
            : 'border-gray-300 hover:border-uipro-cta hover:bg-uipro-cta/5'
        }`}
      >
        {completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-monday-2 flex-wrap">
          <span className={`text-monday-base font-medium leading-snug ${completed ? 'line-through text-monday-text-secondary' : 'text-monday-text'}`}>
            {task.title}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-monday-xs font-medium ${PRIORITY_BADGE[task.priority]}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.status === 'IN_PROGRESS' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-monday-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              进行中
            </span>
          )}
          {showAssignee && task.assigneeName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-monday-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200">
              <UserIcon className="w-3 h-3" />
              {task.assigneeName}
            </span>
          )}
        </div>

        {task.description && (
          <p className="text-monday-sm text-monday-text-secondary mt-monday-1 truncate leading-relaxed">{task.description}</p>
        )}

        {task.dueDate && (
          <p className={`inline-flex items-center gap-1 text-monday-xs mt-monday-1 ${dueDateStyle(task)}`}>
            {overdue ? (
              <AlertTriangleIcon className="w-3.5 h-3.5 flex-shrink-0" />
            ) : isDueSoon(task.dueDate) && !completed ? (
              <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
            ) : null}
            {overdue ? '已逾期 · ' : ''}
            截止 {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('zh-CN')}
          </p>
        )}
        {task.interactionId && (
          <Link
            to={`/interactions/${task.interactionId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-monday-xs text-uipro-cta hover:underline mt-monday-1"
          >
            <LinkIcon />
            查看关联互动记录
          </Link>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-monday-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={() => onEdit(task)}
          aria-label="编辑"
          className="inline-flex items-center gap-1 px-monday-2 py-monday-1 rounded-monday-md text-monday-xs text-monday-text-secondary hover:text-monday-text hover:bg-gray-100 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-uipro-cta"
        >
          <PencilIcon />
          编辑
        </button>
        <button
          onClick={() => onDelete(task)}
          aria-label="删除"
          className="inline-flex items-center gap-1 px-monday-2 py-monday-1 rounded-monday-md text-monday-xs text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <TrashIcon />
          删除
        </button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const TasksPage: React.FC = () => {
  const { token, user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const manager = isManagerRole(user?.role);
  const selfId = user?.id || '';

  const createFrom = (location.state as { createFrom?: { interactionId: string; title: string } } | null)?.createFrom;

  const [showCreate, setShowCreate] = useState(!!createFrom);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('self');

  // Load team members for manager
  const { data: members = [] } = useQuery({
    queryKey: ['tasks-team-members'],
    queryFn: () => tasksService.getTeamMembers(token!),
    enabled: !!token && manager,
  });

  const effectiveAssigneeId = !manager
    ? undefined
    : assigneeFilter === 'self'
    ? selfId
    : assigneeFilter === 'all'
    ? undefined
    : assigneeFilter;

  const showAssignee = manager && assigneeFilter !== 'self';

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', effectiveAssigneeId ?? 'all'],
    queryFn: () => {
      if (!token) throw new Error('未登录');
      return tasksService.getAll(token, effectiveAssigneeId);
    },
    enabled: !!token,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const createMutation = useMutation({
    mutationFn: (dto: CreateTaskDto) => tasksService.create(token!, dto),
    onSuccess: () => { toast.success('任务已创建'); setShowCreate(false); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: any }) => tasksService.update(token!, id, dto),
    onSuccess: () => { toast.success('已更新'); setEditingId(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tasksService.remove(token!, id),
    onSuccess: () => { toast.success('已删除'); setDeleteConfirm(null); invalidate(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleToggleComplete = (task: Task) => {
    const next: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    updateMutation.mutate({ id: task.id, dto: { status: next } });
  };

  const filtered = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;
  const pending = filtered.filter((t) => t.status !== 'COMPLETED');
  const completed = filtered.filter((t) => t.status === 'COMPLETED');

  const overdueCount = tasks.filter((t) => t.status !== 'COMPLETED' && isOverdue(t.dueDate)).length;
  const dueSoonCount = tasks.filter((t) => t.status !== 'COMPLETED' && isDueSoon(t.dueDate)).length;

  const listTitle = !manager
    ? '我的待办'
    : assigneeFilter === 'self'
    ? '我的待办'
    : assigneeFilter === 'all'
    ? '全部成员任务'
    : `${members.find((m) => m.id === assigneeFilter)?.displayName ?? ''} 的任务`;

  return (
    <MainLayout title="待办事项">
      <div className="space-y-monday-4">

        {/* Alert bar */}
        {(overdueCount > 0 || dueSoonCount > 0) && (
          <div className="flex gap-monday-3 flex-wrap">
            {overdueCount > 0 && (
              <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-red-50 border border-red-200 rounded-monday-lg shadow-sm">
                <AlertTriangleIcon className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-monday-sm font-semibold">{overdueCount} 项已逾期</span>
              </div>
            )}
            {dueSoonCount > 0 && (
              <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-amber-50 border border-amber-200 rounded-monday-lg shadow-sm">
                <ClockIcon className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span className="text-amber-700 text-monday-sm font-semibold">{dueSoonCount} 项即将到期（3天内）</span>
              </div>
            )}
          </div>
        )}

        {/* Manager: member filter bar */}
        {manager && (
          <Card variant="default" className="px-monday-6 py-monday-3">
            <div className="flex items-center gap-monday-3 flex-wrap">
              <span className="text-monday-sm font-medium text-monday-text-secondary">查看成员：</span>
              <button
                onClick={() => setAssigneeFilter('self')}
                className={`px-monday-3 py-monday-1 rounded-full text-monday-sm font-medium transition-colors duration-150 cursor-pointer ${
                  assigneeFilter === 'self'
                    ? 'bg-uipro-cta text-white'
                    : 'bg-gray-100 text-monday-text-secondary hover:bg-gray-200'
                }`}
              >
                我的任务
              </button>
              <button
                onClick={() => setAssigneeFilter('all')}
                className={`px-monday-3 py-monday-1 rounded-full text-monday-sm font-medium transition-colors duration-150 cursor-pointer ${
                  assigneeFilter === 'all'
                    ? 'bg-uipro-cta text-white'
                    : 'bg-gray-100 text-monday-text-secondary hover:bg-gray-200'
                }`}
              >
                全部成员
              </button>
              {members
                .filter((m) => m.id !== selfId)
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setAssigneeFilter(m.id)}
                    className={`inline-flex items-center gap-1 px-monday-3 py-monday-1 rounded-full text-monday-sm font-medium transition-colors duration-150 cursor-pointer ${
                      assigneeFilter === m.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-monday-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    <UserIcon className="w-3 h-3" />
                    {m.displayName}
                  </button>
                ))}
            </div>
          </Card>
        )}

        <Card variant="default" className="p-monday-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-monday-5 flex-wrap gap-monday-3">
            <div className="flex items-center gap-monday-3">
              <h2 className="text-monday-lg font-semibold text-monday-text">{listTitle}</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-1 text-monday-sm bg-white focus:outline-none focus:ring-2 focus:ring-uipro-cta cursor-pointer"
              >
                <option value="">全部状态</option>
                <option value="PENDING">待办</option>
                <option value="IN_PROGRESS">进行中</option>
                <option value="COMPLETED">已完成</option>
              </select>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => { setShowCreate(true); setEditingId(null); }}
              className="inline-flex items-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4" />
              新建任务
            </Button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="mb-monday-5">
              <CreateForm
                onSave={(dto) => createMutation.mutate(dto)}
                onCancel={() => setShowCreate(false)}
                saving={createMutation.isPending}
                isManager={manager}
                members={members}
                selfId={selfId}
                initialValues={createFrom}
              />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-monday-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-monday-md animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="folder"
              title={statusFilter ? `没有${STATUS_LABEL[statusFilter as TaskStatus]}的任务` : '暂无待办任务'}
              description={statusFilter ? '尝试切换状态筛选' : '点击右上角「新建任务」开始记录工作'}
              primaryAction={!statusFilter ? { label: '新建任务', onClick: () => setShowCreate(true) } : undefined}
            />
          ) : (
            <div className="rounded-monday-lg border border-gray-200 overflow-hidden">
              {pending.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggleComplete={handleToggleComplete}
                  onEdit={(t) => { setEditingId(t.id); setShowCreate(false); }}
                  onDelete={setDeleteConfirm}
                  editingId={editingId}
                  onSaveEdit={(id, dto) => updateMutation.mutate({ id, dto })}
                  onCancelEdit={() => setEditingId(null)}
                  saving={updateMutation.isPending}
                  showAssignee={showAssignee}
                  isManager={manager}
                  members={members}
                  selfId={selfId}
                />
              ))}

              {completed.length > 0 && (
                <>
                  {pending.length > 0 && (
                    <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-gray-50 border-b border-gray-200">
                      <svg className="w-3.5 h-3.5 text-monday-text-secondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-monday-xs text-monday-text-secondary font-semibold uppercase tracking-wider">
                        已完成（{completed.length}）
                      </span>
                    </div>
                  )}
                  {completed.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onEdit={(t) => { setEditingId(t.id); setShowCreate(false); }}
                      onDelete={setDeleteConfirm}
                      editingId={editingId}
                      onSaveEdit={(id, dto) => updateMutation.mutate({ id, dto })}
                      onCancelEdit={() => setEditingId(null)}
                      saving={updateMutation.isPending}
                      showAssignee={showAssignee}
                      isManager={manager}
                      members={members}
                      selfId={selfId}
                    />
                  ))}
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Delete confirm dialog */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-monday-4 z-50"
          onClick={() => setDeleteConfirm(null)}
          role="presentation"
        >
          <Card
            variant="elevated"
            className="max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-monday-3 mb-monday-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-monday-base font-semibold text-monday-text">确认删除</h3>
                <p className="text-monday-sm text-monday-text-secondary mt-monday-1">
                  确定要删除任务 <strong className="text-monday-text">"{deleteConfirm.title}"</strong>？此操作无法撤销。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-monday-3 pt-monday-2">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700"
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? '删除中…' : '确认删除'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};
