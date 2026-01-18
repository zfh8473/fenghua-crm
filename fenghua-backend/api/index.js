/**
 * Vercel Serverless 入口：将任意路径的请求转发到 Nest 的 handler。
 * vercel.json: rewrites  "/(.*)" -> "/api?__path=$1"；到达时 req.url 为 /api?__path=health 等，
 * 此处把 __path 还原到 req.url，使 Nest 能匹配 /health、/auth/login。nest build 输出 dist/src/main.js
 */
const path = require('path');
const { parse } = require('url');

let rawHandler;
try {
  const mainPath = path.join(__dirname, '..', 'dist', 'src', 'main');
  const entry = require(mainPath);
  rawHandler = entry.default || entry;
} catch (e) {
  console.error('[api/index] require(dist/src/main) failed:', e?.message || String(e));
  rawHandler = null;
}

/**
 * 从 /api?__path=health 或 /api?__path=auth/login 等还原出 /health、/auth/login，
 * 并把其余 query 保留，写回 req.url 供 Express 路由。
 * （Vercel rewrite 后 req.url 为 /api?__path=...，Nest 需原始路径才能匹配）
 */
function rewriteReqUrlFromPath(req) {
  const u = req.url || '/';
  const { query } = parse(u, true);
  const p = query && query.__path;
  if (p != null && p !== '') {
    const rest = { ...query };
    delete rest.__path;
    const qs = Object.keys(rest).length ? '?' + new URLSearchParams(rest).toString() : '';
    req.url = (String(p).startsWith('/') ? p : '/' + p) + qs;
  }
}

async function handler(req, res) {
  if (!rawHandler) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'LOAD_FAILED', hint: 'Nest handler load failed. Check Vercel build includes dist/ and Function logs.' }));
    return;
  }
  rewriteReqUrlFromPath(req);
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
