/**
 * Vercel Serverless 入口：将任意路径的请求转发到 Nest 的 handler。
 * 配合 vercel.json 的 rewrites，使 /health、/auth/login 等能到达 Nest 应用。
 * nest build 输出为 dist/src/main.js
 */
const entry = require('../dist/src/main');
const handler = entry.default || entry;
module.exports = handler;
