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
- Twenty CRM (NestJS + React + TypeScript + PostgreSQL + GraphQL)
- Custom code in `packages/twenty-server/src/custom/` and `packages/twenty-front/src/custom/`

**Frontend:**
- React 18+ with TypeScript
- Tailwind CSS (customization of Twenty CRM design system)
- React Query (`@tanstack/react-query`) for server state
- React Hook Form for form management
- Vite for build tooling

**Backend:**
- NestJS with TypeScript
- GraphQL API (single endpoint `/graphql`)
- TypeORM for database access
- Bull Queue (Redis-based) for async job processing
- Redis for server-side caching

**Database:**
- PostgreSQL with Row Level Security (RLS) support
- Use Twenty CRM Custom Objects + Relationship Fields (NOT direct table creation)

**Deployment:**
- Docker + Docker Compose
- Multi-container: server, database, redis, worker

**Critical Constraint:** All custom code must maintain compatibility with Twenty CRM for future upgrades.

## Critical Implementation Rules

### Language-Specific Rules

**TypeScript:**
- Use strict mode (enforced by Twenty CRM)
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
- Use ErrorCode enum from `packages/twenty-server/src/common/errors/error-codes.enum.ts`
- Error code ranges: Product (1000-1999), Customer (2000-2999), Interaction (3000-3999), Excel Import (4000-4999), Mobile Network (5000-5999), Permission (6000-6999), System (9000-9999)
- Always include error code in error responses
- Use layered error handling: User/Business/System layers

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
- Resolvers: `{name}.resolver.ts` with `@Resolver()` decorator
- DTOs: `{name}.dto.ts` with `class-validator` decorators
- Entities: `{name}.entity.ts` with TypeORM decorators
- Modules: `{name}.module.ts` - register in `custom.module.ts`
- Always inject dependencies via constructor (no property injection)

**GraphQL:**
- Types: `PascalCase` (e.g., `Product`, `Customer`)
- Fields: `camelCase` (e.g., `productName`, `customerId`)
- Queries/Mutations: `camelCase`, verb-based (e.g., `getProduct`, `createProduct`)
- Always apply permission filtering in Resolvers (primary layer)
- RLS policies provide defense-in-depth (database layer)

**Permission Filtering (CRITICAL):**
- **ALWAYS** filter data by user role in GraphQL Resolvers
- Frontend Specialist: Only buyer-type customers
- Backend Specialist: Only supplier-type customers
- Director/Administrator: All customer types
- Use unified `PermissionService` for permission checks
- RLS policies must match Resolver filtering (no duplicate logic)

**Product Association (CRITICAL):**
- **ALL** interactions MUST link to a product (product-driven data model)
- Use Twenty CRM Custom Objects + Relationship Fields
- Never create interactions without product association
- Product-Customer-Interaction is the core data model

### Testing Rules

**Test File Naming:**
- Unit tests: `{filename}.test.ts` (NOT `*.spec.ts`)
- Integration tests: `{filename}.integration.test.ts`
- E2E tests: `tests/e2e/{feature}.test.ts`
- Co-locate tests with source files

**Test Structure:**
- Use Jest (Twenty CRM standard)
- Test coverage: > 80% overall, > 95% for critical features
- Mock external dependencies (GraphQL, IndexedDB, Redis)
- Use React Testing Library for component tests

**Test Organization:**
- Unit tests: Test individual functions/services in isolation
- Integration tests: Test Resolver + Service + Repository together
- E2E tests: Test complete user flows (quick record, product association)

### Code Quality & Style Rules

**Naming Conventions:**
- Database: `snake_case` (tables, columns, indexes)
- API: GraphQL `PascalCase` types, `camelCase` fields
- Code: `camelCase` variables, `PascalCase` classes/components
- Constants: `UPPER_SNAKE_CASE`
- Files: Match the exported name (e.g., `ProductSelector.tsx` exports `ProductSelector`)

**File Organization:**
- Custom code: `packages/twenty-server/src/custom/{module}/` and `packages/twenty-front/src/custom/{module}/`
- Shared code: `packages/twenty-server/src/common/` and `packages/twenty-front/src/shared/`
- Module structure: `{module}.service.ts`, `{module}.resolver.ts`, `{module}.entity.ts`, `{module}.dto.ts`, `{module}.module.ts`
- Frontend module: `components/`, `hooks/`, `types/`, `utils/`

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
- All custom modules must be registered in `packages/twenty-server/src/custom/custom.module.ts`
- Load order: Permission → Product → Interaction → Excel Import → Offline Sync
- Import `CustomModule` in `app.module.ts` (or Twenty CRM's equivalent)

**Database Migrations:**
- Use TypeORM migrations (Twenty CRM standard)
- Migration files: `packages/twenty-server/src/migrations/{timestamp}-{description}.ts`
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
- Create database tables directly (use Twenty CRM Custom Objects)
- Skip permission filtering in Resolvers
- Create interactions without product association
- Use default exports for components
- Mix naming conventions (stick to project patterns)
- Bypass RLS policies (they're defense-in-depth)
- Hardcode error messages (use ErrorCode enum)
- Create circular dependencies between modules
- Modify Twenty CRM core code (use `custom/` directory only)

**✅ ALWAYS:**
- Filter data by user role in Resolvers (permission service)
- Associate all interactions with products
- Use named exports for components
- Follow error code ranges (1000 codes per module)
- Use `custom.module.ts` for module registration
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
- **Twenty CRM:** Use latest stable version (verify compatibility in POC phase)
- **Node.js:** v18+ (verify with `node --version`)
- **PostgreSQL:** 14+ (via Docker, Twenty CRM managed)
- **Redis:** 7+ (via Docker, Twenty CRM managed)
- **React:** 18+ (Twenty CRM managed)
- **NestJS:** Version provided by Twenty CRM
- **TypeORM:** Version provided by Twenty CRM

**Custom Objects API Usage:**
- **Creation:** Use Twenty CRM's GraphQL API or Admin UI to create Custom Objects
- **Access:** Access Custom Objects via GraphQL queries/mutations
- **Relationship Fields:** Use relationship fields to link Custom Objects (e.g., Product → Interaction)
- **Example:** Product Custom Object with fields: `name`, `hsCode`, `description`, `category`, `status`
- **Important:** Never create database tables directly - always use Custom Objects

**RLS Policy Implementation:**
- **Pattern:** Create RLS policies that match Resolver filtering logic
- **Example:** Policy for Frontend Specialist to only access buyer-type customers
- **Location:** RLS policies in database migrations or PostgreSQL directly
- **Testing:** Test RLS policies independently from Resolver filtering
- **Important:** RLS is defense-in-depth, Resolver filtering is primary security

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
- **Start Backend:** `cd packages/twenty-server && yarn start:dev`
- **Start Frontend:** `cd packages/twenty-front && yarn dev`
- **Run Tests:** `yarn test` (root) or `yarn test` (in package directory)
- **Run Migrations:** `yarn migration:run` (or Twenty CRM's migration command)
- **Docker Compose:** `cd packages/twenty-docker && docker-compose up -d`
- **Lint:** `yarn lint` (root or package directory)
- **Type Check:** `yarn type-check` (if configured)

**Debugging Tips:**
- **Backend:** Use VS Code debugger with `launch.json` configuration
- **Frontend:** Use React DevTools and browser DevTools
- **GraphQL:** Use GraphQL Playground (usually at `/graphql`)
- **Database:** Connect to PostgreSQL via Docker: `docker exec -it twenty-db-1 psql -U postgres`
- **Redis:** Connect via Docker: `docker exec -it twenty-redis-1 redis-cli`
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

