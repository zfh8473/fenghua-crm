# 重构实施计划：移除 Twenty CRM 依赖，实现原生技术栈

**项目：** fenghua-crm  
**日期：** 2025-12-26  
**目标：** 移除 Twenty CRM 依赖，使用原生技术栈实现所有功能，支持 Vercel 部署

---

## 📋 执行摘要

### 目标
- ✅ 移除 Twenty CRM 依赖（Docker 容器）
- ✅ 实现原生技术栈（NestJS + PostgreSQL + NextAuth.js）
- ✅ 支持 Vercel 部署（无需 Docker）
- ✅ 保持现有功能完整性
- ✅ 数据迁移（从 Twenty 数据库导出数据）

### 时间估算
- **总时间：** 6-8 周
- **阶段 1：** 数据库设计和迁移脚本（1 周）
- **阶段 2：** 替换认证系统（1-2 周）
- **阶段 3：** 替换用户和角色管理（1 周）
- **阶段 4：** 替换客户和联系人管理（1-2 周）
- **阶段 5：** 更新产品和互动记录（1 周）
- **阶段 6：** 移除 Twenty 依赖和清理（1 周）

---

## 🎯 阶段 1：数据库设计和迁移脚本（1 周）

### 任务 1.1：设计新数据库 Schema

**目标：** 设计完整的数据库结构，替代 Twenty CRM 的数据模型

**需要创建的表：**

#### 1.1.1 用户和认证表

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email_verified BOOLEAN DEFAULT false,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 角色表
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL, -- ADMIN, DIRECTOR, FRONTEND_SPECIALIST, BACKEND_SPECIALIST
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 用户角色关联表（多对多）
CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES users(id),
  PRIMARY KEY (user_id, role_id)
);

-- 索引
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email_verified ON users(email_verified) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
```

#### 1.1.2 客户和联系人表

```sql
-- 客户表（Companies）
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  industry VARCHAR(100),
  employees INTEGER,
  website VARCHAR(255),
  phone VARCHAR(50),
  customer_type VARCHAR(50) NOT NULL, -- SUPPLIER, BUYER
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  
  CONSTRAINT companies_customer_type_check CHECK (customer_type IN ('SUPPLIER', 'BUYER'))
);

-- 联系人表（People）
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  mobile VARCHAR(50),
  job_title VARCHAR(100),
  department VARCHAR(100),
  linkedin_url VARCHAR(255),
  wechat VARCHAR(100),
  notes TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- 索引
CREATE INDEX idx_companies_name ON companies(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_customer_type ON companies(customer_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_companies_domain_name ON companies(domain_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_company_id ON people(company_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_email ON people(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_people_name ON people(first_name, last_name) WHERE deleted_at IS NULL;
```

#### 1.1.3 更新现有表（移除 workspace_id 依赖）

```sql
-- 更新 products 表：移除 workspace_id，添加 created_by/updated_by
ALTER TABLE products 
  DROP COLUMN IF EXISTS workspace_id,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- 更新 product_customer_interactions 表：移除 workspace_id，更新 customer_id 外键
ALTER TABLE product_customer_interactions
  DROP COLUMN IF EXISTS workspace_id,
  DROP CONSTRAINT IF EXISTS fk_interactions_product,
  ADD CONSTRAINT fk_interactions_product FOREIGN KEY (product_id) 
    REFERENCES products(id) ON DELETE RESTRICT,
  ADD CONSTRAINT fk_interactions_customer FOREIGN KEY (customer_id) 
    REFERENCES companies(id) ON DELETE RESTRICT;

-- 更新 file_attachments 表：移除 workspace_id
ALTER TABLE file_attachments
  DROP COLUMN IF EXISTS workspace_id;
```

### 任务 1.2：创建数据库迁移脚本

**文件：** `fenghua-backend/migrations/004-create-users-and-roles-tables.sql`
**文件：** `fenghua-backend/migrations/005-create-companies-and-people-tables.sql`
**文件：** `fenghua-backend/migrations/006-remove-workspace-dependencies.sql`

### 任务 1.3：创建数据迁移脚本

**目标：** 从 Twenty CRM 数据库导出数据并导入到新表

**文件：** `fenghua-backend/scripts/migrate-from-twenty.ts`

**迁移步骤：**

1. **导出用户数据**
   ```sql
   -- 从 Twenty CRM 数据库导出
   SELECT 
     u.id,
     u.email,
     u."firstName" as first_name,
     u."lastName" as last_name,
     u."createdAt" as created_at
   FROM core."user" u;
   ```

2. **导出角色数据**
   ```sql
   -- 从 Twenty CRM 数据库导出
   SELECT 
     r.id,
     r.label as name,
     r.description
   FROM core."role" r;
   ```

3. **导出客户数据**
   ```sql
   -- 从 Twenty CRM 数据库导出
   SELECT 
     c.id,
     c.name,
     c."domainName" as domain_name,
     c.address,
     c.industry,
     c.employees,
     c."createdAt" as created_at
   FROM core."company" c;
   ```

4. **导出联系人数据**
   ```sql
   -- 从 Twenty CRM 数据库导出
   SELECT 
     p.id,
     p."firstName" as first_name,
     p."lastName" as last_name,
     p.email,
     p.phone,
     p."jobTitle" as job_title,
     p."companyId" as company_id,
     p."createdAt" as created_at
   FROM core."person" p;
   ```

5. **导入到新表**
   - 使用 TypeScript 脚本处理数据转换
   - 处理外键关联
   - 验证数据完整性

**验收标准：**
- ✅ 所有迁移脚本创建完成
- ✅ 数据迁移脚本可以成功导出和导入数据
- ✅ 数据完整性验证通过

---

## 🔐 阶段 2：替换认证系统（1-2 周）

### 任务 2.1：实现新的认证服务

**文件：** `fenghua-backend/src/auth/auth.service.ts`（重构）

**功能：**
- 用户注册
- 用户登录（JWT token）
- 密码重置
- Token 验证
- 用户信息获取

**实现：**

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * 用户登录
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // 查询用户
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 验证密码
    const isPasswordValid = await compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    // 生成 JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map(ur => ur.role.name),
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.roles[0]?.role.name || 'USER',
      },
    };
  }

  /**
   * 验证 JWT token
   */
  async validateToken(token: string): Promise<any> {
    try {
      const payload = this.jwtService.verify(token);
      
      // 查询用户信息
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user || user.deleted_at) {
        throw new UnauthorizedException('User not found');
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roles: user.roles.map(ur => ur.role.name),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * 用户注册
   */
  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<AuthResponseDto> {
    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // 加密密码
    const passwordHash = await hash(data.password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password_hash: passwordHash,
        first_name: data.firstName,
        last_name: data.lastName,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    // 生成 JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map(ur => ur.role.name),
    };

    const token = this.jwtService.sign(payload);

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.roles[0]?.role.name || 'USER',
      },
    };
  }
}
```

### 任务 2.2：更新认证模块

**文件：** `fenghua-backend/src/auth/auth.module.ts`

**更改：**
- 移除 `TwentyClientModule` 导入
- 添加 `PrismaModule` 导入
- 添加 `JwtModule` 配置

### 任务 2.3：更新认证控制器

**文件：** `fenghua-backend/src/auth/auth.controller.ts`

**更改：**
- 更新登录端点使用新的 `AuthService`
- 添加注册端点（如果需要）

### 任务 2.4：更新 JWT Guard

**文件：** `fenghua-backend/src/auth/guards/jwt-auth.guard.ts`

**更改：**
- 使用新的 `AuthService.validateToken()` 方法

### 任务 2.5：前端认证更新

**文件：** `fenghua-frontend/src/auth/auth.service.ts`

**更改：**
- 更新登录 API 调用
- 更新 token 存储逻辑
- 移除对 Twenty CRM 的依赖

**验收标准：**
- ✅ 用户可以成功登录
- ✅ JWT token 可以正确验证
- ✅ 用户信息可以正确获取
- ✅ 前端可以正常使用新的认证系统

---

## 👥 阶段 3：替换用户和角色管理（1 周）

### 任务 3.1：重构用户服务

**文件：** `fenghua-backend/src/users/users.service.ts`（重构）

**功能：**
- 获取用户列表
- 创建用户
- 更新用户
- 删除用户
- 分配角色

**实现：**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有用户
   */
  async findAll(): Promise<UserResponseDto[]> {
    const users = await this.prisma.user.findMany({
      where: { deleted_at: null },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.roles[0]?.role.name || 'USER',
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }));
  }

  /**
   * 创建用户
   */
  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const { email, password, firstName, lastName, role } = createUserDto;

    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // 加密密码
    const passwordHash = await hash(password, 10);

    // 获取角色 ID
    const roleRecord = await this.prisma.role.findUnique({
      where: { name: role },
    });

    if (!roleRecord) {
      throw new NotFoundException(`Role ${role} not found`);
    }

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        roles: {
          create: {
            role_id: roleRecord.id,
          },
        },
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.roles[0]?.role.name || 'USER',
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * 更新用户
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const { firstName, lastName, role } = updateUserDto;

    // 如果更新角色
    if (role) {
      const roleRecord = await this.prisma.role.findUnique({
        where: { name: role },
      });

      if (!roleRecord) {
        throw new NotFoundException(`Role ${role} not found`);
      }

      // 删除旧角色关联
      await this.prisma.userRole.deleteMany({
        where: { user_id: id },
      });

      // 创建新角色关联
      await this.prisma.userRole.create({
        data: {
          user_id: id,
          role_id: roleRecord.id,
        },
      });
    }

    // 更新用户信息
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date(),
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.roles[0]?.role.name || 'USER',
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  /**
   * 删除用户（软删除）
   */
  async remove(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }
}
```

### 任务 3.2：重构角色服务

**文件：** `fenghua-backend/src/roles/roles.service.ts`（重构）

**功能：**
- 获取所有角色
- 分配角色给用户
- 移除用户角色

**实现：**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { RoleResponseDto } from './dto/role-response.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有角色
   */
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
    }));
  }

  /**
   * 分配角色给用户
   */
  async assignRole(assignRoleDto: AssignRoleDto): Promise<void> {
    const { userId, roleId } = assignRoleDto;

    // 检查用户是否存在
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 检查角色是否存在
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // 检查是否已分配
    const existing = await this.prisma.userRole.findUnique({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: roleId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Role already assigned');
    }

    // 分配角色
    await this.prisma.userRole.create({
      data: {
        user_id: userId,
        role_id: roleId,
      },
    });
  }

  /**
   * 移除用户角色
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.delete({
      where: {
        user_id_role_id: {
          user_id: userId,
          role_id: roleId,
        },
      },
    });
  }
}
```

### 任务 3.3：更新用户和角色模块

**文件：** `fenghua-backend/src/users/users.module.ts`
**文件：** `fenghua-backend/src/roles/roles.module.ts`

**更改：**
- 移除 `TwentyClientModule` 导入
- 添加 `PrismaModule` 导入

### 任务 3.4：初始化角色数据

**文件：** `fenghua-backend/migrations/007-seed-roles.sql`

```sql
-- 插入默认角色
INSERT INTO roles (name, description) VALUES
  ('ADMIN', 'Administrator - Full access'),
  ('DIRECTOR', 'Director - Management access'),
  ('FRONTEND_SPECIALIST', 'Frontend Specialist - Buyer management'),
  ('BACKEND_SPECIALIST', 'Backend Specialist - Supplier management')
ON CONFLICT (name) DO NOTHING;
```

**验收标准：**
- ✅ 用户可以成功创建、更新、删除
- ✅ 角色可以成功分配和移除
- ✅ 用户列表可以正确显示角色信息

---

## 🏢 阶段 4：替换客户和联系人管理（1-2 周）

### 任务 4.1：创建客户服务

**文件：** `fenghua-backend/src/companies/companies.service.ts`（新建）

**功能：**
- 获取客户列表（支持按类型筛选）
- 创建客户
- 更新客户
- 删除客户（软删除）
- 搜索客户

**实现：**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyResponseDto } from './dto/company-response.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取所有客户（支持按类型筛选）
   */
  async findAll(customerType?: 'SUPPLIER' | 'BUYER'): Promise<CompanyResponseDto[]> {
    const where: any = {
      deleted_at: null,
    };

    if (customerType) {
      where.customer_type = customerType;
    }

    const companies = await this.prisma.company.findMany({
      where,
      include: {
        people: {
          where: { deleted_at: null },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return companies.map(company => ({
      id: company.id,
      name: company.name,
      domainName: company.domain_name,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      postalCode: company.postal_code,
      industry: company.industry,
      employees: company.employees,
      website: company.website,
      phone: company.phone,
      customerType: company.customer_type,
      notes: company.notes,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
      people: company.people.map(person => ({
        id: person.id,
        firstName: person.first_name,
        lastName: person.last_name,
        email: person.email,
        phone: person.phone,
        jobTitle: person.job_title,
      })),
    }));
  }

  /**
   * 创建客户
   */
  async create(createCompanyDto: CreateCompanyDto, userId: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.create({
      data: {
        ...createCompanyDto,
        created_by: userId,
      },
    });

    return this.mapToResponseDto(company);
  }

  /**
   * 更新客户
   */
  async update(id: string, updateCompanyDto: UpdateCompanyDto, userId: string): Promise<CompanyResponseDto> {
    const company = await this.prisma.company.update({
      where: { id },
      data: {
        ...updateCompanyDto,
        updated_by: userId,
        updated_at: new Date(),
      },
    });

    return this.mapToResponseDto(company);
  }

  /**
   * 删除客户（软删除）
   */
  async remove(id: string): Promise<void> {
    await this.prisma.company.update({
      where: { id },
      data: {
        deleted_at: new Date(),
      },
    });
  }

  /**
   * 搜索客户
   */
  async search(query: string, customerType?: 'SUPPLIER' | 'BUYER'): Promise<CompanyResponseDto[]> {
    const where: any = {
      deleted_at: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { domain_name: { contains: query, mode: 'insensitive' } },
        { industry: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (customerType) {
      where.customer_type = customerType;
    }

    const companies = await this.prisma.company.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 50, // 限制结果数量
    });

    return companies.map(company => this.mapToResponseDto(company));
  }

  private mapToResponseDto(company: any): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      domainName: company.domain_name,
      address: company.address,
      city: company.city,
      state: company.state,
      country: company.country,
      postalCode: company.postal_code,
      industry: company.industry,
      employees: company.employees,
      website: company.website,
      phone: company.phone,
      customerType: company.customer_type,
      notes: company.notes,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    };
  }
}
```

### 任务 4.2：创建联系人服务

**文件：** `fenghua-backend/src/people/people.service.ts`（新建）

**功能：**
- 获取联系人列表（按客户）
- 创建联系人
- 更新联系人
- 删除联系人（软删除）

### 任务 4.3：创建客户和联系人控制器

**文件：** `fenghua-backend/src/companies/companies.controller.ts`（新建）
**文件：** `fenghua-backend/src/people/people.controller.ts`（新建）

### 任务 4.4：创建客户和联系人模块

**文件：** `fenghua-backend/src/companies/companies.module.ts`（新建）
**文件：** `fenghua-backend/src/people/people.module.ts`（新建）

### 任务 4.5：更新前端客户管理页面

**文件：** `fenghua-frontend/src/companies/CompaniesPage.tsx`（新建或更新）

**更改：**
- 更新 API 调用使用新的端点
- 移除对 Twenty CRM 的依赖

**验收标准：**
- ✅ 客户可以成功创建、更新、删除
- ✅ 联系人可以成功创建、更新、删除
- ✅ 客户列表可以按类型筛选
- ✅ 搜索功能正常工作

---

## 📦 阶段 5：更新产品和互动记录（1 周）

### 任务 5.1：更新产品服务

**文件：** `fenghua-backend/src/products/products.service.ts`（更新）

**更改：**
- 移除 `getWorkspaceId()` 方法
- 移除对 `TwentyClientService` 的依赖
- 使用 `userId` 替代 `workspaceId` 进行数据隔离

**实现：**

```typescript
// 移除 workspace_id 相关逻辑
// 使用 created_by 进行数据隔离

async findAll(userId: string): Promise<ProductResponseDto[]> {
  const products = await this.prisma.product.findMany({
    where: {
      deleted_at: null,
      created_by: userId, // 使用 created_by 替代 workspace_id
    },
    orderBy: { created_at: 'desc' },
  });

  return products.map(product => this.mapToResponseDto(product));
}
```

### 任务 5.2：更新互动记录服务

**文件：** `fenghua-backend/src/interactions/interactions.service.ts`（如果存在，更新）

**更改：**
- 移除 `workspace_id` 依赖
- 更新 `customer_id` 外键关联到新的 `companies` 表

### 任务 5.3：更新数据库迁移

**文件：** `fenghua-backend/migrations/006-remove-workspace-dependencies.sql`（执行）

**验收标准：**
- ✅ 产品服务不再依赖 Twenty CRM
- ✅ 互动记录可以正确关联到客户
- ✅ 数据隔离使用 `created_by` 实现

---

## 🧹 阶段 6：移除 Twenty 依赖和清理（1 周）

### 任务 6.1：删除 Twenty 相关代码

**文件列表：**
- `fenghua-backend/src/services/twenty-client/twenty-client.service.ts`（删除）
- `fenghua-backend/src/services/twenty-client/twenty-client.module.ts`（删除）
- `fenghua-backend/src/services/twenty-client/README.md`（删除）

### 任务 6.2：更新应用模块

**文件：** `fenghua-backend/src/app.module.ts`

**更改：**
- 移除 `TwentyClientModule` 导入

### 任务 6.3：更新环境变量

**文件：** `fenghua-backend/.env.development`
**文件：** `fenghua-backend/.env.production`

**移除：**
- `TWENTY_API_URL`
- `TWENTY_API_TOKEN`
- `TWENTY_ORIGIN`
- `TWENTY_DATABASE_URL`

**保留：**
- `DATABASE_URL`（fenghua-crm 数据库）

### 任务 6.4：更新依赖

**文件：** `fenghua-backend/package.json`

**移除：**
- `graphql-request`（如果不再需要）

### 任务 6.5：更新文档

**文件：** `docs/api-integration-architecture.md`（更新）
**文件：** `docs/infrastructure-decisions.md`（更新）

**更改：**
- 更新架构图
- 移除 Twenty CRM 相关说明
- 添加新的原生技术栈说明

### 任务 6.6：清理测试文件

**文件：** 所有包含 `twenty` 或 `Twenty` 的测试文件

**更改：**
- 更新测试用例移除 Twenty 依赖
- 使用新的服务进行测试

**验收标准：**
- ✅ 所有 Twenty 相关代码已删除
- ✅ 应用可以正常启动
- ✅ 所有测试通过
- ✅ 文档已更新

---

## 🧪 测试策略

### 单元测试
- 每个服务的方法都需要单元测试
- 使用 Jest 和 NestJS 测试工具
- 覆盖率目标：80%+

### 集成测试
- API 端点集成测试
- 数据库操作集成测试
- 认证流程集成测试

### E2E 测试
- 完整的用户流程测试
- 数据迁移验证测试

---

## 📊 数据迁移计划

### 迁移前准备
1. **备份 Twenty CRM 数据库**
   ```bash
   pg_dump -h localhost -U postgres -d default > twenty_backup.sql
   ```

2. **备份 fenghua-crm 数据库**
   ```bash
   pg_dump -h <neon-host> -U <user> -d fenghua-crm-dev > fenghua_backup.sql
   ```

### 迁移步骤
1. **执行数据库迁移脚本**
   - 创建新表
   - 更新现有表

2. **执行数据迁移脚本**
   - 导出 Twenty 数据
   - 转换数据格式
   - 导入到新表

3. **验证数据完整性**
   - 检查用户数量
   - 检查客户数量
   - 检查联系人数量
   - 检查关联关系

### 回滚计划
如果迁移失败：
1. 恢复数据库备份
2. 回滚代码更改
3. 恢复 Twenty CRM 服务

---

## 🚀 部署计划

### Vercel 部署配置

**文件：** `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "fenghua-frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "fenghua-backend/src/main.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "fenghua-backend/src/main.ts"
    },
    {
      "src": "/(.*)",
      "dest": "fenghua-frontend/$1"
    }
  ],
  "env": {
    "DATABASE_URL": "@database-url",
    "JWT_SECRET": "@jwt-secret"
  }
}
```

### 环境变量配置
- `DATABASE_URL`：Neon PostgreSQL 连接字符串
- `JWT_SECRET`：JWT 签名密钥
- `NODE_ENV`：环境（production/development）

---

## 📅 时间线

| 阶段 | 任务 | 时间 | 开始日期 | 结束日期 |
|------|------|------|----------|----------|
| 1 | 数据库设计和迁移脚本 | 1 周 | Week 1 | Week 1 |
| 2 | 替换认证系统 | 1-2 周 | Week 2 | Week 3 |
| 3 | 替换用户和角色管理 | 1 周 | Week 4 | Week 4 |
| 4 | 替换客户和联系人管理 | 1-2 周 | Week 5 | Week 6 |
| 5 | 更新产品和互动记录 | 1 周 | Week 7 | Week 7 |
| 6 | 移除 Twenty 依赖和清理 | 1 周 | Week 8 | Week 8 |

**总计：6-8 周**

---

## ⚠️ 风险和缓解措施

### 风险 1：数据迁移失败
**缓解措施：**
- 完整的备份策略
- 数据迁移脚本充分测试
- 分阶段迁移（先迁移测试数据）

### 风险 2：功能缺失
**缓解措施：**
- 详细的功能对比清单
- 充分的测试覆盖
- 用户验收测试

### 风险 3：性能问题
**缓解措施：**
- 数据库索引优化
- 查询性能测试
- 缓存策略（如果需要）

---

## ✅ 验收标准

### 功能完整性
- ✅ 所有现有功能正常工作
- ✅ 用户认证和授权正常
- ✅ 客户和联系人管理正常
- ✅ 产品管理正常
- ✅ 互动记录正常

### 技术指标
- ✅ 无 Twenty CRM 依赖
- ✅ 可以部署到 Vercel
- ✅ 所有测试通过
- ✅ 代码质量检查通过

### 数据完整性
- ✅ 所有数据成功迁移
- ✅ 数据关联关系正确
- ✅ 无数据丢失

---

## 📝 后续工作

### 优化
- 性能优化
- 代码重构
- 文档完善

### 新功能
- 基于新架构的新功能开发
- 不再受 Twenty CRM 限制

---

**文档版本：** 1.0  
**最后更新：** 2025-12-26  
**状态：** 待执行

