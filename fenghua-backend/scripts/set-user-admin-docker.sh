#!/bin/bash

# ============================================
# 通过 Docker 设置用户为管理员
# ============================================
# 
# 用途：如果 Twenty CRM 运行在 Docker 中，使用此脚本
# 
# 使用方法：
#   ./scripts/set-user-admin-docker.sh zfh8473@gmail.com
# ============================================

set -e

USER_EMAIL="${1:-zfh8473@gmail.com}"

echo "=== Set User as Admin (Docker) ==="
echo "User Email: ${USER_EMAIL}"

# 检查 Docker 是否运行
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

# 查找 Twenty CRM 数据库容器
DB_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i "twenty.*db\|postgres" | head -1)

if [ -z "$DB_CONTAINER" ]; then
    echo "❌ Could not find Twenty CRM database container"
    echo "   Please check if Twenty CRM is running in Docker"
    exit 1
fi

echo "✅ Found database container: ${DB_CONTAINER}"

# 执行 SQL 脚本
echo ""
echo "=== Executing SQL update ==="

# Try to find the correct database name (usually 'default' for Twenty CRM)
DB_NAME=$(docker exec "${DB_CONTAINER}" psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datistemplate = false AND datname NOT IN ('postgres') ORDER BY datname LIMIT 1;" 2>/dev/null | tr -d ' \n')

if [ -z "$DB_NAME" ]; then
    echo "⚠️  Could not auto-detect database name, trying 'default'"
    DB_NAME="default"
else
    echo "✅ Found database: ${DB_NAME}"
fi

docker exec -i "${DB_CONTAINER}" psql -U postgres -d "${DB_NAME}" <<EOF
-- Step 1: Find user
DO \$\$
DECLARE
    v_user_id UUID;
    v_workspace_member_id UUID;
    v_admin_role_id UUID;
BEGIN
    -- Find user
    SELECT u.id, wm.id INTO v_user_id, v_workspace_member_id
    FROM "user" u
    LEFT JOIN "workspaceMember" wm ON wm."userId" = u.id
    WHERE LOWER(u.email) = LOWER('${USER_EMAIL}');
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User ${USER_EMAIL} not found';
    END IF;
    
    IF v_workspace_member_id IS NULL THEN
        RAISE EXCEPTION 'Workspace member not found for user ${USER_EMAIL}';
    END IF;
    
    -- Find ADMIN role
    SELECT id INTO v_admin_role_id
    FROM "workspaceRole"
    WHERE UPPER(name) LIKE '%ADMIN%'
    ORDER BY "createdAt" ASC
    LIMIT 1;
    
    IF v_admin_role_id IS NULL THEN
        RAISE EXCEPTION 'ADMIN role not found';
    END IF;
    
    -- Remove old roles
    DELETE FROM "_workspaceMemberToWorkspaceRole"
    WHERE "A" = v_workspace_member_id;
    
    -- Add ADMIN role
    INSERT INTO "_workspaceMemberToWorkspaceRole" ("A", "B")
    VALUES (v_workspace_member_id, v_admin_role_id)
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'User ${USER_EMAIL} has been set as ADMIN';
END \$\$;

-- Verify
SELECT 
    u.email,
    u."firstName",
    u."lastName",
    wr.name as role_name
FROM 
    "user" u
JOIN 
    "workspaceMember" wm ON wm."userId" = u.id
JOIN 
    "_workspaceMemberToWorkspaceRole" wmwr ON wmwr."A" = wm.id
JOIN 
    "workspaceRole" wr ON wr.id = wmwr."B"
WHERE 
    LOWER(u.email) = LOWER('${USER_EMAIL}');
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ User ${USER_EMAIL} has been set as ADMIN!"
else
    echo ""
    echo "❌ Failed to set user as ADMIN"
    exit 1
fi

