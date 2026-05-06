export type CustomerType = 'BUYER' | 'SUPPLIER';
export type FollowUpStatus = 'ok' | 'soon' | 'overdue' | 'new';

export interface FollowUpItem {
  customerId: string;
  customerName: string;
  customerType: CustomerType;
  ownerId: string | null;
  ownerName: string | null;
  followUpIntervalDays: number;
  lastInteractionDate: string | null;
  daysSinceLastInteraction: number;
  daysUntilNextFollowUp: number;
  followUpStatus: FollowUpStatus;
}

export interface FollowUpAssignee {
  id: string;
  displayName: string;
  email: string;
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const apiBaseUrl =
    (import.meta.env?.VITE_API_BASE_URL as string) ||
    (import.meta.env?.VITE_BACKEND_URL as string) ||
    '/api';
  const res = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `请求失败 (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const followUpService = {
  getList: (token: string, ownerFilter?: string) => {
    const qs = ownerFilter ? `?owner=${ownerFilter}` : '';
    return request<FollowUpItem[]>(`/workspace/follow-up${qs}`, token);
  },

  getAssignees: (token: string) =>
    request<FollowUpAssignee[]>('/workspace/follow-up/assignees', token),

  assignConfig: (
    token: string,
    customerId: string,
    payload: { ownerId?: string | null; followUpIntervalDays?: number },
  ) =>
    request<void>(`/workspace/follow-up/${customerId}/config`, token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

export const FOLLOW_UP_INTERVALS = [
  { value: 15, label: '半月（15天）' },
  { value: 30, label: '月度（30天）' },
  { value: 60, label: '双月（60天）' },
  { value: 90, label: '季度（90天）' },
] as const;
