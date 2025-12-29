-- ============================================
-- 设置用户为管理员 - 直接数据库更新脚本
-- ============================================
-- 
-- 用途：直接将用户 zfh8473@gmail.com 设置为管理员
-- 
-- 注意：
-- 1. 此脚本需要直接访问 Twenty CRM 的 PostgreSQL 数据库
-- 2. Twenty CRM 使用 workspace_members 和 workspace_roles 表管理角色
-- 3. 需要先找到用户的 workspace_member_id 和 ADMIN 角色的 role_id
--
-- 使用方法：
-- 1. 连接到 Twenty CRM 数据库（通常是 localhost:5432，数据库名可能是 'twenty' 或类似）
-- 2. 运行此脚本
-- ============================================

-- 步骤 1: 查找用户信息
-- 查找用户 zfh8473@gmail.com 的 user_id 和 workspace_member_id
SELECT 
    u.id as user_id,
    u.email,
    wm.id as workspace_member_id,
    wm."userId" as workspace_user_id
FROM 
    "user" u
LEFT JOIN 
    "workspaceMember" wm ON wm."userId" = u.id
WHERE 
    LOWER(u.email) = LOWER('zfh8473@gmail.com');

-- 步骤 2: 查找 ADMIN 角色 ID
-- 查找 ADMIN 角色的 role_id
SELECT 
    wr.id as role_id,
    wr.name as role_name,
    wr.description
FROM 
    "workspaceRole" wr
WHERE 
    UPPER(wr.name) LIKE '%ADMIN%'
ORDER BY 
    wr."createdAt" ASC
LIMIT 1;

-- 步骤 3: 更新 workspace_member 的角色
-- 注意：需要替换以下变量：
-- - :workspace_member_id: 从步骤 1 获取的 workspace_member_id
-- - :admin_role_id: 从步骤 2 获取的 ADMIN role_id
--
-- 如果 workspace_member 已存在角色，先删除旧角色关联
DELETE FROM 
    "_workspaceMemberToWorkspaceRole"
WHERE 
    "A" = :workspace_member_id;

-- 添加 ADMIN 角色
INSERT INTO 
    "_workspaceMemberToWorkspaceRole" ("A", "B")
VALUES 
    (:workspace_member_id, :admin_role_id)
ON CONFLICT DO NOTHING;

-- 步骤 4: 验证更新结果
-- 验证用户角色是否已更新为 ADMIN
SELECT 
    u.email,
    u."firstName",
    u."lastName",
    wm.id as workspace_member_id,
    wr.name as role_name,
    wr.id as role_id
FROM 
    "user" u
JOIN 
    "workspaceMember" wm ON wm."userId" = u.id
JOIN 
    "_workspaceMemberToWorkspaceRole" wmwr ON wmwr."A" = wm.id
JOIN 
    "workspaceRole" wr ON wr.id = wmwr."B"
WHERE 
    LOWER(u.email) = LOWER('zfh8473@gmail.com');

-- ============================================
-- 完整更新脚本（需要手动替换变量）
-- ============================================
-- 
-- 使用方法：
-- 1. 先运行步骤 1 和 2，获取 workspace_member_id 和 admin_role_id
-- 2. 替换下面的变量并运行
--
-- DO $$
-- DECLARE
--     v_user_id UUID;
--     v_workspace_member_id UUID;
--     v_admin_role_id UUID;
-- BEGIN
--     -- 查找用户
--     SELECT u.id, wm.id INTO v_user_id, v_workspace_member_id
--     FROM "user" u
--     LEFT JOIN "workspaceMember" wm ON wm."userId" = u.id
--     WHERE LOWER(u.email) = LOWER('zfh8473@gmail.com');
--     
--     IF v_user_id IS NULL THEN
--         RAISE EXCEPTION 'User zfh8473@gmail.com not found';
--     END IF;
--     
--     IF v_workspace_member_id IS NULL THEN
--         RAISE EXCEPTION 'Workspace member not found for user zfh8473@gmail.com';
--     END IF;
--     
--     -- 查找 ADMIN 角色
--     SELECT id INTO v_admin_role_id
--     FROM "workspaceRole"
--     WHERE UPPER(name) LIKE '%ADMIN%'
--     ORDER BY "createdAt" ASC
--     LIMIT 1;
--     
--     IF v_admin_role_id IS NULL THEN
--         RAISE EXCEPTION 'ADMIN role not found';
--     END IF;
--     
--     -- 删除旧角色
--     DELETE FROM "_workspaceMemberToWorkspaceRole"
--     WHERE "A" = v_workspace_member_id;
--     
--     -- 添加 ADMIN 角色
--     INSERT INTO "_workspaceMemberToWorkspaceRole" ("A", "B")
--     VALUES (v_workspace_member_id, v_admin_role_id)
--     ON CONFLICT DO NOTHING;
--     
--     RAISE NOTICE 'User zfh8473@gmail.com has been set as ADMIN';
-- END $$;

