---
project_name: 'fenghua-crm'
user_name: 'Travis_z'
date: '2025-12-23'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules', 'enhanced_rules', 'usage_guidelines']
status: 'complete'
rule_count: 80
optimized_for_llm: true
existing_patterns_found: 20
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Base Platform:**
- **原生技术栈** (NestJS + React + TypeScript + PostgreSQL)
- **架构决策：** 已移除 Twenty CRM 依赖（2025-12-26），使用完全独立的技术栈
- **参考文档：** `_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md`

**Frontend:**
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS (自定义设计系统，Monday.com风格)
- React Query (`@tanstack/react-query`) for server state
- React Hook Form for form management
- React Router for routing

**Backend:**
- NestJS with TypeScript
- **RESTful API** (标准 HTTP 方法，无 GraphQL)
- TypeORM for database access
- JWT for authentication
- bcrypt for password hashing

**Database:**
- PostgreSQL 16+ (Neon Serverless)
- Row Level Security (RLS) support for data isolation
- 直接数据库访问（独立表结构，不依赖外部系统）

**Deployment:**
- Vercel Serverless (前端 + API Routes)
- 或独立服务器部署
- 无需 Docker（简化部署）

**Critical Constraint:** 系统完全独立，不依赖任何外部CRM系统。

## Critical Implementation Rules

### Language-Specific Rules

**TypeScript:**
- Use strict mode (enforced by tsconfig.json)
- Prefer named exports over default exports (better tree-shaking)
- Use `camelCase` for variables/functions, `PascalCase` for classes/components
- Use `UPPER_SNAKE_CASE` for constants and enum values
- Always type function parameters and return types explicitly
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any` - use `unknown` if type is truly unknown

**Import/Export Patterns:**
- Use named exports: `export const ProductSelector = ...`
- Avoid default exports: `export default ProductSelector` ❌
- Group imports: external → internal → relative
- Use absolute imports from `@/` or `src/` when configured

**Error Handling:**
- Use consistent error response structure: `{ message, statusCode, timestamp, path }`
- Error categories: Product, Customer, Interaction, Excel Import, Mobile Network, Permission, System
- Always include statusCode in error responses
- Use layered error handling: User/Business/System layers
- Use NestJS built-in exception filters

### Framework-Specific Rules

**React:**
- Use functional components with hooks (no class components)
- Prefer custom hooks for reusable logic (`useProductSelector`, `useMobileNetworkRetry`)
- Use React Query for ALL server data fetching (no direct fetch/axios in components)
- React Query keys: Array format, hierarchical `['products', productId]`
- Use React Hook Form for form state (not `useState` for forms)
- Component files: `PascalCase.tsx` (e.g., `ProductSelector.tsx`)
- Hook files: `camelCase.ts` with `use` prefix (e.g., `useProductSelector.ts`)

**NestJS:**
- Services: `{name}.service.ts` with `@Injectable()` decorator
- Controllers: `{name}.controller.ts` with `@Controller()` decorator
- DTOs: `{name}.dto.ts` with `class-validator` decorators
- Entities: `{name}.entity.ts` with TypeORM decorators
- Modules: `{name}.module.ts` - register in `app.module.ts`
- Always inject dependencies via constructor (no property injection)

**RESTful API:**
- Controllers: `{name}.controller.ts` with REST endpoints
- Routes: RESTful conventions (GET, POST, PUT, DELETE)
- Request/Response DTOs: Separate DTOs for requests and responses
- Always apply permission filtering in Controllers/Services (primary layer)
- RLS policies provide defense-in-depth (database layer)

**Permission Filtering (CRITICAL):**
- **ALWAYS** filter data by user role in Controllers/Services
- Frontend Specialist: Only buyer-type customers
- Backend Specialist: Only supplier-type customers
- Director/Administrator: All customer types
- Use unified `PermissionService` for permission checks
- RLS policies must match Controller/Service filtering (no duplicate logic)

**Product Association (CRITICAL):**
- **ALL** interactions MUST link to a product (product-driven data model)
- Use direct database tables (NOT Twenty CRM Custom Objects)
- Never create interactions without product association
- Product-Customer-Interaction is the core data model

### Testing Rules

**Test File Naming:**
- Unit tests: `{filename}.test.ts` (NOT `*.spec.ts`)
- Integration tests: `{filename}.integration.test.ts`
- E2E tests: `tests/e2e/{feature}.test.ts`
- Co-locate tests with source files

**Test Structure:**
- Use Jest for testing
- Test coverage: > 80% overall, > 95% for critical features
- Mock external dependencies (REST API, IndexedDB, Redis)
- Use React Testing Library for component tests

**Test Organization:**
- Unit tests: Test individual functions/services in isolation
- Integration tests: Test Controller + Service + Repository together
- E2E tests: Test complete user flows (quick record, product association)

### Code Quality & Style Rules

**Naming Conventions:**
- Database: `snake_case` (tables, columns, indexes)
- API: REST endpoints use `kebab-case` or `camelCase` paths
- Code: `camelCase` variables, `PascalCase` classes/components
- Constants: `UPPER_SNAKE_CASE`
- Files: Match the exported name (e.g., `ProductSelector.tsx` exports `ProductSelector`)

**File Organization:**
- Backend code: `fenghua-backend/src/{module}/`
- Frontend code: `fenghua-frontend/src/{module}/`
- Shared code: `fenghua-backend/src/common/` and `fenghua-frontend/src/common/`
- Module structure: `{module}.service.ts`, `{module}.controller.ts`, `{module}.entity.ts`, `{module}.dto.ts`, `{module}.module.ts`
- Frontend module: `components/`, `hooks/`, `types/`, `utils/`, `services/`

**Code Comments:**
- Use JSDoc comments for all public functions/classes
- Document complex business logic
- Include `@param` and `@returns` in JSDoc
- API documentation coverage target: > 90%

**Error Handling:**
- Use ErrorCode enum (never hardcode error strings)
- Consistent error response structure: `{ message, code, statusCode, details?, timestamp }`
- User-friendly error messages (no technical details exposed)
- Sanitize error messages (no sensitive data)

### Development Workflow Rules

**Module Registration:**
- All modules must be registered in `fenghua-backend/src/app.module.ts`
- Load order: Permission → Product → Interaction → Excel Import → Offline Sync
- Import modules in `app.module.ts`

**Database Migrations:**
- Use TypeORM migrations
- Migration files: `fenghua-backend/migrations/{timestamp}-{description}.sql` or TypeORM migration files
- Never modify existing migrations (create new ones)
- Test migrations in development before committing

**Caching:**
- Client-side: React Query with TTL (Product list: 5min, Customer list: 5min, Associations: 10min)
- Server-side: Redis with TTL (Product queries: 10min, Customer queries: 10min, Associations: 5min)
- Always invalidate cache on mutations
- Use tag-based invalidation when possible

**Offline Support:**
- Use IndexedDB for mobile offline storage
- Sync queue: Local queue → Server queue → Database
- Conflict resolution: Last-write-wins (MVP), Manual merge (Growth)
- Always show sync status to users

### Critical Don't-Miss Rules

**❌ NEVER:**
- Skip permission filtering in Controllers/Services
- Create interactions without product association
- Use default exports for components
- Mix naming conventions (stick to project patterns)
- Bypass RLS policies (they're defense-in-depth)
- Hardcode error messages (use consistent error response structure)
- Create circular dependencies between modules

**✅ ALWAYS:**
- Filter data by user role in Controllers/Services (permission service)
- Associate all interactions with products
- Use named exports for components
- Use consistent error response structure
- Register modules in `app.module.ts`
- Co-locate tests with source files (`*.test.ts`)
- Use React Query for server state (no direct fetch)
- Apply multi-layer validation (Client + Server + Database)
- Use TypeORM migrations (never direct SQL)

**Edge Cases to Handle:**
- Empty product list (show empty state, not error)
- Offline sync conflicts (last-write-wins MVP)
- Excel import errors (validate before import, show clear errors)
- Permission denied (show user-friendly message, not technical error)
- Product association missing (prevent creation, show validation error)

**Security Rules:**
- Always validate user permissions before data access
- Never expose sensitive data in error messages
- Use RLS policies as defense-in-depth (not primary security)
- Encrypt sensitive data at rest (AES-256)
- Use TLS/SSL for all API communications

**Performance Rules:**
- Use React Query caching (don't refetch unnecessarily)
- Implement pagination for large lists
- Use database indexes for frequently queried columns
- Lazy load heavy components
- Optimize images (next-gen formats, lazy loading)

### Party Mode Discussion Insights

**Discussion Topic:** Reviewing project context rules - evaluating rule completeness and executability from multiple implementation perspectives.

**Participants:** Winston (Architect), Amelia (Dev), John (PM), Mary (Analyst)

**Key Discussion Points:**

**Winston (Architect) - Technical Architecture & Rule Completeness:**
1. **Version Compatibility:**
   - Rules mention "Twenty CRM" but don't specify version constraints
   - Recommendation: Add minimum Twenty CRM version requirement and dependency version ranges
   - Action: Add version constraints section

2. **Custom Objects API:**
   - Rules emphasize using Custom Objects but don't explain how to create/use them
   - Recommendation: Add Custom Objects creation steps and API usage examples
   - Action: Add Custom Objects usage guide

3. **RLS Policy Implementation:**
   - Rules mention RLS as defense layer but don't explain implementation
   - Recommendation: Add RLS policy creation patterns and examples
   - Action: Add RLS implementation guide

**Amelia (Dev) - Development Implementation & Executability:**
1. **Environment Variables:**
   - Rules don't specify required environment variables
   - Recommendation: Add critical environment variables list (SERVER_URL, APP_SECRET, database connection strings, Redis connection)
   - Action: Add environment variables section

2. **Development Commands:**
   - Rules don't specify common development commands
   - Recommendation: Add commands for starting dev servers, running tests, executing migrations
   - Action: Add development commands section

3. **Debugging Tips:**
   - Rules don't explain how to debug
   - Recommendation: Add debugging configuration and common troubleshooting methods
   - Action: Add debugging guide

**John (PM) - Product Management & Delivery Readiness:**
1. **Feature Priority:**
   - Rules don't specify MVP vs Growth stage boundaries
   - Recommendation: Add which rules apply to MVP vs Growth stages
   - Action: Add MVP vs Growth rule boundaries

2. **Code Review Checklist:**
   - Rules don't explain how to verify rules are correctly implemented
   - Recommendation: Add code review checklist
   - Action: Add code review checklist

**Mary (Analyst) - Business Analysis & Requirements Coverage:**
1. **Business Rules Mapping:**
   - Rules don't explain how technical rules map to business requirements
   - Recommendation: Add mapping of key business rules (e.g., "all interactions must link to products") to technical implementation
   - Action: Add business rules mapping

2. **Data Validation Rules:**
   - Rules mention multi-layer validation but don't specify business validation rules
   - Recommendation: Add specific business validation rules (product association validation, customer type validation)
   - Action: Add business validation rules

**Consensus & Recommendations:**

All four experts agree the rules are comprehensive but need the following enhancements:

1. **Technical Implementation Details:**
   - Twenty CRM version constraints and dependency version ranges
   - Custom Objects API usage guide with examples
   - RLS policy implementation patterns
   - Environment variables configuration
   - Development commands and debugging tips

2. **Feature Priority:**
   - MVP vs Growth stage rule boundaries
   - Code review checklist

3. **Business Rules Mapping:**
   - Business rules to technical implementation mapping
   - Specific business validation rules

### Enhanced Context Rules

**Version Constraints:**
- **Node.js:** v18+ (verify with `node --version`)
- **PostgreSQL:** 16+ (Neon Serverless)
- **React:** 18+
- **NestJS:** Latest stable version
- **TypeORM:** Latest stable version compatible with NestJS
- **TypeScript:** 5.0+

**Database Schema:**
- **Creation:** Use TypeORM entities to define database schema
- **Access:** Access data via REST API endpoints
- **Relationships:** Use TypeORM relations to link entities (e.g., Product → Interaction)
- **Example:** Product entity with fields: `name`, `hsCode`, `description`, `category`, `status`
- **Important:** Create database tables directly using TypeORM migrations

**RLS Policy Implementation:**
- **Pattern:** Create RLS policies that match Controller/Service filtering logic
- **Example:** Policy for Frontend Specialist to only access buyer-type customers
- **Location:** RLS policies in database migrations or PostgreSQL directly
- **Testing:** Test RLS policies independently from Controller/Service filtering
- **Important:** RLS is defense-in-depth, Controller/Service filtering is primary security

**Environment Variables:**
- **Required:**
  - `SERVER_URL=http://localhost:3000` (or production URL)
  - `APP_SECRET=<generate-secret>` (for JWT signing)
  - `STORAGE_TYPE=local` (or `s3` for production)
  - Database connection strings (PostgreSQL)
  - Redis connection string
  - Bull Queue Redis connection (can be same as cache Redis)
- **Optional:**
  - `NODE_ENV=development|production`
  - `LOG_LEVEL=debug|info|warn|error`
- **Location:** `.env` file (gitignored), `.env.example` (committed)

**Development Commands:**
- **Start Backend:** `cd fenghua-backend && npm run start:dev`
- **Start Frontend:** `cd fenghua-frontend && npm run dev`
- **Run Tests:** `npm test` (in respective directory)
- **Run Migrations:** `cd fenghua-backend && npm run migration:run`
- **Lint:** `npm run lint` (in respective directory)
- **Type Check:** `npm run type-check` (if configured)

**Debugging Tips:**
- **Backend:** Use VS Code debugger with `launch.json` configuration
- **Frontend:** Use React DevTools and browser DevTools
- **API:** Use REST client (Postman, Insomnia, or browser DevTools Network tab)
- **Database:** Connect to PostgreSQL via Neon console or connection string
- **Common Issues:**
  - Permission errors: Check Resolver filtering and RLS policies
  - Product association missing: Verify Custom Object relationship fields
  - Cache issues: Clear React Query cache or Redis cache

**MVP vs Growth Rule Boundaries:**
- **MVP Rules (Always Required):**
  - Permission filtering in Resolvers
  - Product association for all interactions
  - ErrorCode enum usage
  - Named exports for components
  - Custom Objects (not direct tables)
  - TypeORM migrations
  - React Query for server state
- **Growth Rules (Can Defer):**
  - Rate limiting (deferred to Growth)
  - Advanced conflict resolution (manual merge)
  - Real-time updates (WebSocket/Subscriptions)
  - AI analysis service integration

**Code Review Checklist:**
- [ ] Permission filtering applied in Resolver?
- [ ] Product association present for interactions?
- [ ] ErrorCode enum used (not hardcoded strings)?
- [ ] Named exports used (not default exports)?
- [ ] Tests co-located with source files (`*.test.ts`)?
- [ ] React Query used for server state (no direct fetch)?
- [ ] Custom Objects used (not direct tables)?
- [ ] TypeORM migrations used (not direct SQL)?
- [ ] JSDoc comments for public functions?
- [ ] Multi-layer validation (Client + Server + Database)?

**Business Rules Mapping:**
- **Business Rule:** "All interactions must link to a product"
  - **Technical Implementation:** Product-Customer-Interaction Custom Object with relationship field to Product
  - **Validation:** Server-side DTO validation + Database foreign key constraint
  - **Files:** `interaction.dto.ts`, `interaction.entity.ts`, `interaction.service.ts`
- **Business Rule:** "Frontend Specialist can only access buyer-type customers"
  - **Technical Implementation:** PermissionService filters customers by type in Resolver + RLS policy
  - **Validation:** Resolver filtering (primary) + RLS policy (defense)
  - **Files:** `permission.service.ts`, `customer.resolver.ts`, RLS migration
- **Business Rule:** "Quick record must complete in < 30 seconds"
  - **Technical Implementation:** Smart pre-fill, React Query caching, optimized queries
  - **Validation:** Performance testing, user acceptance testing
  - **Files:** `QuickRecordForm.tsx`, `useQuickRecord.ts`, `interaction.service.ts`

**Business Validation Rules:**
- **Product Association Validation:**
  - Product must exist before creating interaction
  - Product must be active (not deleted/inactive)
  - Validation in: DTO (`CreateInteractionDto`), Service (`InteractionService`), Database (foreign key constraint)
- **Customer Type Validation:**
  - Customer type must match user role (buyer for Frontend Specialist, supplier for Backend Specialist)
  - Validation in: PermissionService, Resolver filtering, RLS policy
- **Excel Import Validation:**
  - Required fields: customer name, product name (or HS code)
  - Data format validation: trim, encoding fixes, format normalization
  - Product matching: fuzzy matching for product associations
  - Validation in: `ExcelImportService`, `ExcelImportProcessor`

---

## Usage Guidelines

**For AI Agents:**

- **Read this file before implementing any code** - This is your single source of truth for project rules
- **Follow ALL rules exactly as documented** - Consistency is critical for this project
- **When in doubt, prefer the more restrictive option** - Better to be safe than inconsistent
- **Update this file if new patterns emerge** - Help maintain this as a living document
- **Pay special attention to CRITICAL rules** - Permission filtering and Product association are non-negotiable
- **Check code review checklist** - Use it to verify your implementation before submitting

**For Humans:**

- **Keep this file lean and focused on agent needs** - Remove obvious rules as they become standard
- **Update when technology stack changes** - Version constraints and new dependencies
- **Review quarterly for outdated rules** - Patterns evolve, rules should too
- **Remove rules that become obvious over time** - Optimize for LLM context efficiency
- **Add new rules when patterns emerge** - Capture project-specific conventions

**Maintenance:**

- **Last Updated:** 2025-12-23
- **Review Frequency:** Quarterly
- **Update Trigger:** Technology stack changes, new patterns emerge, rules become outdated

---

**Remember:** This project extends Twenty CRM. Always maintain compatibility with the base platform. Custom code goes in `custom/` directories, never modify core Twenty CRM code.

