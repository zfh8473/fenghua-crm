/**
 * Vercel Serverless 入口：将任意路径的请求转发到 Nest 的 handler。
 * vercel.json: rewrites  "/:path*" -> "/api?__path=:path*"；到达时 req 带 __path/_path/path，
 * 此处还原到 req.url 使 Nest 匹配 /health、/auth/login。nest build 输出 dist/src/main.js
 */
const path = require('path');

let rawHandler;
try {
  const mainPath = path.join(__dirname, '..', 'dist', 'src', 'main');
  const entry = require(mainPath);
  rawHandler = entry.default || entry;
} catch (e) {
  console.error('[api/index] require(dist/src/main) failed:', e?.message || String(e));
  rawHandler = null;
}

/** Vercel 可能传 __path、_path 或 path，按优先级读取；用于还原 req.url 供 Nest 路由 */
const PATH_KEYS = ['__path', '_path', 'path'];

/**
 * 从 /api?__path=health、req.query.__path 或 req.query._path、req.query.path 还原出 /health、/auth/login，
 * 写回 req.url。Vercel 可能把 query 放在 req.query 且 param 名未必是 __path，故兼容 __path、_path、path。
 * 使用 WHATWG URL 解析，避免 url.parse 的 DEP0169 弃用告警。
 */
function rewriteReqUrlFromPath(req) {
  let p = null;
  let usedKey = null;
  const rest = {};

  if (req.query) {
    for (const k of PATH_KEYS) {
      if (req.query[k] != null) {
        p = req.query[k];
        usedKey = k;
        break;
      }
    }
    if (usedKey) {
      const q = { ...req.query };
      PATH_KEYS.forEach(k => { delete q[k]; });
      Object.assign(rest, q);
      PATH_KEYS.forEach(k => { delete req.query[k]; });
    }
  }
  if (p == null) {
    const u = req.url || '/';
    try {
      const url = new URL(u.startsWith('/') || u.startsWith('?') ? `http://_${u}` : u);
      for (const k of PATH_KEYS) {
        p = url.searchParams.get(k);
        if (p != null) break;
      }
      if (p != null) {
        PATH_KEYS.forEach(k => url.searchParams.delete(k));
        url.searchParams.forEach((v, k) => {
          if (!PATH_KEYS.includes(k)) rest[k] = v;
        });
        if (req.query) PATH_KEYS.forEach(k => { delete req.query[k]; });
      }
    } catch (_) {}
  }

  if (p != null && String(p) !== '') {
    const qs = Object.keys(rest).length ? '?' + new URLSearchParams(rest).toString() : '';
    const newUrl = (String(p).startsWith('/') ? p : '/' + p) + qs;
    req.url = newUrl;
    req.originalUrl = newUrl;
  }
}

async function handler(req, res) {
  if (!rawHandler) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'LOAD_FAILED', hint: 'Nest handler load failed. Check Vercel build includes dist/ and Function logs.' }));
    return;
  }
  // 临时：便于在 Vercel Logs 确认 __path/_path/path 与还原后的 req.url（确认 404 根因后可删）
  console.log('[api] before rewrite req.url=%s req.query=%j', req.url, req.query ? Object.keys(req.query) : []);
  rewriteReqUrlFromPath(req);
  console.log('[api] after rewrite req.url=%s', req.url);

  if (req.url === '/favicon.ico' || req.url === '/favicon.png') {
    res.statusCode = 204;
    res.end();
    return;
  }
  try {
    await rawHandler(req, res);
  } catch (e) {
    console.error('[api/index] handler/bootstrap error:', e?.message || String(e), e?.stack);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'FUNCTION_INVOCATION_FAILED', hint: 'Check Vercel Function logs (e.g. DATABASE_URL, REDIS_URL, init errors).' }));
    }
  }
}

module.exports = handler;
