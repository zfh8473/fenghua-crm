/**
 * BullMQ Redis 连接配置工具
 *
 * 从 REDIS_URL 解析出 ioredis 所需的 connection 配置，支持：
 * - rediss://（TLS，Upstash 等托管 Redis 必需）
 * - redis://（本地或非 TLS）
 * - username（Upstash 常用 default）
 * - maxRetriesPerRequest: null（BullMQ 要求）、retryStrategy 退避
 *
 * @see docs/upstash-redis-config.md
 */

export interface BullMQConnectionOptions {
  host: string;
  port: number;
  password?: string;
  username?: string;
  /** 使用 rediss:// 时必须启用，否则 Upstash 等会 ECONNRESET */
  tls?: object;
  /** BullMQ 要求为 null（阻塞连接需要无限重试），设为其他值会被覆盖并打 WARNING */
  maxRetriesPerRequest?: number | null;
  /** 重试间隔（ms），退避以减轻对 Redis 的压力 */
  retryStrategy?: (times: number) => number;
}

export interface ParseRedisUrlOptions {
  /** 当 REDIS_URL 未设置时使用的默认 URL，例如 'redis://localhost:6379' */
  fallback?: string;
  /** 为 true 且最终无有效 URL 时抛出错误 */
  required?: boolean;
}

/**
 * 从 REDIS_URL 解析出 BullMQ/ioredis 的 connection 配置。
 * 若使用 rediss://，会自动加上 tls: {}，以满足 Upstash 等 TLS -only 服务。
 *
 * @param redisUrl - 例如 rediss://default:xxx@host:6379 或 redis://localhost:6379
 * @param options - fallback、required
 * @returns 用于 BullModule.forRootAsync useFactory 的 { connection }
 */
export function parseRedisUrlForBull(
  redisUrl: string | undefined,
  options?: ParseRedisUrlOptions,
): { connection: BullMQConnectionOptions } {
  const { fallback, required = false } = options || {};
  const url = redisUrl || fallback;

  if (!url || url.trim() === '') {
    if (required) {
      throw new Error('REDIS_URL is required for BullMQ');
    }
    // 使用本地默认，便于开发；maxRetriesPerRequest 须为 null 以满足 BullMQ
    return {
      connection: {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 100, 3000),
      },
    };
  }

  try {
    const parsed = new URL(url);
    const port = parseInt(parsed.port || '6379', 10);
    const useTls = parsed.protocol === 'rediss:';

    const connection: BullMQConnectionOptions = {
      host: parsed.hostname,
      port,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      maxRetriesPerRequest: null, // BullMQ 要求 null，否则会覆盖并打 WARNING
      retryStrategy: (times) => Math.min(times * 100, 3000),
    };

    if (useTls) {
      connection.tls = {};
    }

    return { connection };
  } catch (e) {
    if (required) {
      throw new Error(`REDIS_URL is invalid: ${url}. ${e instanceof Error ? e.message : String(e)}`);
    }
    return {
      connection: {
        host: 'localhost',
        port: 6379,
        maxRetriesPerRequest: null,
        retryStrategy: (times) => Math.min(times * 100, 3000),
      },
    };
  }
}
