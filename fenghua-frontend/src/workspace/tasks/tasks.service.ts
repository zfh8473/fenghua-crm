const API = () =>
  (import.meta.env?.VITE_API_BASE_URL as string) ||
  (import.meta.env?.VITE_BACKEND_URL as string) ||
  '/api';

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null; // YYYY-MM-DD
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | null;
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API()}${path}`, {
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

export const tasksService = {
  getAll: (token: string) =>
    request<Task[]>('/tasks', token),

  create: (token: string, dto: CreateTaskDto) =>
    request<Task>('/tasks', token, {
      method: 'POST',
      body: JSON.stringify(dto),
    }),

  update: (token: string, id: string, dto: UpdateTaskDto) =>
    request<Task>(`/tasks/${id}`, token, {
      method: 'PUT',
      body: JSON.stringify(dto),
    }),

  remove: (token: string, id: string) =>
    request<void>(`/tasks/${id}`, token, { method: 'DELETE' }),
};
