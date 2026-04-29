import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/AuthContext';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { tasksService, Task, TaskPriority, TaskStatus, CreateTaskDto } from './tasks.service';
import { toast } from 'react-toastify';

// ── helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_LABEL: Record<TaskPriority, string> = { HIGH: '高', MEDIUM: '中', LOW: '低' };
const STATUS_LABEL: Record<TaskStatus, string> = { PENDING: '待办', IN_PROGRESS: '进行中', COMPLETED: '已完成' };

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  LOW: 'bg-gray-100 text-gray-500',
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
  if (isOverdue(task.dueDate)) return 'text-red-600 font-semibold';
  if (isDueSoon(task.dueDate)) return 'text-orange-500 font-medium';
  return 'text-monday-text';
};

// ── CreateForm ────────────────────────────────────────────────────────────────

interface CreateFormProps {
  onSave: (dto: CreateTaskDto) => void;
  onCancel: () => void;
  saving: boolean;
}

const CreateForm: React.FC<CreateFormProps> = ({ onSave, onCancel, saving }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.warning('标题不能为空'); return; }
    onSave({ title, description: description || undefined, priority, dueDate: dueDate || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-monday-3 p-monday-4 bg-uipro-bg rounded-monday-lg border border-gray-200">
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
        className="w-full rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta resize-none"
      />
      <div className="flex gap-monday-3 flex-wrap">
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs text-monday-text-secondary">优先级</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-1 text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta"
          >
            <option value="HIGH">高</option>
            <option value="MEDIUM">中</option>
            <option value="LOW">低</option>
          </select>
        </div>
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs text-monday-text-secondary">截止日期</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-40"
          />
        </div>
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

// ── EditForm ──────────────────────────────────────────────────────────────────

interface EditFormProps {
  task: Task;
  onSave: (id: string, dto: Partial<Task>) => void;
  onCancel: () => void;
  saving: boolean;
}

const EditForm: React.FC<EditFormProps> = ({ task, onSave, onCancel, saving }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState(task.dueDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.warning('标题不能为空'); return; }
    onSave(task.id, {
      title,
      description: description || undefined,
      priority,
      status,
      dueDate: dueDate || null,
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-monday-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="任务标题 *" className="w-full" autoFocus />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="备注说明（可选）"
        rows={2}
        className="w-full rounded-monday-md border border-gray-300 px-monday-3 py-monday-2 text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta resize-none"
      />
      <div className="flex gap-monday-3 flex-wrap">
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs text-monday-text-secondary">优先级</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-1 text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta">
            <option value="HIGH">高</option>
            <option value="MEDIUM">中</option>
            <option value="LOW">低</option>
          </select>
        </div>
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs text-monday-text-secondary">状态</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-1 text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta">
            <option value="PENDING">待办</option>
            <option value="IN_PROGRESS">进行中</option>
            <option value="COMPLETED">已完成</option>
          </select>
        </div>
        <div className="flex flex-col gap-monday-1">
          <label className="text-monday-xs text-monday-text-secondary">截止日期</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
        </div>
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
}

const TaskRow: React.FC<TaskRowProps> = ({ task, onToggleComplete, onEdit, onDelete, editingId, onSaveEdit, onCancelEdit, saving }) => {
  const completed = task.status === 'COMPLETED';

  if (editingId === task.id) {
    return (
      <div className="p-monday-4 border-b border-gray-100">
        <EditForm task={task} onSave={onSaveEdit} onCancel={onCancelEdit} saving={saving} />
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-monday-3 p-monday-4 border-b border-gray-100 hover:bg-monday-bg/40 transition-colors duration-150 group ${completed ? 'opacity-60' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={() => onToggleComplete(task)}
        className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-150 cursor-pointer ${
          completed ? 'bg-uipro-cta border-uipro-cta' : 'border-gray-300 hover:border-uipro-cta'
        }`}
        title={completed ? '标记为未完成' : '标记为完成'}
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
          <span className={`text-monday-base font-medium ${completed ? 'line-through text-monday-text-secondary' : 'text-monday-text'}`}>
            {task.title}
          </span>
          <span className={`px-monday-2 py-0.5 rounded-full text-monday-xs font-medium ${PRIORITY_COLOR[task.priority]}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          {task.status === 'IN_PROGRESS' && (
            <span className="px-monday-2 py-0.5 rounded-full text-monday-xs font-medium bg-blue-100 text-blue-700">进行中</span>
          )}
        </div>
        {task.description && (
          <p className="text-monday-sm text-monday-text-secondary mt-monday-1 truncate">{task.description}</p>
        )}
        {task.dueDate && (
          <p className={`text-monday-xs mt-monday-1 ${dueDateStyle(task)}`}>
            {isOverdue(task.dueDate) && !completed ? '⚠ 已逾期 · ' : ''}
            截止 {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('zh-CN')}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-monday-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <Button variant="ghost" size="sm" onClick={() => onEdit(task)} className="text-monday-text-secondary hover:text-monday-text">编辑</Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(task)} className="text-semantic-error hover:bg-semantic-error/10">删除</Button>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const TasksPage: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => {
      if (!token) throw new Error('未登录');
      return tasksService.getAll(token);
    },
    enabled: !!token,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tasks'] });

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

  return (
    <MainLayout title="待办事项">
      <div className="space-y-monday-4">
        {/* Stats bar */}
        {(overdueCount > 0 || dueSoonCount > 0) && (
          <div className="flex gap-monday-3 flex-wrap">
            {overdueCount > 0 && (
              <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-red-50 border border-red-200 rounded-monday-md">
                <span className="text-red-600 text-monday-sm font-semibold">⚠ {overdueCount} 项已逾期</span>
              </div>
            )}
            {dueSoonCount > 0 && (
              <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-orange-50 border border-orange-200 rounded-monday-md">
                <span className="text-orange-600 text-monday-sm font-semibold">⏰ {dueSoonCount} 项即将到期（3天内）</span>
              </div>
            )}
          </div>
        )}

        <Card variant="default" className="p-monday-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-monday-4 flex-wrap gap-monday-3">
            <div className="flex items-center gap-monday-3">
              <h2 className="text-monday-lg font-semibold text-monday-text">我的待办</h2>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
                className="rounded-monday-md border border-gray-300 px-monday-3 py-monday-1 text-monday-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta"
              >
                <option value="">全部</option>
                <option value="PENDING">待办</option>
                <option value="IN_PROGRESS">进行中</option>
                <option value="COMPLETED">已完成</option>
              </select>
            </div>
            <Button variant="primary" size="sm" onClick={() => { setShowCreate(true); setEditingId(null); }}>
              + 新建任务
            </Button>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="mb-monday-4">
              <CreateForm
                onSave={(dto) => createMutation.mutate(dto)}
                onCancel={() => setShowCreate(false)}
                saving={createMutation.isPending}
              />
            </div>
          )}

          {isLoading ? (
            <div className="space-y-monday-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-monday-12 text-monday-text-secondary">
              {statusFilter ? `没有${STATUS_LABEL[statusFilter as TaskStatus]}的任务` : '暂无任务，点击「新建任务」开始记录'}
            </div>
          ) : (
            <div className="rounded-monday-lg border border-gray-200 overflow-hidden">
              {/* Pending / In-progress tasks */}
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
                />
              ))}

              {/* Completed tasks section */}
              {completed.length > 0 && (
                <>
                  {pending.length > 0 && (
                    <div className="px-monday-4 py-monday-2 bg-gray-50 border-b border-gray-200 text-monday-xs text-monday-text-secondary font-medium uppercase tracking-wider">
                      已完成 ({completed.length})
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
            <h3 className="text-monday-xl font-semibold text-monday-text mb-monday-4">确认删除</h3>
            <p className="text-monday-base text-monday-text mb-monday-6">
              确定要删除任务 <strong>"{deleteConfirm.title}"</strong> 吗？
            </p>
            <div className="flex justify-end gap-monday-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>取消</Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
              >
                确认删除
              </Button>
            </div>
          </Card>
        </div>
      )}
    </MainLayout>
  );
};
