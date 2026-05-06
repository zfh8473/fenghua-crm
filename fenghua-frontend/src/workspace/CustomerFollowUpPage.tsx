import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { MainLayout } from '../components/layout/MainLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import {
  followUpService,
  FollowUpItem,
  FollowUpAssignee,
  FollowUpStatus,
  FOLLOW_UP_INTERVALS,
} from './follow-up.service';
import { toast } from 'react-toastify';

// ── Icons ──────────────────────────────────────────────────────────────────────

const UserIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const PencilIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = ({ className = 'w-3.5 h-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<FollowUpStatus, { label: string; badgeCls: string; barCls: string; rowCls: string }> = {
  overdue: {
    label: '已逾期',
    badgeCls: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    barCls: 'bg-red-500',
    rowCls: 'border-l-4 border-l-red-400',
  },
  soon: {
    label: '即将到期',
    badgeCls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    barCls: 'bg-amber-500',
    rowCls: 'border-l-4 border-l-amber-400',
  },
  ok: {
    label: '正常',
    badgeCls: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    barCls: 'bg-green-500',
    rowCls: 'border-l-4 border-l-green-300',
  },
  new: {
    label: '从未联系',
    badgeCls: 'bg-gray-100 text-gray-500 ring-1 ring-gray-200',
    barCls: 'bg-gray-400',
    rowCls: 'border-l-4 border-l-gray-300',
  },
};

const SELECT_CLS = 'rounded-monday-md border border-gray-300 px-monday-3 py-monday-1 text-monday-sm bg-white focus:outline-none focus:ring-2 focus:ring-uipro-cta cursor-pointer';

const MANAGER_ROLES = ['ADMIN', 'DIRECTOR'];
const isManagerRole = (role?: string | null) => !!role && MANAGER_ROLES.includes(role.toUpperCase());

// ── Inline config row ──────────────────────────────────────────────────────���───

interface ConfigRowProps {
  item: FollowUpItem;
  assignees: FollowUpAssignee[];
  onSave: (ownerId: string | null, intervalDays: number) => void;
  onCancel: () => void;
  saving: boolean;
  selfId: string;
}

const ConfigRow: React.FC<ConfigRowProps> = ({ item, assignees, onSave, onCancel, saving, selfId }) => {
  const [ownerId, setOwnerId] = useState<string>(item.ownerId || '');
  const [intervalDays, setIntervalDays] = useState<number>(item.followUpIntervalDays);

  return (
    <div className="flex items-center gap-monday-3 flex-wrap">
      <div className="flex flex-col gap-monday-1">
        <label className="text-monday-xs text-monday-text-secondary">负责人</label>
        <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={SELECT_CLS}>
          <option value="">未分配</option>
          {assignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName}{a.id === selfId ? '（我）' : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-monday-1">
        <label className="text-monday-xs text-monday-text-secondary">跟进周期</label>
        <select
          value={intervalDays}
          onChange={(e) => setIntervalDays(Number(e.target.value))}
          className={SELECT_CLS}
        >
          {FOLLOW_UP_INTERVALS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="flex items-end gap-monday-1 pb-0.5">
        <button
          onClick={() => onSave(ownerId || null, intervalDays)}
          disabled={saving}
          className="inline-flex items-center gap-1 px-monday-2 py-monday-1 rounded-monday-md text-monday-xs text-green-700 hover:bg-green-50 transition-colors cursor-pointer"
        >
          <CheckIcon />{saving ? '保存中…' : '保存'}
        </button>
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1 px-monday-2 py-monday-1 rounded-monday-md text-monday-xs text-monday-text-secondary hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <XIcon />取消
        </button>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────────

export const CustomerFollowUpPage: React.FC = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const manager = isManagerRole(user?.role);
  const selfId = user?.id || '';

  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: assignees = [] } = useQuery({
    queryKey: ['follow-up-assignees'],
    queryFn: () => followUpService.getAssignees(token!),
    enabled: !!token && manager,
  });

  const effectiveFilter = !manager ? undefined : ownerFilter === 'all' ? undefined : ownerFilter;

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['follow-up', effectiveFilter ?? 'all'],
    queryFn: () => followUpService.getList(token!, effectiveFilter),
    enabled: !!token,
    staleTime: 2 * 60 * 1000,
  });

  const configMutation = useMutation({
    mutationFn: ({ customerId, ownerId, intervalDays }: { customerId: string; ownerId: string | null; intervalDays: number }) =>
      followUpService.assignConfig(token!, customerId, { ownerId, followUpIntervalDays: intervalDays }),
    onSuccess: () => {
      toast.success('配置已保存');
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['follow-up'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const overdueCount = items.filter((i) => i.followUpStatus === 'overdue').length;
  const soonCount = items.filter((i) => i.followUpStatus === 'soon').length;

  const pageTitle = !manager
    ? '我的跟进客户'
    : ownerFilter === 'all'
    ? '全部客户跟进'
    : ownerFilter === 'unassigned'
    ? '未分配客户'
    : `${assignees.find((a) => a.id === ownerFilter)?.displayName ?? ''} 的客户`;

  return (
    <MainLayout title="客户跟进">
      <div className="space-y-monday-4">

        {/* Alert bar */}
        {(overdueCount > 0 || soonCount > 0) && (
          <div className="flex gap-monday-3 flex-wrap">
            {overdueCount > 0 && (
              <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-red-50 border border-red-200 rounded-monday-lg shadow-sm">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span className="text-red-700 text-monday-sm font-semibold">{overdueCount} 个客户跟进已逾期</span>
              </div>
            )}
            {soonCount > 0 && (
              <div className="flex items-center gap-monday-2 px-monday-4 py-monday-2 bg-amber-50 border border-amber-200 rounded-monday-lg shadow-sm">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span className="text-amber-700 text-monday-sm font-semibold">{soonCount} 个客户 7 天内需跟进</span>
              </div>
            )}
          </div>
        )}

        {/* Manager: owner filter bar */}
        {manager && (
          <Card variant="default" className="px-monday-6 py-monday-3">
            <div className="flex items-center gap-monday-3 flex-wrap">
              <span className="text-monday-sm font-medium text-monday-text-secondary">查看：</span>
              {(['all', 'unassigned'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => { setOwnerFilter(key); setEditingId(null); }}
                  className={`px-monday-3 py-monday-1 rounded-full text-monday-sm font-medium transition-colors duration-150 cursor-pointer ${
                    ownerFilter === key
                      ? 'bg-uipro-cta text-white'
                      : 'bg-gray-100 text-monday-text-secondary hover:bg-gray-200'
                  }`}
                >
                  {key === 'all' ? '全部客户' : '未分配'}
                </button>
              ))}
              {assignees.map((a) => (
                <button
                  key={a.id}
                  onClick={() => { setOwnerFilter(a.id); setEditingId(null); }}
                  className={`inline-flex items-center gap-1 px-monday-3 py-monday-1 rounded-full text-monday-sm font-medium transition-colors duration-150 cursor-pointer ${
                    ownerFilter === a.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-monday-text-secondary hover:bg-gray-200'
                  }`}
                >
                  <UserIcon className="w-3 h-3" />
                  {a.displayName}{a.id === selfId ? '（我）' : ''}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Main table */}
        <Card variant="default" className="p-monday-6">
          <div className="flex items-center justify-between mb-monday-5">
            <h2 className="text-monday-lg font-semibold text-monday-text">{pageTitle}</h2>
            {!isLoading && (
              <span className="text-monday-sm text-monday-text-secondary">共 {items.length} 个客户</span>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-monday-2 p-monday-4 bg-red-50 border border-red-200 rounded-monday-md text-red-700 text-monday-sm mb-monday-4">
              {error instanceof Error ? error.message : '加载失败'}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-monday-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-monday-md animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon="users"
              title={manager ? '当前筛选下没有客户' : '暂无分配给你的客户'}
              description={manager ? '可切换上方筛选查看其他成员或未分配客户' : '请联系管理员为你分配需要跟进的客户'}
            />
          ) : (
            <div className="rounded-monday-lg border border-gray-200 overflow-hidden">
              {/* Table header */}
              <div className="bg-monday-bg border-b border-gray-200 grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-monday-4 px-monday-4 py-monday-3">
                <span className="text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">客户名称</span>
                {manager && <span className="text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">负责人</span>}
                <span className="text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">上次联系</span>
                <span className="text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">跟进状态</span>
                {manager && <span className="text-monday-xs font-semibold text-monday-text-secondary uppercase tracking-wider">操作</span>}
              </div>

              {items.map((item) => {
                const cfg = STATUS_CONFIG[item.followUpStatus];
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.customerId}
                    className={`border-b border-gray-100 last:border-b-0 ${cfg.rowCls} transition-colors duration-150 group`}
                  >
                    {isEditing ? (
                      <div className="px-monday-4 py-monday-3 bg-monday-bg/40">
                        <div className="flex items-center gap-monday-3 mb-monday-3">
                          <span className="font-medium text-monday-text">{item.customerName}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-monday-xs font-medium ${
                            item.customerType === 'BUYER'
                              ? 'bg-uipro-cta/10 text-uipro-cta ring-1 ring-uipro-cta/20'
                              : 'bg-semantic-success/10 text-semantic-success ring-1 ring-semantic-success/20'
                          }`}>
                            {item.customerType === 'BUYER' ? '采购商' : '供应商'}
                          </span>
                        </div>
                        <ConfigRow
                          item={item}
                          assignees={assignees}
                          selfId={selfId}
                          saving={configMutation.isPending}
                          onCancel={() => setEditingId(null)}
                          onSave={(ownerId, intervalDays) =>
                            configMutation.mutate({ customerId: item.customerId, ownerId, intervalDays })
                          }
                        />
                      </div>
                    ) : (
                      <div className={`grid px-monday-4 py-monday-3 hover:bg-monday-bg/50 ${manager ? 'grid-cols-[2fr_1fr_1fr_1fr_auto]' : 'grid-cols-[2fr_1fr_1fr]'} gap-monday-4 items-center`}>
                        {/* Customer name */}
                        <div
                          className="flex items-center gap-monday-2 cursor-pointer"
                          onClick={() => navigate(`/customers?customerId=${item.customerId}`)}
                        >
                          <span className="text-monday-sm font-medium text-uipro-cta hover:underline">{item.customerName}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-monday-xs font-medium ${
                            item.customerType === 'BUYER'
                              ? 'bg-uipro-cta/10 text-uipro-cta ring-1 ring-uipro-cta/20'
                              : 'bg-semantic-success/10 text-semantic-success ring-1 ring-semantic-success/20'
                          }`}>
                            {item.customerType === 'BUYER' ? '采购商' : '供应商'}
                          </span>
                        </div>

                        {/* Owner (manager only) */}
                        {manager && (
                          <div className="flex items-center gap-1 text-monday-sm text-monday-text-secondary">
                            {item.ownerName ? (
                              <>
                                <UserIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{item.ownerName}</span>
                              </>
                            ) : (
                              <span className="text-gray-400 italic text-monday-xs">未分配</span>
                            )}
                          </div>
                        )}

                        {/* Last contact */}
                        <div className="text-monday-sm text-monday-text-secondary">
                          {item.lastInteractionDate
                            ? new Date(item.lastInteractionDate + 'T00:00:00').toLocaleDateString('zh-CN')
                            : <span className="text-gray-400 italic text-monday-xs">从未联系</span>}
                        </div>

                        {/* Follow-up status */}
                        <div className="flex items-center gap-monday-3">
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className={`h-full rounded-full ${cfg.barCls}`}
                              style={{
                                width: item.followUpStatus === 'new'
                                  ? '100%'
                                  : `${Math.min(100, Math.max(4, (item.daysSinceLastInteraction / (item.followUpIntervalDays * 1.5)) * 100))}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center gap-monday-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-monday-xs font-medium ${cfg.badgeCls}`}>
                              {cfg.label}
                            </span>
                            {item.followUpStatus !== 'new' && (
                              <span className="text-monday-xs text-monday-text-secondary tabular-nums">
                                {item.followUpStatus === 'overdue'
                                  ? `逾期 ${Math.abs(item.daysUntilNextFollowUp)} 天`
                                  : item.followUpStatus === 'soon'
                                  ? `${item.daysUntilNextFollowUp} 天后`
                                  : `${item.daysUntilNextFollowUp} 天后`}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Edit action (manager only) */}
                        {manager && (
                          <button
                            onClick={() => setEditingId(item.customerId)}
                            className="inline-flex items-center gap-1 px-monday-2 py-monday-1 rounded-monday-md text-monday-xs text-monday-text-secondary hover:text-monday-text hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-uipro-cta"
                          >
                            <PencilIcon />配置
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Legend */}
        {!isLoading && items.length > 0 && (
          <div className="flex items-center gap-monday-3 flex-wrap px-monday-1">
            <span className="text-monday-xs text-monday-text-secondary">跟进状态说明：</span>
            {(['overdue', 'soon', 'ok', 'new'] as const).map((s) => (
              <span key={s} className={`inline-flex items-center px-2 py-0.5 rounded-full text-monday-xs font-medium ${STATUS_CONFIG[s].badgeCls}`}>
                {STATUS_CONFIG[s].label}
                {s === 'overdue' && ' — 超过周期未联系'}
                {s === 'soon' && ' — 7天内需联系'}
                {s === 'ok' && ' — 周期内已联系'}
                {s === 'new' && ' — 尚无互动记录'}
              </span>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
