/**
 * Vercel Serverless 入口：将任意路径的请求转发到 Nest 的 handler。
 * 配合 vercel.json 的 rewrites，使 /health、/auth/login 等能到达 Nest 应用。
 * nest build 输出为 dist/src/main.js
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

async function handler(req, res) {
  if (!rawHandler) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'LOAD_FAILED', hint: 'Nest handler load failed. Check Vercel build includes dist/ and Function logs.' }));
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
