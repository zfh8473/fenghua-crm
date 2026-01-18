/**
 * 共享 API 基地址与 JSON 解析
 * - getApiBaseUrl: 统一 VITE_* 优先级并补全 https，避免请求到前端或相对路径导致返回 HTML
 * - parseJsonResponse: 解析前检测 HTML，避免 "Unexpected token '<', doctype" 等 opaque 报错
 */

const RAW =
  (import.meta.env?.VITE_API_BASE_URL as string) ||
  (import.meta.env?.VITE_BACKEND_URL as string) ||
  (import.meta.env?.VITE_BACKEND_API_URL as string) ||
  'http://localhost:3001';

/** 确保为完整 URL（含协议），否则会当相对路径发到前端域名，返回 index.html 导致 JSON 解析报错 */
export function getApiBaseUrl(): string {
  const u = (RAW || '').trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) return `https://${u}`;
  return u;
}

/**
 * 替代 response.json()：先 text 再 parse，若为 HTML 则抛出明确错误，便于排查 VITE_BACKEND_URL / 404 等
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (response.status === 204 || !text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    const head = (text || '').trimStart().toLowerCase();
    if (head.startsWith('<!') || head.startsWith('<!doctype'))
      throw new Error(
        '接口返回了 HTML 而非 JSON，通常表示请求到了前端页面或 404。请确认 VITE_BACKEND_URL 已正确配置并重新部署前端。'
      );
    throw new Error(`JSON 解析失败，响应前缀: ${text.slice(0, 80)}...`);
  }
}
