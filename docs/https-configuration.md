# HTTPS/TLS 配置指南

**日期：** 2026-01-13  
**Story：** 9.4 - 安全传输协议（HTTPS/TLS）

---

## 概述

本指南说明如何为 fenghua-crm 系统配置 HTTPS/TLS 1.2+，确保所有数据传输通过加密连接进行。

---

## 部署平台说明

### Vercel 部署（推荐）

**Vercel 自动提供 HTTPS：**

1. **无需应用代码配置**
   - Vercel 自动为所有部署提供 HTTPS
   - 应用代码已检测 Vercel 平台并跳过 HTTPS 配置
   - 环境变量 `DEPLOYMENT_PLATFORM=vercel` 或 `VERCEL=1` 会自动设置

2. **配置自定义域名**
   - 在 Vercel 控制台添加自定义域名
   - Vercel 自动配置 SSL 证书（Let's Encrypt）
   - 证书自动续期，无需手动管理

3. **验证 HTTPS**
   - 访问 `https://your-domain.com`
   - 检查浏览器地址栏显示安全锁图标
   - HTTP 请求会自动重定向到 HTTPS

4. **证书监控（可选）**
   - Vercel 自动管理证书续期
   - 可配置 Vercel 监控或第三方服务监控证书状态

---

### 独立服务器部署

**需要手动配置 HTTPS：**

#### 1. 配置反向代理（Nginx 推荐）

**安装 Nginx：**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nginx

# CentOS/RHEL
sudo yum install nginx
```

**配置 Nginx：**
```nginx
# /etc/nginx/sites-available/fenghua-crm
server {
    listen 80;
    server_name your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL Certificate paths (configured by Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # TLS Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Proxy to NestJS backend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**启用配置：**
```bash
sudo ln -s /etc/nginx/sites-available/fenghua-crm /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

#### 2. 配置 Let's Encrypt SSL 证书

**安装 Certbot：**
```bash
# Ubuntu/Debian
sudo apt-get install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

**获取证书：**
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

**自动续期：**
```bash
# Certbot 自动配置续期任务
# 验证续期任务
sudo certbot renew --dry-run
```

#### 3. 配置应用环境变量

**创建 `.env.production` 文件：**
```env
NODE_ENV=production
DEPLOYMENT_PLATFORM=standalone
PORT=3001

# HTTPS 配置（如果应用直接处理 HTTPS，通常由 Nginx 处理）
# HTTPS_ENABLED=false  # 通常设置为 false，由 Nginx 处理 HTTPS

# CORS 配置
FRONTEND_URL=https://your-domain.com

# 其他环境变量...
DATABASE_URL=...
JWT_SECRET=...
```

#### 4. 配置证书过期监控

**创建监控脚本：**
```bash
#!/bin/bash
# /usr/local/bin/check-ssl-expiry.sh

DOMAIN="your-domain.com"
DAYS_BEFORE_EXPIRY=30
CERT_PATH="/etc/letsencrypt/live/${DOMAIN}/fullchain.pem"

if [ ! -f "$CERT_PATH" ]; then
    echo "Certificate file not found: $CERT_PATH"
    exit 1
fi

EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_PATH" | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt $DAYS_BEFORE_EXPIRY ]; then
    echo "WARNING: SSL certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days"
    # Send alert (email, webhook, etc.)
    # Example: curl -X POST https://your-monitoring-service/webhook -d "message=SSL expiring"
    exit 1
fi

echo "SSL certificate for $DOMAIN is valid for $DAYS_UNTIL_EXPIRY more days"
exit 0
```

**添加到 cron：**
```bash
# Run daily at 2 AM
0 2 * * * /usr/local/bin/check-ssl-expiry.sh
```

---

## 环境变量配置

### 后端环境变量

**`.env.production`（独立服务器部署）：**
```env
# 部署平台
DEPLOYMENT_PLATFORM=standalone

# HTTPS 配置（如果应用直接处理 HTTPS）
HTTPS_ENABLED=false  # 通常由 Nginx 处理，设置为 false
SSL_CERT_PATH=/path/to/cert.pem  # 仅当 HTTPS_ENABLED=true 时需要
SSL_KEY_PATH=/path/to/key.pem    # 仅当 HTTPS_ENABLED=true 时需要

# HSTS 配置
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true

# CORS 配置
FRONTEND_URL=https://your-domain.com
```

**`.env.production`（Vercel 部署）：**
```env
# 部署平台（Vercel 自动设置）
DEPLOYMENT_PLATFORM=vercel
# 或
VERCEL=1

# HTTPS 由 Vercel 自动处理，无需配置
# CORS 配置
FRONTEND_URL=https://your-vercel-domain.vercel.app
```

### 前端环境变量

**`.env.production`：**
```env
# API 基础 URL（生产环境使用 HTTPS）
VITE_API_BASE_URL=https://your-backend-domain.com
# 或
VITE_BACKEND_URL=https://your-backend-domain.com
```

**`.env.development`：**
```env
# API 基础 URL（开发环境可以使用 HTTP）
VITE_API_BASE_URL=http://localhost:3001
# 或
VITE_BACKEND_URL=http://localhost:3001
```

---

## 验证 HTTPS 配置

### 1. 功能验证

**测试 HTTP 到 HTTPS 重定向：**
```bash
curl -I http://your-domain.com
# 应该返回 301 重定向到 HTTPS
```

**测试 HTTPS 连接：**
```bash
curl -I https://your-domain.com
# 应该返回 200 OK
```

**测试 API 请求：**
```bash
curl https://your-domain.com/api/health
# 应该返回健康检查响应
```

### 2. 安全验证

**使用 SSL Labs 测试：**
1. 访问 https://www.ssllabs.com/ssltest/
2. 输入您的域名
3. 等待测试完成
4. 验证：
   - TLS 版本 >= 1.2
   - 加密套件安全性
   - HSTS 头配置
   - 证书有效性

**检查安全头：**
```bash
curl -I https://your-domain.com | grep -i "strict-transport-security"
# 应该显示 HSTS 头
```

### 3. 性能验证

**测试 TLS 握手性能：**
```bash
# 使用 curl 测试连接时间
time curl -o /dev/null -s -w "%{time_connect}\n" https://your-domain.com
```

---

## 故障排除

### 问题 1: 证书加载失败

**症状：** 应用启动时显示 "SSL certificate file not found"

**解决方案：**
1. 检查证书文件路径是否正确
2. 验证文件权限（应用用户需要读取权限）
3. 确认证书文件格式正确（PEM 格式）

### 问题 2: HTTP 重定向循环

**症状：** 浏览器显示重定向循环错误

**解决方案：**
1. 检查 Nginx 配置中的 `X-Forwarded-Proto` 头设置
2. 确认应用代码中 `trust proxy` 已配置
3. 验证反向代理配置正确

### 问题 3: CORS 错误

**症状：** 前端请求被 CORS 策略阻止

**解决方案：**
1. 检查 `FRONTEND_URL` 环境变量是否正确（必须使用 HTTPS）
2. 验证生产环境 CORS 配置仅允许 HTTPS 源
3. 确认前端使用 HTTPS URL 调用 API

### 问题 4: 证书过期

**症状：** 浏览器显示证书过期警告

**解决方案：**
1. 检查 Let's Encrypt 续期任务是否正常运行
2. 手动续期：`sudo certbot renew`
3. 重新加载 Nginx：`sudo systemctl reload nginx`

---

## 最佳实践

1. **始终使用 HTTPS 生产环境**
   - 开发环境可以使用 HTTP（localhost）
   - 生产环境必须使用 HTTPS

2. **定期检查证书状态**
   - 配置证书过期监控
   - 在证书到期前 30 天收到通知

3. **保持 TLS 配置更新**
   - 使用 TLS 1.2 或更高版本
   - 禁用不安全的加密套件
   - 定期更新 Nginx 和 Node.js

4. **配置 HSTS**
   - 设置合理的 `max-age`（推荐 1 年）
   - 考虑使用 `includeSubDomains`

5. **监控和日志**
   - 监控 HTTPS 连接状态
   - 记录证书续期事件
   - 跟踪 HTTPS 相关错误

---

## 参考资源

- [Let's Encrypt 文档](https://letsencrypt.org/docs/)
- [Nginx SSL 配置指南](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)

---

## 相关 Story

- **Story 9.1：** 数据访问审计日志（可集成 HTTPS/TLS 事件审计）
- **Story 9.2：** 数据修改审计日志（可集成 HTTPS/TLS 配置变更审计）
- **Story 9.3：** 敏感数据加密存储（数据加密存储）
- **Story 9.4：** 安全传输协议（本 Story，传输加密）
