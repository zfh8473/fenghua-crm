---
stepsCompleted: [1, 2, 3, 4, 5, 6, 'party-mode-step6', 7, 'party-mode-step7', 8]
inputDocuments:
  - _bmad-output/prd.md
  - _bmad-output/ux-design-specification.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2025-12-23'
project_name: 'fenghua-crm'
user_name: 'Travis_z'
date: '2025-12-23'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

> ⚠️ **重要架构更新（2025-12-26）**
> 
> 本项目已决定移除 Twenty CRM 依赖，使用原生技术栈。
> 
> **当前架构：** 原生技术栈（NestJS + PostgreSQL + NextAuth.js）  
> **部署方案：** Vercel Serverless（无需 Docker）  
> **参考文档：** 
> - `docs/api-integration-architecture.md` - 原生技术栈架构详细说明
> - `_bmad-output/refactoring-plan-remove-twenty-dependency-2025-12-26.md` - 详细重构计划
> 
> **本文档状态：** 保留作为历史参考，部分内容已过时（特别是关于 Twenty CRM 和 GraphQL 的部分）
> 
> ---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- **Total:** 132 functional requirements organized into 20 capability areas
- **Core Capabilities:**
  - Product Management (8 FRs) - Product objects, HS codes, product-customer associations
  - Customer Management (8 FRs) - Role-based access (buyers/suppliers), complete data isolation
  - Interaction Recording (6 FRs) - Product-driven interactions, complete business process tracking
  - Quick Record (5 FRs) - 30-second record completion, smart pre-fill
  - Data Import/Export (8 FRs) - Excel import/export, bulk operations
  - Search & Query (9 FRs) - Fuzzy search, product-customer-interaction 3D queries
  - Permission & Access Control (10 FRs) - RBAC, complete data isolation, RLS
  - Business Analytics (8 FRs) - Business dashboard, product association analysis
  - System Management (7 FRs) - User management, system configuration
  - Data Security & Compliance (9 FRs) - AES-256 encryption, audit logs, GDPR compliance
  - Collaboration (4 FRs) - Comments, team collaboration
  - Batch Operations (3 FRs) - Bulk quote sending, bulk editing
  - Data Validation (6 FRs) - Format validation, error handling
  - Smart Suggestions (3 FRs) - Auto-suggest products, intelligent recommendations
  - Offline Capability (2 FRs) - Mobile offline recording, auto-sync
  - User Guidance (3 FRs) - Onboarding, help system
  - Personalization (3 FRs) - User preferences, custom views
  - API & Integration (3 FRs) - GraphQL API, third-party integration
  - Export Format Selection (2 FRs) - JSON, CSV, Excel export
  - Notifications (2 FRs) - Follow-up reminders, task alerts

**Non-Functional Requirements:**
- **Performance:**
  - GraphQL API response time < 500ms (P95)
  - Page load time < 2 seconds
  - Search query response < 1 second (P95)
  - Support 50 concurrent users, 100 concurrent API requests
- **Security:**
  - AES-256 encryption for sensitive data
  - RBAC with 4 roles, complete data isolation
  - PostgreSQL RLS as defense-in-depth
  - Audit logs for all data operations (1 year retention)
  - GDPR and Personal Information Protection Law compliance
- **Reliability:**
  - System availability > 99.5% (monthly)
  - Data loss rate < 0.1%
  - Automatic backup (daily, 30-day retention)
- **Scalability:**
  - Support 10-100 users with < 10% performance degradation
  - Support 10x data growth with stable performance
  - Database indexing and pagination optimization
- **Integration:**
  - GraphQL API for all capabilities
  - API versioning support
  - Third-party integration via Webhook/API
- **Maintainability:**
  - Code test coverage > 80% (unit + integration)
  - Critical features test coverage > 95%
  - API documentation coverage > 90%

**Scale & Complexity:**
- **Primary Domain:** Full-stack web application (Frontend + Backend + Database)
- **Complexity Level:** Medium-High (Enterprise B2B CRM)
- **Estimated Architectural Components:**
  - Data Layer: Product objects, Customer objects, Interaction records, Permission management
  - API Layer: GraphQL Resolvers (permission filtering, product association queries)
  - Business Logic Layer: Product association service, Permission service, Sync service, Import/Export service
  - Frontend Components: Quick record component, Product selector, Offline sync component, Business dashboard
  - Integration Layer: Excel import/export, AI analysis service (Growth stage)

### Technical Constraints & Dependencies

**Base Platform:**
- **原生技术栈:** NestJS + React + TypeScript + PostgreSQL
- **架构决策:** 已移除 Twenty CRM 依赖，使用原生技术栈（2025-12-26）
- **部署方案:** Vercel Serverless（前端 + API Routes）

**Technology Stack:**
- **Frontend:** React + TypeScript, Vite, Tailwind CSS（自定义设计系统）
- **Backend:** NestJS + TypeScript, RESTful API
- **Database:** PostgreSQL 16+ (Neon Serverless) with RLS support
- **Authentication:** NextAuth.js / JWT（Vercel 原生支持）
- **Deployment:** Vercel（无需 Docker）

**Key Constraints:**
- Product-driven data model (all interactions must link to products)
- Complete data isolation between Frontend/Backend Specialists
- Mobile online support required for MVP (factory field use, supports mobile network)
- Excel import/export required (legacy data migration)
- Vercel deployment requirement (no Docker containers)

### Cross-Cutting Concerns Identified

**1. Role-Based Access Control & Data Isolation:**
- **Affects:** All data access operations, REST API endpoints, Database queries
- **Implementation Strategy:**
  - **Primary Layer:** Service layer filtering (application logic)
  - **Defense Layer:** PostgreSQL RLS (database security)
  - **Performance:** RLS policies use indexes, Service filtering uses caching
  - **Critical:** Frontend/Backend Specialist complete data isolation
- **Architectural Decision:** Service layer (main) + RLS (defense), avoid duplicate filtering

**2. Product Association:**
- **Affects:** All interaction records, search queries, business analytics
- **Implementation Strategy:**
  - **Data Model:** Native PostgreSQL tables with foreign key relationships
  - **Indexing:** Composite indexes for product-customer-interaction queries
  - **Query Optimization:** Client-side caching (React Query) + Server-side caching (optional Redis)
  - **Critical:** Core differentiator, must be efficient and user-friendly
- **Architectural Decision:** Native tables + foreign keys + composite indexes

**3. Offline Synchronization:**
- **Affects:** Mobile functionality, data consistency, conflict resolution
- **Implementation Strategy:**
  - **Storage:** IndexedDB for local data storage
  - **Sync Queue:** Local queue + Server-side queue
  - **Sync Strategy:** Incremental sync (only changed data)
  - **Conflict Resolution:** MVP: Last-write-wins, Growth: Manual merge
  - **Retry Mechanism:** Exponential backoff with max retries
  - **Critical:** MVP requirement for Backend Specialist factory use
- **Architectural Decision:** IndexedDB + dual queue + incremental sync + last-write-wins (MVP)

**4. Audit Logging:**
- **Affects:** All data operations, compliance requirements
- **Implementation Strategy:**
  - **Automatic Logging:** All data access, modification, permission operations
  - **Retention:** 1-year retention (configurable)
  - **Compliance:** GDPR and Personal Information Protection Law
  - **Critical:** Security and compliance requirement
- **Architectural Decision:** Automatic logging with 1-year retention

**5. Performance Optimization:**
- **Affects:** Query response times, user experience, scalability
- **Implementation Strategy:**
  - **Database Indexing:**
    - Product name index: `CREATE INDEX idx_products_name ON products(name)`
    - Customer name+type index: `CREATE INDEX idx_customers_name_type ON customers(name, customer_type)`
    - Product-customer interaction index: `CREATE INDEX idx_interactions_product_customer ON interactions(product_id, customer_id)`
  - **Caching Strategy:**
    - **Client-side (React Query):** Product list (5min), Customer list (5min), Product-customer associations (10min)
    - **Server-side (Redis):** Common product queries (10min), Common customer queries (10min), Product association queries (5min)
  - **Query Optimization:** Pagination, lazy loading, query result limiting
  - **Critical:** 30-second record completion target, < 500ms API response
- **Architectural Decision:** Multi-layer caching + database indexing + query optimization

**6. Excel Integration:**
- **Affects:** Data migration, bulk operations, user workflow
- **Implementation Strategy:**
  - **Processing:** Asynchronous processing (Bull Queue for large files)
  - **Validation:** Real-time validation during import
  - **Error Handling:** Detailed error reports with fix suggestions
  - **Progress Tracking:** WebSocket real-time progress updates
  - **Critical:** Legacy data migration, user familiarity
- **Architectural Decision:** Async import + real-time validation + progress tracking

**7. Responsive Design & Accessibility:**
- **Affects:** All UI components, mobile experience, user adoption
- **Implementation Strategy:**
  - **Design System:** Twenty CRM + Tailwind CSS customization
  - **Responsive:** Mobile-first design (MVP priority)
  - **Accessibility:** WCAG 2.1 Level AA (MVP), Level AAA (Growth)
  - **Touch Targets:** 64x64px (core), 56x56px (general), 48x48px (navigation)
  - **Critical:** Mobile MVP priority, female user preferences
- **Architectural Decision:** Mobile-first + WCAG AA + optimized touch targets

**8. Real-time Updates (Growth Stage):**
- **Affects:** Collaborative features, live data updates
- **Implementation Strategy:** WebSocket or GraphQL Subscriptions (future consideration)
- **Note:** Not MVP, but identified for Growth stage

**9. System Architecture & Service Design:**
- **Affects:** System scalability, maintainability, future extensibility
- **Implementation Strategy:**
  - **MVP Stage:** Maintain monolithic architecture (Twenty CRM standard)
  - **Modular Design:** Code organization by modules (product, customer, interaction, permission)
  - **Clear Boundaries:** Modules communicate via interfaces, facilitating future splitting
  - **Future Consideration (Growth):** Microservices architecture if user base grows to 100+ or data volume increases 10x
- **Architectural Decision:** Monolithic architecture (MVP) with modular design for future flexibility

**10. Data Consistency & Integrity:**
- **Affects:** Data accuracy, business decision reliability, audit compliance
- **Implementation Strategy:**
  - **Soft Delete:** All delete operations use soft delete (`deleted_at` timestamp), preserve historical records
  - **Foreign Key Constraints:** `ON DELETE RESTRICT` prevents physical deletion of records with associations
  - **Association Validation:** Validate product/customer existence and active status before creating interactions
  - **Cascade Soft Delete:** Optional cascade soft delete for related records (e.g., interactions when product is deleted)
  - **ACID Guarantees:** PostgreSQL transactions ensure data consistency
- **Business Rules:**
  - Products: Mark as "inactive" instead of deleting, preserve all historical interaction records
  - Customers: Mark as "inactive" instead of deleting, preserve all historical interaction records
  - Historical records: Always visible for business analysis and audit purposes
- **Architectural Decision:** Soft delete + foreign key constraints + association validation + ACID transactions

**11. Error Handling & Recovery:**
- **Affects:** User experience, system reliability, data integrity
- **Implementation Strategy:**
  - **Layered Error Handling:**
    - **User Layer:** React Error Boundary, friendly error messages, recovery suggestions
    - **Business Layer:** Custom business exceptions with error codes and user-friendly messages
    - **System Layer:** Global exception filter, structured logging, error tracking
  - **Automatic Retry:** Network errors with exponential backoff and max retries
  - **Data Preservation:** Offline mode auto-save, sync on network recovery
  - **Error Recovery:** User-friendly error messages with actionable recovery steps
- **Architectural Decision:** Layered error handling + automatic retry + data preservation

**12. Monitoring & Logging:**
- **Affects:** System observability, performance tracking, business insights
- **Implementation Strategy:**
  - **Structured Logging:** Winston structured logs with levels (error, warn, info, debug)
  - **Log Format:** `{ level, message, context, timestamp, userId }`
  - **Performance Monitoring:**
    - API response time tracking
    - Database query time tracking
    - Health check endpoints (`/health`)
  - **Business Metrics:**
    - Record completion rate
    - Product association usage rate
    - User activity metrics
  - **Alerting:**
    - Error rate > 1%
    - Response time > 1s
    - System availability < 99%
- **Architectural Decision:** Structured logging + performance monitoring + business metrics + alerting

**13. Deployment Strategy:**
- **Affects:** System availability, update frequency, rollback capability
- **Implementation Strategy:**
  - **MVP Stage:** Accept brief downtime for deployments (acceptable for MVP)
  - **Growth Stage:** Hot deployment support (zero-downtime updates)
  - **Rollback Strategy:** Version tagging and quick rollback capability
  - **Deployment Frequency:** Based on business needs (daily/weekly)
- **Architectural Decision:** Brief downtime acceptable (MVP), hot deployment (Growth)

### MVP Priority & Scope

**MVP Functionality (0-3 months):**
- **P0 - Critical Features:**
  - Product association (core differentiator)
  - Quick record (30-second completion)
  - Excel import/export (data migration)
  - Mobile online support (Backend Specialist factory use, supports mobile network)
  - Role-based data isolation (Frontend/Backend Specialist separation)
- **P1 - Important Features:**
  - Business dashboard (simplified version)
  - Batch operations (bulk quote sending)
  - Smart suggestions (auto-suggest products)
- **P2 - Enhancement Features:**
  - AI analysis (Growth stage)
  - Advanced features (Growth stage)

**MVP Scope Rationale:**
- Focus on core differentiators (product association, data isolation)
- Address critical user pain points (Excel migration, mobile offline)
- Ensure business value delivery (30-second record, complete process tracking)
- Avoid over-engineering, deliver value quickly

### Business Rules & Data Migration

**Data Isolation Rules:**
- **Frontend Specialist:** Only access buyer-type customers
- **Backend Specialist:** Only access supplier-type customers
- **Director/Administrator:** Access all customer types
- **Role Change:** Data migration strategy required when user role changes
- **Customer Type Change:** Data migration strategy required when customer type changes (supplier → buyer)

**Data Migration Strategy:**
- **Excel Import:**
  - Asynchronous processing for large files (> 1000 records)
  - Real-time validation during import
  - Data cleaning and error reporting
  - Product association validation
- **Role Change:**
  - Historical data access based on new role
  - Data migration for role-specific records
  - Audit trail for role changes
- **Customer Type Change:**
  - Data migration between buyer/supplier records
  - Product association preservation
  - Audit trail for type changes

### Party Mode Discussion Insights

**From Architect (Winston):**
- Data model: Use Twenty CRM custom objects + relationship fields, establish composite indexes
- Permission filtering: Resolver (main) + RLS (defense), avoid duplicate filtering
- Offline sync: IndexedDB + local queue + server-side queue + incremental sync
- Performance optimization: Multi-layer caching (client + server) + database indexing
- Excel integration: Async import + real-time validation + progress tracking
- MVP scope: Focus on core differentiators, avoid over-engineering

**From Developer (Amelia):**
- Implementation paths: Custom objects (`packages/twenty-server/src/core/custom-object/`), Resolvers (`packages/twenty-server/src/core/graphql/resolvers/`), Mobile components (`packages/twenty-front/src/modules/custom/mobile/`)
- Database indexes: Product name, customer name+type, product-customer interaction composite indexes
- Caching: React Query (client), Redis (server)
- Excel import: Bull Queue for async processing, WebSocket for progress tracking

**From Product Manager (John):**
- MVP priority: P0 (product association, quick record, Excel import, mobile online) → P1 (dashboard, batch operations) → P2 (AI analysis)
- Performance targets: Measurable and verifiable (30-second record, < 500ms API)
- Business risks: Role change data migration, customer type change, mobile network instability
- User value: Excel import speed, data validation strictness, error handling friendliness

**From Analyst (Mary):**
- Product association frequency: Frontend Specialist 10+ times/day, Backend Specialist 15+ times/day
- Mobile network scenarios: Network may be unstable, automatic retry required, user can choose to record later
- Excel data quality: Format validation, completeness validation, association validation
- Performance measurement: Establish monitoring and user feedback mechanisms

**Key Improvements Applied:**
1. ✅ Data model: Twenty CRM custom objects + relationship fields + composite indexes
2. ✅ Permission filtering: Resolver (main) + RLS (defense) with clear responsibility division
3. ✅ Offline sync: IndexedDB + dual queue + incremental sync + conflict resolution strategy
4. ✅ Performance optimization: Multi-layer caching strategy + database index priorities
5. ✅ Excel integration: Async import + real-time validation + progress tracking
6. ✅ MVP priority: Clear P0/P1/P2 scope to avoid over-engineering
7. ✅ Business rules: Data migration and role change strategies
8. ✅ Implementation paths: Specific file paths and code locations
9. ✅ Caching strategy: Client-side (React Query) + Server-side (Redis) with TTLs
10. ✅ Database indexes: Specific index definitions for performance optimization
11. ✅ System architecture: Monolithic (MVP) with modular design for future flexibility
12. ✅ Data consistency: Soft delete strategy + foreign key constraints + association validation
13. ✅ Error handling: Layered error handling (user/business/system) + automatic retry + data preservation
14. ✅ Monitoring: Structured logging + performance monitoring + business metrics + alerting
15. ✅ Deployment: Brief downtime acceptable (MVP), hot deployment (Growth)

**Architectural Decision Priorities:**
- **MVP (0-3 months):** Core data model, permission filtering, mobile online support, performance optimization, Excel integration, soft delete, error handling, basic monitoring
- **Growth (3-6 months):** Advanced conflict resolution, real-time updates, AI analysis integration, hot deployment, advanced monitoring

### Architecture Decision Records (ADR) Analysis

**Method Applied:** Architecture Decision Records - Multiple architect personas propose and debate architectural choices with explicit trade-offs.

**Key Architectural Decisions Identified:**

#### ADR-001: Permission Filtering & Data Isolation Strategy

**Status:** Decided  
**Date:** 2025-12-23  
**Decision Makers:** Architecture Team

**Context:**
Role-based data isolation is a core requirement. Frontend/Backend Specialists must have complete data isolation. Need to choose between application-layer filtering, database-layer filtering, or hybrid approach.

**Options Evaluated:**

**Option 1: GraphQL Resolver Filtering Only**
- **Pros:** Simple implementation, good performance (caching), flexible (business logic centralized)
- **Cons:** Security depends on application layer, no database-level protection, potential bypass risk
- **Trade-off:** Performance vs Security

**Option 2: PostgreSQL RLS Only**
- **Pros:** Database-level security, cannot be bypassed, follows principle of least privilege
- **Cons:** Potential performance issues (policy check on every query), complex maintenance, less flexible
- **Trade-off:** Security vs Performance

**Option 3: GraphQL Resolver (Primary) + PostgreSQL RLS (Defense) - RECOMMENDED**
- **Pros:** Defense-in-depth, balances performance and security, follows security best practices
- **Cons:** Medium implementation complexity, requires coordination between two layers
- **Trade-off:** Complexity vs Security

**Architect Debate:**

**Architect A (Performance-Focused):**
"I favor Option 1 (Resolver only). Reasons:
1. Performance: Resolver layer can use caching, avoiding RLS policy checks on every query
2. Flexibility: Business logic centralized in application layer, easy to adjust
3. Development efficiency: Simple implementation, low maintenance cost

But need to ensure Resolver filtering logic is complete and correct."

**Architect B (Security-Focused):**
"I favor Option 2 (RLS only). Reasons:
1. Security: Database-level protection, cannot be bypassed even if application layer has vulnerabilities
2. Compliance: Follows principle of least privilege, audit-friendly
3. Defense-in-depth: Does not rely on single security layer

But need to optimize RLS policy performance, use indexes to avoid performance issues."

**Architect C (Balanced Approach):**
"I support Option 3 (Hybrid). Reasons:
1. Defense-in-depth: Dual protection, even if one layer fails, still protected
2. Performance: Resolver layer caches common queries, RLS as last line of defense
3. Flexibility: Business logic in Resolver, security policy in RLS

Implementation recommendations:
- Resolver as primary filtering layer (application logic + caching)
- RLS as defense layer (database security, optimized with indexes)
- Avoid duplicate filtering: RLS policies use indexes, Resolver uses caching"

**Decision:**
Option 3: GraphQL Resolver (Primary) + PostgreSQL RLS (Defense)

**Rationale:**
1. Business Value (30%): Ensures data isolation, meets core business requirements
2. Security (25%): Defense-in-depth, meets enterprise security standards
3. Performance (20%): Resolver caching + RLS indexes, acceptable performance
4. Maintainability (15%): Clear logic, distinct responsibilities
5. Compliance (10%): Meets audit and compliance requirements

**Consequences:**
- **Positive:** Defense-in-depth, acceptable performance, enterprise-grade security
- **Negative:** Medium implementation complexity, requires coordination between two layers
- **Mitigation:** Establish clear responsibility division, use indexes to optimize RLS performance

---

#### ADR-002: Product Association Data Model

**Status:** Decided  
**Date:** 2025-12-23  
**Decision Makers:** Architecture Team

**Context:**
Product association is the core differentiator. All interaction records must link to products. Need to choose appropriate data model.

**Options Evaluated:**

**Option 1: Extend Twenty CRM Existing Objects**
- **Pros:** Reuse existing structure, fast development
- **Cons:** May not meet complex product association requirements, limited extensibility
- **Trade-off:** Speed vs Flexibility

**Option 2: Twenty CRM Custom Objects + Relationship Fields - RECOMMENDED**
- **Pros:** Flexible, extensible, aligns with Twenty CRM architecture
- **Cons:** Need to learn custom object API
- **Trade-off:** Flexibility vs Learning Curve

**Option 3: Independent Product Association Table**
- **Pros:** Complete control, performance optimizable
- **Cons:** Complex integration with Twenty CRM, high maintenance cost
- **Trade-off:** Control vs Integration Complexity

**Decision:**
Option 2: Twenty CRM Custom Objects + Relationship Fields

**Rationale:**
1. Platform Consistency (30%): Aligns with Twenty CRM architecture, easy to maintain
2. Flexibility (25%): Supports complex product-customer-interaction relationships
3. Development Efficiency (20%): Leverages Twenty CRM's built-in capabilities
4. Extensibility (15%): Easy to add new fields and relationships
5. Performance (10%): Can use Twenty CRM's query optimization

**Consequences:**
- **Positive:** Platform consistency, flexibility, development efficiency
- **Negative:** Need to learn custom object API, limited to Twenty CRM's capabilities
- **Mitigation:** Provide training on custom objects, document best practices

---

#### ADR-003: Mobile Network Handling Strategy

**Status:** Decided  
**Date:** 2025-12-23  
**Decision Makers:** Architecture Team

**Context:**
Backend Specialists use system in factory field, network may be unstable. Users can record using mobile network (low data usage) or choose to record later in office.

**Options Evaluated:**

**Option 1: Pure Online (Mobile Network Support) - RECOMMENDED**
- **Pros:** Simple implementation, real-time sync, no conflict resolution needed
- **Cons:** Requires network connection
- **Trade-off:** Simplicity vs Network Dependency

**Option 2: Offline Mode with Sync**
- **Pros:** Works without network
- **Cons:** Complex implementation, conflict resolution needed, IndexedDB storage
- **Trade-off:** Network Independence vs Complexity

**Decision:**
Option 1: Pure Online (Mobile Network Support) with Automatic Retry

**Rationale:**
1. MVP Priority (40%): Fast delivery, simple implementation
2. User Experience (25%): Real-time sync, no conflict resolution needed
3. Data Integrity (20%): No data loss from conflicts
4. Performance (10%): No offline storage overhead
5. Complexity (5%): Simple implementation, automatic retry mechanism

**Consequences:**
- **Positive:** Fast MVP delivery, simple implementation, no conflict resolution needed
- **Negative:** Requires network connection (but mobile network is acceptable)
- **Mitigation:** Automatic retry mechanism, user can choose to record later in office

---

#### ADR-004: Caching Strategy

**Status:** Decided  
**Date:** 2025-12-23  
**Decision Makers:** Architecture Team

**Context:**
Performance targets: 30-second record completion, < 500ms API response. Need multi-layer caching strategy.

**Options Evaluated:**

**Option 1: Client-Side Caching Only (React Query)**
- **Pros:** Simple, reduces server load
- **Cons:** Limited to user's browser, no shared cache
- **Trade-off:** Simplicity vs Shared Benefits

**Option 2: Server-Side Caching Only (Redis)**
- **Pros:** Shared cache, benefits all users
- **Cons:** Network latency, server resource usage
- **Trade-off:** Shared Benefits vs Network Latency

**Option 3: Multi-Layer Caching (Client + Server) - RECOMMENDED**
- **Pros:** Best of both worlds, optimal performance
- **Cons:** Cache invalidation complexity, coordination needed
- **Trade-off:** Performance vs Complexity

**Decision:**
Option 3: Multi-Layer Caching (React Query + Redis)

**Rationale:**
1. Performance (35%): Optimal performance, meets < 500ms API target
2. User Experience (25%): Fast client-side responses, reduced server load
3. Scalability (20%): Server-side cache benefits all users
4. Cost Efficiency (15%): Reduces database load, saves resources
5. Complexity (5%): Manageable with proper cache invalidation strategy

**Consequences:**
- **Positive:** Optimal performance, excellent user experience, scalable
- **Negative:** Cache invalidation complexity, coordination between layers
- **Mitigation:** Establish cache invalidation strategy, use cache tags for coordination

---

#### ADR-005: Excel Import Processing Strategy

**Status:** Decided  
**Date:** 2025-12-23  
**Decision Makers:** Architecture Team

**Context:**
Legacy data migration from Excel, large files (5000+ records), user expects fast import.

**Options Evaluated:**

**Option 1: Synchronous Processing**
- **Pros:** Simple implementation, immediate feedback
- **Cons:** Blocks user, timeout risk for large files
- **Trade-off:** Simplicity vs User Experience

**Option 2: Asynchronous Processing (Bull Queue) - RECOMMENDED**
- **Pros:** Non-blocking, handles large files, progress tracking
- **Cons:** Complex implementation, requires queue infrastructure
- **Trade-off:** User Experience vs Complexity

**Option 3: Batch Processing with Chunks**
- **Pros:** Balanced approach, progress tracking
- **Cons:** Medium complexity, requires chunk management
- **Trade-off:** Balance vs Complexity

**Decision:**
Option 2: Asynchronous Processing (Bull Queue)

**Rationale:**
1. User Experience (35%): Non-blocking, handles large files gracefully
2. Scalability (25%): Can process multiple imports concurrently
3. Progress Tracking (20%): Real-time progress updates via WebSocket
4. Error Handling (15%): Detailed error reports, retry capability
5. Complexity (5%): Manageable with Bull Queue infrastructure

**Consequences:**
- **Positive:** Excellent user experience, scalable, robust error handling
- **Negative:** Requires queue infrastructure, WebSocket for progress
- **Mitigation:** Use existing Bull Queue setup, implement WebSocket progress updates

---

**ADR Summary:**
- **ADR-001:** Permission Filtering - Hybrid approach (Resolver + RLS)
- **ADR-002:** Product Association - Custom objects + relationship fields
- **ADR-003:** Offline Sync - Last-write-wins (MVP), Manual merge (Growth)
- **ADR-004:** Caching - Multi-layer (Client + Server)
- **ADR-005:** Excel Import - Asynchronous processing (Bull Queue)

**Key Insights from ADR Analysis:**
1. Defense-in-depth is critical for security-critical features (permission filtering)
2. Platform consistency balances flexibility and development efficiency (product association)
3. Phased approach allows fast MVP delivery with growth path (offline sync)
4. Multi-layer optimization achieves performance targets (caching)
5. User experience drives architectural choices (Excel import)

### Challenge from Critical Perspective Analysis

**Method Applied:** Challenge from Critical Perspective - Play devil's advocate to stress-test ideas and find weaknesses.

**Critical Challenges Identified:**

#### Challenge 1: Performance Targets Are Overly Optimistic

**Assumption Challenged:**
- GraphQL API response time < 500ms (P95)
- 30-second record completion target
- Support 50 concurrent users with < 10% performance degradation

**Critical Questions:**
1. **What if RLS policy checks add 100-200ms overhead per query?**
   - RLS policies are evaluated on every query, even with indexes
   - Complex RLS policies (role-based + customer type filtering) may be slow
   - **Risk:** API response time may exceed 500ms under load

2. **What if product association queries require multiple joins?**
   - Product-customer-interaction queries may need 3-4 table joins
   - Composite indexes help, but complex queries still slow
   - **Risk:** Search queries may exceed 1 second target

3. **What if caching invalidation causes cache misses?**
   - Frequent product/customer updates invalidate caches
   - Cache misses force database queries, increasing latency
   - **Risk:** Performance degradation during high update frequency

4. **What if 50 concurrent users all perform heavy operations?**
   - Excel imports, batch operations, complex queries simultaneously
   - Database connection pool may be exhausted
   - **Risk:** System may not handle concurrent load gracefully

**Strengthening Measures:**
- **Performance Testing:** Load testing with realistic scenarios (50 concurrent users, mixed operations)
- **Performance Budget:** Define per-operation budgets (e.g., product query < 200ms, customer query < 150ms)
- **RLS Optimization:** Profile RLS policy performance, optimize complex policies
- **Caching Strategy:** Implement cache warming, reduce cache invalidation frequency
- **Connection Pooling:** Configure appropriate pool size, monitor connection usage
- **Fallback Plan:** If targets cannot be met, adjust expectations or optimize further

---

#### Challenge 2: Data Isolation Implementation Complexity Underestimated

**Assumption Challenged:**
- Resolver (main) + RLS (defense) approach is "medium complexity"
- Coordination between two layers is manageable
- Complete data isolation is achievable

**Critical Questions:**
1. **What if Resolver and RLS logic diverge over time?**
   - Two layers implementing similar logic may drift apart
   - Bug fixes in one layer may not be applied to the other
   - **Risk:** Security gaps, inconsistent behavior

2. **What if RLS policies are too complex to maintain?**
   - Role-based + customer type + product association filtering
   - Complex policies are hard to test and debug
   - **Risk:** Maintenance burden, potential bugs

3. **What if GraphQL Resolver filtering is bypassed?**
   - Direct database access (admin tools, migrations, scripts)
   - RLS must catch all cases, but what if it doesn't?
   - **Risk:** Data leakage, security breach

4. **What if role changes require complex data migration?**
   - Frontend Specialist → Backend Specialist: All buyer data becomes inaccessible
   - Historical records visibility changes
   - **Risk:** Data loss, user confusion, audit issues

**Strengthening Measures:**
- **Unified Logic:** Extract permission logic into shared service, use by both Resolver and RLS
- **Comprehensive Testing:** Test all permission scenarios, including edge cases
- **Security Audit:** Regular security audits, penetration testing
- **Documentation:** Clear documentation of permission logic, decision trees
- **Migration Testing:** Test role change scenarios, validate data access after migration
- **Monitoring:** Alert on permission violations, audit all data access

---

#### Challenge 3: Offline Sync Conflict Resolution Is Too Simplistic

**Assumption Challenged:**
- Last-write-wins is acceptable for MVP
- Growth stage manual merge is feasible
- 8-hour offline period is manageable

**Critical Questions:**
1. **What if network is persistently unstable in factory field?**
   - Backend Specialist A edits interaction at 10:00 AM
   - Backend Specialist B edits same interaction at 2:00 PM
   - Both sync at 5:00 PM - last write wins, but what about the first edit?
   - **Risk:** Data loss, user frustration

2. **What if offline period exceeds 8 hours?**
   - Factory network outage, user forgets to sync
   - Multiple days of offline changes accumulate
   - **Risk:** Massive conflict resolution, potential data loss

3. **What if manual merge is too complex for users?**
   - Users may not understand conflict resolution
   - Manual merge may be error-prone
   - **Risk:** User rejection, data corruption

4. **What if sync queue grows too large?**
   - Thousands of offline changes queued
   - Sync process may take hours
   - **Risk:** Poor user experience, system overload

**Strengthening Measures:**
- **Conflict Detection:** Detect conflicts early, notify users before sync
- **Conflict Preview:** Show users what will be lost before accepting last-write-wins
- **Offline Limits:** Warn users when offline period exceeds 8 hours
- **Batch Sync:** Implement batch sync with progress tracking
- **User Training:** Provide clear guidance on conflict resolution
- **Fallback:** If manual merge is too complex, consider automatic merge strategies

---

#### Challenge 4: Excel Import Assumes Clean Data

**Assumption Challenged:**
- Real-time validation during import is sufficient
- Error reports with fix suggestions are helpful
- Asynchronous processing handles large files

**Critical Questions:**
1. **What if Excel data is completely malformed?**
   - Missing required columns, wrong data types, encoding issues
   - Validation may catch some, but not all issues
   - **Risk:** Import failure, user frustration

2. **What if product associations are missing or incorrect?**
   - Excel may not have product information
   - Product matching may fail (fuzzy matching needed?)
   - **Risk:** Incomplete data, manual correction required

3. **What if import takes hours for large files?**
   - 10,000+ records, complex validation, product association
   - User may lose connection, need to restart
   - **Risk:** Poor user experience, import failures

4. **What if Bull Queue fails during import?**
   - Queue server crash, job lost
   - No way to resume import
   - **Risk:** Data loss, user frustration

**Strengthening Measures:**
- **Pre-import Validation:** Validate Excel structure before starting import
- **Data Cleaning:** Automatic data cleaning (trim whitespace, fix encoding)
- **Product Matching:** Implement fuzzy matching for product associations
- **Import Resume:** Save import progress, allow resume after failure
- **Queue Persistence:** Use persistent queue (Redis persistence), prevent job loss
- **User Guidance:** Provide Excel templates, validation rules documentation

---

#### Challenge 5: System Architecture Assumes Smooth Growth Path

**Assumption Challenged:**
- Monolithic architecture is sufficient for MVP
- Modular design enables easy microservices migration
- Growth to 100+ users triggers microservices consideration

**Critical Questions:**
1. **What if microservices migration is harder than expected?**
   - Modular design helps, but migration is still complex
   - Database schema changes, API versioning, deployment complexity
   - **Risk:** Migration failure, technical debt

2. **What if user growth is faster than expected?**
   - 100 users in 6 months instead of 12 months
   - System may not handle load, need urgent scaling
   - **Risk:** Performance degradation, user dissatisfaction

3. **What if Twenty CRM upgrades break customizations?**
   - Custom objects, Resolver modifications may break
   - Upgrades may require significant rework
   - **Risk:** Upgrade delays, compatibility issues

4. **What if database becomes bottleneck?**
   - PostgreSQL may not scale beyond certain point
   - Need read replicas, sharding, or different database
   - **Risk:** Performance issues, architectural changes required

**Strengthening Measures:**
- **Scalability Testing:** Test system with 100+ users, identify bottlenecks early
- **Upgrade Strategy:** Plan for Twenty CRM upgrades, test compatibility
- **Database Scaling:** Plan for read replicas, connection pooling, query optimization
- **Monitoring:** Monitor system metrics, alert on performance degradation
- **Migration Plan:** Detailed microservices migration plan, phased approach
- **Fallback:** If growth is faster, consider microservices earlier

---

#### Challenge 6: Monitoring and Alerting May Be Insufficient

**Assumption Challenged:**
- Structured logging + performance monitoring is sufficient
- Alerting thresholds are appropriate
- Business metrics are trackable

**Critical Questions:**
1. **What if alerts are too noisy or too quiet?**
   - Too many false positives → alert fatigue
   - Too few alerts → miss critical issues
   - **Risk:** Critical issues go unnoticed

2. **What if business metrics are not actionable?**
   - Track metrics but don't know how to improve
   - Metrics may not reflect user satisfaction
   - **Risk:** Metrics become vanity metrics

3. **What if logging overhead impacts performance?**
   - Extensive logging may slow down system
   - Log storage may become expensive
   - **Risk:** Performance degradation, cost overruns

4. **What if monitoring doesn't catch edge cases?**
   - Monitoring focuses on happy path
   - Edge cases may go unnoticed
   - **Risk:** Production issues, user impact

**Strengthening Measures:**
- **Alert Tuning:** Fine-tune alert thresholds, reduce false positives
- **Actionable Metrics:** Define actionable metrics, link to business outcomes
- **Log Sampling:** Implement log sampling for high-volume operations
- **Edge Case Monitoring:** Monitor edge cases, error patterns
- **Cost Management:** Monitor log storage costs, implement retention policies
- **Review Process:** Regular review of monitoring effectiveness

---

#### Challenge 7: MVP Scope May Be Too Ambitious

**Assumption Challenged:**
- P0 features are achievable in 0-3 months
- Product association + offline sync + Excel import is feasible
- 30-second record completion is realistic

**Critical Questions:**
1. **What if product association implementation is more complex?**
   - Custom objects + relationship fields may have limitations
   - Complex queries may require significant optimization
   - **Risk:** MVP delay, scope creep

2. **What if offline sync takes longer than expected?**
   - IndexedDB implementation, conflict resolution, sync queue
   - Testing offline scenarios is time-consuming
   - **Risk:** MVP delay, incomplete feature

3. **What if Excel import has unexpected issues?**
   - Data validation, product matching, error handling
   - User testing reveals edge cases
   - **Risk:** MVP delay, poor user experience

4. **What if 30-second record target is unrealistic?**
   - Product selection, customer lookup, form filling
   - Network latency, database queries
   - **Risk:** User dissatisfaction, feature rejection

**Strengthening Measures:**
- **Risk Assessment:** Identify high-risk features, plan mitigation
- **Phased Delivery:** Break MVP into smaller phases, deliver incrementally
- **User Testing:** Early user testing, validate assumptions
- **Scope Flexibility:** Be ready to adjust scope if needed
- **Time Buffers:** Add time buffers for unexpected issues
- **Fallback Plan:** Define minimum viable MVP, prioritize must-haves

---

**Summary of Critical Challenges:**

1. **Performance Targets:** May be overly optimistic, need realistic testing
2. **Data Isolation:** Implementation complexity underestimated, need unified logic
3. **Offline Sync:** Conflict resolution too simplistic, need better strategy
4. **Excel Import:** Assumes clean data, need robust validation
5. **System Architecture:** Growth path assumptions may be wrong, need flexibility
6. **Monitoring:** May be insufficient, need actionable metrics
7. **MVP Scope:** May be too ambitious, need risk assessment

**Key Recommendations:**
- **Performance Testing:** Conduct realistic load testing early
- **Security Audit:** Regular security audits, penetration testing
- **User Testing:** Early user testing, validate assumptions
- **Risk Management:** Identify and mitigate high-risk areas
- **Flexibility:** Be ready to adjust plans based on learnings
- **Monitoring:** Implement comprehensive, actionable monitoring

## Starter Template Evaluation

### Primary Technology Domain

**Full-Stack Web Application** based on project requirements analysis:
- Frontend: React + TypeScript (responsive web + mobile)
- Backend: NestJS + TypeScript (GraphQL API)
- Database: PostgreSQL with RLS support
- Offline Support: IndexedDB (mobile)
- Deployment: Docker-based containerization

### Starter Options Considered

**Evaluation Context:**
This project is a customization of Twenty CRM, not a greenfield application. Twenty CRM serves as the base platform/starter, providing the foundational architecture and core CRM functionality.

**Alternative Approaches Considered:**
1. **Greenfield Development** - Build from scratch using Next.js/Vite starter templates
   - **Rejected:** Would require rebuilding core CRM functionality (customer management, contact management, GraphQL API), significantly increasing development time and complexity
   
2. **Other CRM Platforms** - Use alternative open-source CRM platforms
   - **Rejected:** Technology stack mismatch, limited customization capabilities, or licensing concerns
   
3. **Twenty CRM Customization** - Extend Twenty CRM with custom objects and features
   - **Selected:** Best fit for project requirements, leverages existing mature platform

### Selected Starter: Twenty CRM Platform

**Rationale for Selection:**

1. **Technology Stack Match (95%):**
   - NestJS + React + TypeScript + PostgreSQL + GraphQL - exactly matches project requirements
   - Tailwind CSS support for design customization
   - Docker deployment ready

2. **Core Functionality (9/10):**
   - Customer management: Complete CRUD operations, flexible data model
   - Contact management: Full relationship management
   - GraphQL API: Flexible data querying and manipulation
   - Custom objects: Extensible data model for product association

3. **Extensibility (9/10):**
   - Custom objects and fields support
   - GraphQL Resolver customization
   - Frontend component extension
   - Plugin architecture for future enhancements

4. **Development Efficiency:**
   - Mature, production-ready platform
   - Active maintenance and community support
   - Comprehensive documentation
   - Reduces development time by 60-70% compared to greenfield

5. **Project Requirements Alignment:**
   - ✅ Core CRM functionality (customer, contact management)
   - ✅ GraphQL API for all operations
   - ✅ Custom objects for product association
   - ✅ Role-based access control foundation
   - ⚠️ AI analysis: Requires custom integration (Growth stage)
   - ⚠️ Offline sync: Requires custom implementation (MVP requirement)
   - ⚠️ Excel import/export: Requires custom implementation (MVP requirement)

**Initialization Approach:**

Since Twenty CRM is already deployed and evaluated, the project will:
1. Use existing Twenty CRM deployment as base
2. Extend with custom objects (Product, Product-Customer-Interaction)
3. Customize GraphQL Resolvers for role-based filtering
4. Add custom frontend components (Quick Record, Product Selector, Offline Sync)
5. Implement custom services (Excel import/export, offline sync queue)

**Note:** Project initialization using Twenty CRM as base platform is the foundation for all implementation stories.

### Architectural Decisions Provided by Twenty CRM

**Language & Runtime:**
- **TypeScript:** Strict type checking enabled, comprehensive type definitions
- **Node.js:** Latest LTS version support
- **Runtime Configuration:** Environment-based configuration (development, staging, production)

**Frontend Architecture:**
- **React 18+:** Modern React with hooks, concurrent features
- **Component Library:** Twenty CRM's component system (extensible)
- **State Management:** React Query for server state, local state for UI
- **Routing:** React Router (integrated in Twenty CRM)
- **Styling:** Tailwind CSS (customizable theme)

**Backend Architecture:**
- **NestJS Framework:** Modular architecture, dependency injection
- **GraphQL API:** Apollo Server integration
- **Database Layer:** TypeORM for database abstraction
- **Authentication:** JWT-based authentication (Twenty CRM standard)
- **Authorization:** Role-based access control foundation

**Database:**
- **PostgreSQL:** Production-ready relational database
- **Schema Management:** TypeORM migrations
- **Row Level Security (RLS):** Supported, ready for implementation
- **Indexing:** Automatic index management via TypeORM

**Build Tooling:**
- **Frontend Build:** Vite (fast HMR, optimized builds)
- **Backend Build:** TypeScript compiler, NestJS build system
- **Monorepo:** Nx workspace for managing multiple packages
- **Docker:** Containerization for deployment

**Testing Framework:**
- **Unit Testing:** Jest (configured in Twenty CRM)
- **Integration Testing:** Test utilities provided
- **E2E Testing:** Playwright (if needed)
- **Test Coverage:** Coverage reporting configured

**Code Organization:**
- **Monorepo Structure:** `packages/twenty-server`, `packages/twenty-front`
- **Module Organization:** Feature-based modules (customer, contact, custom objects)
- **Shared Libraries:** Common utilities and types
- **API Layer:** GraphQL schema and resolvers organized by domain

**Development Experience:**
- **Hot Reloading:** Fast refresh for frontend, watch mode for backend
- **TypeScript:** Full type safety across frontend and backend
- **Linting:** ESLint configured
- **Formatting:** Prettier configured
- **Debugging:** Source maps enabled, debugging support

**Deployment:**
- **Docker Compose:** Multi-container setup (server, database, redis, worker)
- **Environment Configuration:** `.env` file management
- **Health Checks:** Built-in health check endpoints
- **Logging:** Structured logging with Winston

### Customization Requirements

**Custom Objects to Create:**
1. **Product Object:**
   - Fields: Name, HS Code, Description, Category, Status
   - Relationships: Many-to-many with Customer (via Interaction)

2. **Product-Customer-Interaction Object:**
   - Fields: Product (relationship), Customer (relationship), Interaction Type, Date, Notes, Status
   - Relationships: Product, Customer

**Custom GraphQL Resolvers:**
- Role-based data filtering (Frontend/Backend Specialist isolation)
- Product-customer-interaction queries
- Custom search and filtering logic

**Custom Frontend Components:**
- Quick Record Form Component
- Product Selector Component
- Offline Sync Status Component
- Product-Customer-Interaction View

**Custom Services:**
- Excel Import/Export Service (Bull Queue integration)
- Offline Sync Service (IndexedDB + sync queue)
- Product Association Service
- Permission Service (unified logic for Resolver + RLS)

**Integration Points:**
- AI Analysis Service (Growth stage) - External microservice
- Email Integration (if needed) - Twenty CRM has email integration
- Calendar Integration (if needed) - Twenty CRM has calendar integration

### Platform Compatibility Considerations

**Upgrade Strategy:**
- Monitor Twenty CRM releases and changelog
- Test upgrades in staging environment first
- Maintain abstraction layer for customizations
- Document all customization dependencies

**Compatibility Maintenance:**
- Use public APIs when possible
- Minimize dependency on internal APIs
- Create wrapper components for Twenty CRM components
- Version compatibility checks before upgrades

### UX Requirements Alignment

**From UX Design Specification:**
- ✅ **Design System:** Twenty CRM + Tailwind CSS customization (matches UX spec)
- ✅ **Responsive Design:** Mobile-first approach supported
- ✅ **Accessibility:** WCAG 2.1 Level AA foundation
- ⚠️ **Custom Components:** Quick Record, Product Selector require custom development
- ⚠️ **Offline Support:** Requires custom IndexedDB implementation
- ⚠️ **Mobile Optimization:** Requires custom mobile components

**Design System Integration:**
- Retain Twenty CRM's design tokens
- Extend with custom tokens for product association UI
- Customize color system (soft blue/purple theme)
- Maintain consistency with Twenty CRM's component patterns

### Party Mode Discussion Insights

**Discussion Topic:** Evaluating Twenty CRM as base platform/starter - trade-offs from multiple perspectives

**Participants:**
- **Winston (Architect)** - Technical architecture and scalability perspective
- **John (PM)** - Product strategy and business value perspective
- **Amelia (Dev)** - Development implementation and engineering efficiency perspective

**Key Discussion Points:**

**Winston's Architectural Perspective:**
- **Platform Assessment:** Twenty CRM is a solid choice - mature tech stack, good extensibility
- **Critical Concerns:**
  1. **Upgrade Compatibility:** Customizations may break with Twenty CRM upgrades - need abstraction layer
  2. **Performance:** GraphQL + RLS may add latency - requires performance testing and optimization
  3. **Data Model:** Custom objects (Product, Product-Customer-Interaction) must align with Twenty CRM's architecture patterns
- **Recommendation:** Treat Twenty CRM as "managed dependency" - clear boundaries for future migration/replacement

**John's Product Management Perspective:**
- **Business Value:**** 60-70% time savings = faster MVP delivery = faster business value validation
- **Critical Questions:**
  1. **User Adoption:** Does platform choice affect adoption? Need data validation
  2. **Customization Cost:** What's the actual effort for Excel import, offline sync customizations?
  3. **Business Value:** Product association is core differentiator - does Twenty CRM support it? Need confirmation
- **Risk Assessment:** If customization cost too high, might be better to start from scratch
- **Recommendation:** Build POC first - validate critical customization feasibility

**Amelia's Development Perspective:**
- **Implementation Paths:**
  - Custom objects: `packages/twenty-server/src/core/custom-object/`
  - Resolver customization: `packages/twenty-server/src/core/graphql/resolvers/`
- **Critical Confirmations Needed:**
  1. Custom object API stability - will it change in upgrades?
  2. Resolver customization scope - can it meet role filtering requirements?
  3. Offline sync implementation path - IndexedDB + sync queue feasibility?
- **Recommendation:** Technical validation first - confirm key customization points before committing

**Cross-Agent Discussion:**

**Winston → John:**
- Customization cost concern valid, but "from scratch" has higher risk
- Need to rebuild customer management, contact management, GraphQL API - significant time cost
- Recommendation: "Incremental validation" strategy - validate most critical customizations first (product association, permission filtering), then decide

**John → Amelia:**
- Technical validation critical, but also need "implementation cost" validation
- If product association requires heavy customization, may need to reconsider
- Recommendation: Set cost threshold - if customization > 40% of total dev time, consider alternatives

**Amelia → Winston:**
- Abstraction layer has its own cost
- Need to evaluate: abstraction maintenance cost vs direct Twenty CRM dependency risk
- If Twenty CRM APIs relatively stable, may not need excessive abstraction

**Consensus & Recommendations:**

**Unanimous Agreement:**
- Twenty CRM as base platform is reasonable choice
- But requires validation and risk mitigation

**Key Requirements:**
1. **Technical Validation:** Build POC first - validate critical customization feasibility
2. **Cost Assessment:** Evaluate customization costs, set thresholds
3. **Risk Mitigation:** Build abstraction layer, but avoid over-engineering
4. **Incremental Validation:** Validate in stages, not all at once

**Action Items:**
- [ ] Create POC to validate product association custom objects
- [ ] Assess Excel import/offline sync implementation costs
- [ ] Establish Twenty CRM upgrade compatibility strategy
- [ ] Set customization cost threshold (recommendation: < 40% of total dev time)

**Implementation Strategy:**
- **Phase 1:** POC validation (product association, permission filtering)
- **Phase 2:** Cost assessment and threshold evaluation
- **Phase 3:** Full commitment decision based on validation results
- **Phase 4:** Abstraction layer design (if proceeding with Twenty CRM)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- ✅ Permission filtering strategy (ADR-001: Resolver + RLS hybrid)
- ✅ Product association data model (ADR-002: Custom objects + relationship fields)
- ✅ Offline sync conflict resolution (ADR-003: Last-write-wins MVP, Manual merge Growth)
- ✅ Caching strategy (ADR-004: Multi-layer React Query + Redis)
- ✅ Excel import processing (ADR-005: Asynchronous Bull Queue)
- ✅ Base platform selection (Twenty CRM - Step 3)

**Important Decisions (Shape Architecture):**
- ✅ Data consistency strategy (Soft delete + foreign key constraints)
- ✅ Error handling approach (Layered: User/Business/System)
- ✅ Monitoring strategy (Structured logging + performance metrics)
- ✅ Deployment strategy (Brief downtime MVP, hot deployment Growth)

**Deferred Decisions (Post-MVP):**
- AI analysis service architecture (Growth stage - external microservice)
- Real-time updates (WebSocket/GraphQL Subscriptions - Growth stage)
- Advanced conflict resolution (Manual merge - Growth stage)
- Microservices migration (if user base > 100 or data volume 10x)

### Data Architecture

**Database Platform:**
- **Decision:** PostgreSQL (provided by Twenty CRM)
- **Version:** Latest stable version supported by Twenty CRM
- **Rationale:** Production-ready, RLS support, TypeORM integration
- **Provided by:** Twenty CRM starter

**Data Modeling Approach:**
- **Decision:** Twenty CRM Custom Objects + Relationship Fields
- **Rationale:** Aligns with platform architecture, flexible and extensible (ADR-002)
- **Custom Objects:**
  - Product Object: Name, HS Code, Description, Category, Status
  - Product-Customer-Interaction Object: Links Product + Customer + Interaction details
- **Affects:** All product association features, search queries, business analytics

**Data Validation Strategy:**
- **Decision:** Multi-layer validation (Client + Server + Database)
- **Client-side:** React Hook Form validation, real-time feedback
- **Server-side:** NestJS DTOs with class-validator, business rule validation
- **Database:** Foreign key constraints, check constraints, NOT NULL constraints
- **Affects:** Data integrity, user experience, error handling

**Migration Approach:**
- **Decision:** TypeORM migrations (Twenty CRM standard) + Custom migration scripts
- **Excel Import:** Asynchronous processing with Bull Queue, real-time validation
- **Data Cleaning:** Automatic data cleaning (trim, encoding fixes, format normalization)
- **Product Matching:** Fuzzy matching for product associations
- **Affects:** Data migration, Excel import feature, data quality

**Caching Strategy:**
- **Decision:** Multi-layer caching (ADR-004)
- **Client-side (React Query):**
  - Product list: 5min TTL
  - Customer list: 5min TTL
  - Product-customer associations: 10min TTL
- **Server-side (Redis):**
  - Common product queries: 10min TTL
  - Common customer queries: 10min TTL
  - Product association queries: 5min TTL
- **Cache Invalidation:** Tag-based invalidation, manual invalidation on updates
- **Affects:** Performance, API response times, user experience

### Authentication & Security

**Authentication Method:**
- **Decision:** JWT-based authentication (provided by Twenty CRM)
- **Rationale:** Standard Twenty CRM authentication, secure, stateless
- **Provided by:** Twenty CRM starter

**Authorization Patterns:**
- **Decision:** GraphQL Resolver (Primary) + PostgreSQL RLS (Defense) - Hybrid approach (ADR-001)
- **Implementation:**
  - Resolver layer: Application logic + caching for performance
  - RLS layer: Database security, optimized with indexes
  - Unified permission service: Single source of truth for permission logic
- **Role-Based Access:**
  - Frontend Specialist: Buyer-type customers only
  - Backend Specialist: Supplier-type customers only
  - Director/Administrator: All customer types
- **Affects:** All data access operations, security, performance

**Security Middleware:**
- **Decision:** NestJS Guards + Custom Permission Guards
- **Authentication Guard:** JWT validation (Twenty CRM standard)
- **Authorization Guard:** Role-based permission checking
- **Data Isolation Guard:** Customer type filtering based on user role
- **Affects:** API security, permission enforcement

**Data Encryption Approach:**
- **Decision:** AES-256 encryption for sensitive data at rest
- **Transit:** TLS/SSL for all API communications (HTTPS)
- **Database:** PostgreSQL encryption at rest (if enabled)
- **Affects:** Data security, compliance (GDPR, Personal Information Protection Law)

**API Security Strategy:**
- **Decision:** GraphQL API with authentication + authorization guards
- **Rate Limiting:** Implement rate limiting for API endpoints (Growth stage)
- **Input Validation:** DTOs with class-validator for all inputs
- **Error Handling:** Sanitized error messages, no sensitive data exposure
- **Affects:** API security, DDoS protection, data integrity

### API & Communication Patterns

**API Design Pattern:**
- **Decision:** GraphQL API (provided by Twenty CRM)
- **Rationale:** Flexible queries, single endpoint, type-safe
- **Provided by:** Twenty CRM starter

**API Documentation Approach:**
- **Decision:** GraphQL Schema + Code comments + API documentation
- **GraphQL Schema:** Auto-generated from TypeScript types
- **Code Comments:** JSDoc comments for resolvers and services
- **API Documentation:** Comprehensive documentation for custom endpoints
- **Target:** > 90% API documentation coverage (NFR)
- **Affects:** Developer experience, API usability

**Error Handling Standards:**
- **Decision:** Layered error handling (User/Business/System layers)
- **User Layer:** React Error Boundary, friendly error messages, recovery suggestions
- **Business Layer:** Custom business exceptions with error codes and user-friendly messages
- **System Layer:** Global exception filter, structured logging, error tracking
- **Error Format:** Consistent error response structure with error codes
- **Affects:** User experience, debugging, system reliability

**Rate Limiting Strategy:**
- **Decision:** Deferred to Growth stage
- **MVP:** No rate limiting (acceptable for < 50 users)
- **Growth:** Implement rate limiting per user/IP
- **Affects:** API security, DDoS protection

**Communication Between Services:**
- **Decision:** GraphQL API for all internal communication
- **External Services:** REST API for AI analysis service (Growth stage)
- **Real-time:** WebSocket or GraphQL Subscriptions (Growth stage)
- **Affects:** Service integration, real-time features

### Frontend Architecture

**State Management Approach:**
- **Decision:** React Query (server state) + Local state (UI state) - provided by Twenty CRM
- **React Query:** All server data fetching, caching, synchronization
- **Local State:** UI state, form state, component state
- **Rationale:** Twenty CRM standard, efficient, type-safe
- **Provided by:** Twenty CRM starter

**Component Architecture:**
- **Decision:** Twenty CRM component system + Custom components
- **Base Components:** Reuse Twenty CRM components where possible
- **Custom Components:**
  - Quick Record Form Component
  - Product Selector Component
  - Offline Sync Status Component
  - Product-Customer-Interaction View
- **Pattern:** Composition pattern, custom hooks for logic separation
- **Affects:** Code organization, reusability, maintainability

**Routing Strategy:**
- **Decision:** React Router (provided by Twenty CRM)
- **Rationale:** Standard Twenty CRM routing, supports nested routes
- **Provided by:** Twenty CRM starter

**Performance Optimization:**
- **Decision:** Code splitting, lazy loading, image optimization
- **Code Splitting:** Route-based code splitting, component lazy loading
- **Image Optimization:** Next-gen image formats, lazy loading
- **Bundle Optimization:** Tree shaking, minification (Vite handles this)
- **Affects:** Page load times, user experience

**Bundle Optimization:**
- **Decision:** Vite build tool (provided by Twenty CRM)
- **Features:** Fast HMR, optimized production builds, tree shaking
- **Provided by:** Twenty CRM starter

### Infrastructure & Deployment

**Hosting Strategy:**
- **Decision:** Docker-based deployment (provided by Twenty CRM)
- **Docker Compose:** Multi-container setup (server, database, redis, worker)
- **Rationale:** Twenty CRM standard, portable, scalable
- **Provided by:** Twenty CRM starter

**CI/CD Pipeline Approach:**
- **Decision:** Deferred to Growth stage
- **MVP:** Manual deployment with Docker Compose
- **Growth:** Automated CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
- **Affects:** Deployment frequency, release process

**Environment Configuration:**
- **Decision:** Environment variables via `.env` files (Twenty CRM standard)
- **Environments:** Development, Staging, Production
- **Configuration:** Server URL, database connection, Redis connection, API keys
- **Provided by:** Twenty CRM starter

**Monitoring and Logging:**
- **Decision:** Structured logging (Winston) + Performance monitoring
- **Logging:**
  - Structured logs with levels (error, warn, info, debug)
  - Log format: `{ level, message, context, timestamp, userId }`
- **Performance Monitoring:**
  - API response time tracking
  - Database query time tracking
  - Health check endpoints (`/health`)
- **Business Metrics:**
  - Record completion rate
  - Product association usage rate
  - User activity metrics
- **Alerting:**
  - Error rate > 1%
  - Response time > 1s
  - System availability < 99%
- **Affects:** System observability, debugging, business insights

**Scaling Strategy:**
- **Decision:** Vertical scaling (MVP) → Horizontal scaling (Growth)
- **MVP:** Single server, vertical scaling if needed
- **Growth:** Horizontal scaling with load balancer, read replicas for database
- **Trigger:** User base > 100 or data volume 10x increase
- **Affects:** System capacity, performance, cost

### Decision Impact Analysis

**Implementation Sequence:**

**MVP Phase 1 (Foundation - 0-6 weeks):**

1. **Foundation Setup:**
   - Twenty CRM deployment (already done)
   - Environment configuration
   - Database setup with RLS support

2. **Core Data Model:**
   - Create Product custom object
   - Create Product-Customer-Interaction custom object
   - Establish relationships and indexes
   - **Validation Checkpoint:** POC validation - verify data model supports all business scenarios

3. **Permission System:**
   - Implement unified permission service (`packages/twenty-server/src/core/permission/permission.service.ts`)
   - Configure GraphQL Resolver filtering (using permission service)
   - Set up PostgreSQL RLS policies (using permission service)
   - **Validation Checkpoint:** POC validation - verify permission filtering effectiveness

**MVP Phase 2 (Core Features - 6-12 weeks):**

4. **Core Features:**
   - Quick Record component
   - Product Selector component
   - Excel import/export service (async processing with Bull Queue)
   - Offline sync service (IndexedDB + sync queue)

5. **Performance Optimization:**
   - Implement caching strategy (React Query + Redis)
   - Database indexing (product, customer, interaction indexes)
   - Query optimization
   - **Validation Checkpoint:** Performance testing - verify API response times under load

6. **Monitoring & Logging:**
   - Set up structured logging (Winston)
   - Implement performance monitoring
   - Configure alerting
   - **Validation Checkpoint:** User testing, security audit

**Cross-Component Dependencies:**
- **Permission System → All Features:** All data access depends on permission filtering
- **Product Association → Quick Record:** Quick record requires product association
- **Offline Sync → Quick Record:** Mobile quick record requires offline sync
- **Caching → Performance:** Caching affects all API response times
- **Excel Import → Data Model:** Excel import must validate against data model
- **Monitoring → All Components:** Monitoring tracks all system components

**Decision Validation Requirements:**
- [ ] POC: Product association custom objects
- [ ] POC: Permission filtering (Resolver + RLS)
- [ ] Performance testing: API response times under load
- [ ] Security audit: Permission system effectiveness
- [ ] Cost assessment: Customization effort vs threshold

### Party Mode Discussion Insights

**Discussion Topic:** Reviewing core architectural decisions - evaluating trade-offs from multiple perspectives

**Participants:**
- **Winston (Architect)** - Technical architecture and scalability perspective
- **John (PM)** - Product strategy and business value perspective
- **Amelia (Dev)** - Development implementation and engineering efficiency perspective
- **Mary (Analyst)** - Business analysis and requirements validation perspective

**Key Discussion Points:**

**Winston's Architectural Review:**
- **Overall Assessment:** Decisions are sound, but need implementation details clarified
- **Critical Concerns:**
  1. **Unified Permission Service:** Need clear implementation path - create `PermissionService` that both Resolver and RLS call to avoid logic divergence
  2. **Caching Strategy:** TTL settings (5-10min) need validation - should be based on performance testing, not assumptions
  3. **Data Validation:** Multi-layer validation is good, but need clear responsibility division to avoid performance impact from duplicate validation
- **Recommendations:**
  - Add implementation details to ADR: Create `PermissionService` as single source of truth
  - Performance test cache TTL settings, adjust based on actual access patterns
  - Define clear validation layer responsibilities

**John's Product Management Review:**
- **MVP Alignment:** Decisions support MVP goals, but need validation
- **Critical Questions:**
  1. **Implementation Sequence:** Can 6 phases be completed in 3 months? Need validation
  2. **Deferred Decisions:** Are AI analysis, real-time updates correctly deferred? Need confirmation they don't affect MVP core value
  3. **Validation Requirements:** Are 5 validation items sufficient? Need user testing validation
- **Recommendations:**
  - Treat phases 1-2 as POC, validate feasibility before proceeding
  - Confirm deferred features don't affect MVP core value proposition
  - Add user testing validation items

**Amelia's Development Review:**
- **Implementation Clarity:** Need technical details for implementation
- **Critical Details Needed:**
  1. **Unified Permission Service:** Implementation path - `packages/twenty-server/src/core/permission/permission.service.ts` with methods like `canAccessCustomer(user, customer)`
  2. **Cache Invalidation:** Tag-based invalidation implementation - use Redis tags or custom tag system
  3. **Error Handling:** Need unified error code specification - define error code enum for consistency across layers
- **Recommendations:**
  - Document implementation paths for key services
  - Define error code specification framework
  - Clarify cache invalidation implementation approach

**Mary's Business Analysis Review:**
- **Business Requirements Validation:** Need to verify decisions meet business needs
- **Critical Validations:**
  1. **Data Model:** Does Product-Customer-Interaction object support all business scenarios? Need to verify it covers all interaction types (inquiry, quote, order, production progress, inspection, etc.)
  2. **Permission Isolation:** Does complete Frontend/Backend Specialist isolation meet business collaboration needs? Need to confirm if cross-role collaboration mechanisms needed (Growth stage)
  3. **Excel Import:** Will async processing + fuzzy matching meet user expectations? Need to verify users accept async import, fuzzy matching accuracy sufficient
- **Recommendations:**
  - Validate data model supports all business scenarios in POC
  - Confirm permission isolation meets business collaboration needs
  - Test Excel import user acceptance and fuzzy matching accuracy

**Cross-Agent Discussion:**

**Winston → John:**
- Implementation sequence concern valid - suggest treating phases 1-3 as MVP Phase 1, phases 4-6 as MVP Phase 2 for phased delivery and risk reduction

**John → Amelia:**
- Technical details important, but should be determined during implementation phase - focus now on validating architectural decision soundness. Suggest marking "implementation details TBD" in decision document to avoid over-engineering

**Amelia → Mary:**
- Data model validation critical - suggest validating Product-Customer-Interaction object supports all business scenarios in POC phase, adjust data model if needed

**Mary → Winston:**
- Caching strategy needs performance testing, but should be based on actual user behavior data, not assumptions - suggest implementing basic caching in MVP, optimize based on user behavior data

**Consensus & Recommendations:**

**Unanimous Agreement:**
- Core architectural decisions are sound overall, but need implementation details and validation

**Key Enhancements Needed:**
1. **Implementation Details:**
   - Unified permission service implementation path
   - Cache invalidation specific implementation
   - Error code specification

2. **Decision Validation:**
   - POC validation for critical decisions (product association, permission filtering)
   - Performance testing for caching strategy
   - User testing for business requirements

3. **Phased Implementation:**
   - MVP Phase 1: Phases 1-3 (Foundation)
   - MVP Phase 2: Phases 4-6 (Optimization)

**Enhancement Actions:**
- [ ] Add implementation detail annotations to decision document
- [ ] Add user testing validation items
- [ ] Clarify POC validation scope
- [ ] Define error code specification framework
- [ ] Document unified permission service implementation path
- [ ] Specify cache invalidation implementation approach

**Revised Implementation Sequence:**

**MVP Phase 1 (Foundation - 0-6 weeks):**
1. Foundation Setup (Twenty CRM deployment, environment, database)
2. Core Data Model (Product, Product-Customer-Interaction custom objects)
3. Permission System (Unified permission service, Resolver + RLS)

**MVP Phase 2 (Core Features - 6-12 weeks):**
4. Core Features (Quick Record, Product Selector, Excel import/export, Offline sync)
5. Performance Optimization (Caching, indexing, query optimization)
6. Monitoring & Logging (Structured logging, performance monitoring, alerting)

**Validation Checkpoints:**
- After Phase 1: POC validation (product association, permission filtering)
- After Phase 2: User testing, performance testing, security audit

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
15+ areas where AI agents could make different choices, potentially causing implementation conflicts and inconsistencies.

**Pattern Philosophy:**
- Follow Twenty CRM conventions where applicable to maintain platform compatibility
- Establish clear patterns for customizations to ensure consistency
- Document patterns with concrete examples to prevent ambiguity
- All patterns must be enforceable and verifiable

### Naming Patterns

**Database Naming Conventions:**

**Table Naming:**
- **Pattern:** `snake_case`, lowercase, plural nouns
- **Examples:** `products`, `customers`, `product_customer_interactions`
- **Rationale:** PostgreSQL convention, matches Twenty CRM standard
- **Custom Objects:** Follow Twenty CRM custom object naming (typically `snake_case`)

**Column Naming:**
- **Pattern:** `snake_case`, lowercase
- **Examples:** `user_id`, `product_name`, `created_at`, `is_active`
- **Foreign Keys:** `{referenced_table}_id` (e.g., `product_id`, `customer_id`)
- **Boolean Columns:** Prefix with `is_`, `has_`, or `can_` (e.g., `is_active`, `has_permission`)
- **Timestamps:** `created_at`, `updated_at`, `deleted_at` (soft delete)

**Index Naming:**
- **Pattern:** `idx_{table}_{columns}` for single-column, `idx_{table}_{column1}_{column2}` for composite
- **Examples:** `idx_products_name`, `idx_interactions_product_customer`
- **Unique Indexes:** `uk_{table}_{columns}` (e.g., `uk_products_hs_code`)

**Constraint Naming:**
- **Foreign Keys:** `fk_{table}_{referenced_table}` (e.g., `fk_interactions_product`)
- **Check Constraints:** `ck_{table}_{column}` (e.g., `ck_products_status`)
- **Unique Constraints:** `uk_{table}_{columns}`

**API Naming Conventions:**

**GraphQL Naming:**
- **Types:** `PascalCase` (e.g., `Product`, `Customer`, `ProductCustomerInteraction`)
- **Fields:** `camelCase` (e.g., `productName`, `customerId`, `createdAt`)
- **Queries:** `camelCase`, verb-based (e.g., `getProduct`, `listProducts`, `searchCustomers`)
- **Mutations:** `camelCase`, verb-based (e.g., `createProduct`, `updateCustomer`, `deleteInteraction`)
- **Arguments:** `camelCase` (e.g., `productId`, `customerType`, `limit`, `offset`)

**Route Parameters:**
- **Pattern:** GraphQL uses arguments, not route parameters
- **For REST endpoints (if any):** Use `:id` format (e.g., `/api/products/:id`)

**Query Parameters:**
- **Pattern:** `camelCase` (e.g., `?limit=10&offset=0&sortBy=name`)

**Header Naming:**
- **Pattern:** `X-{Feature}-{Property}` for custom headers (e.g., `X-Request-ID`, `X-User-Role`)
- **Standard Headers:** Follow HTTP standard (e.g., `Authorization`, `Content-Type`)

**Code Naming Conventions:**

**TypeScript/JavaScript:**
- **Variables:** `camelCase` (e.g., `userId`, `productList`, `isLoading`)
- **Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRY_COUNT`, `DEFAULT_CACHE_TTL`)
- **Functions:** `camelCase`, verb-based (e.g., `getUserById`, `createProduct`, `validateInput`)
- **Classes:** `PascalCase` (e.g., `ProductService`, `PermissionGuard`, `ExcelImportService`)
- **Interfaces/Types:** `PascalCase`, often with `I` prefix for interfaces (e.g., `IProduct`, `ICustomer`, `ProductInput`)
- **Enums:** `PascalCase` for enum name, `UPPER_SNAKE_CASE` for values (e.g., `enum CustomerType { BUYER = 'buyer', SUPPLIER = 'supplier' }`)

**React Components:**
- **Component Names:** `PascalCase` (e.g., `ProductSelector`, `QuickRecordForm`, `OfflineSyncStatus`)
- **Component Files:** `PascalCase.tsx` (e.g., `ProductSelector.tsx`, `QuickRecordForm.tsx`)
- **Hook Names:** `camelCase`, prefix with `use` (e.g., `useProductSelector`, `useOfflineSync`, `usePermission`)
- **Hook Files:** `camelCase.ts` (e.g., `useProductSelector.ts`, `useOfflineSync.ts`)

**NestJS Services:**
- **Service Classes:** `PascalCase` with `Service` suffix (e.g., `ProductService`, `PermissionService`, `ExcelImportService`)
- **Service Files:** `{name}.service.ts` (e.g., `product.service.ts`, `permission.service.ts`)
- **DTOs:** `PascalCase` with `Dto` suffix (e.g., `CreateProductDto`, `UpdateCustomerDto`)
- **DTO Files:** `{name}.dto.ts` (e.g., `create-product.dto.ts`)

**GraphQL Resolvers:**
- **Resolver Classes:** `PascalCase` with `Resolver` suffix (e.g., `ProductResolver`, `CustomerResolver`)
- **Resolver Files:** `{name}.resolver.ts` (e.g., `product.resolver.ts`)

### Structure Patterns

**Project Organization:**

**Twenty CRM Base Structure:**
- Follow Twenty CRM's monorepo structure: `packages/twenty-server`, `packages/twenty-front`
- Custom code should be organized within Twenty CRM's module structure

**Custom Code Organization:**

**Backend (packages/twenty-server/src/):**
```
src/
  core/
    product/              # Product module
      product.service.ts
      product.resolver.ts
      product.entity.ts
      product.dto.ts
    customer/             # Customer module (extend existing)
    interaction/          # Product-Customer-Interaction module
      interaction.service.ts
      interaction.resolver.ts
      interaction.entity.ts
    permission/           # Unified permission service
      permission.service.ts
      permission.guard.ts
    excel-import/         # Excel import/export service
      excel-import.service.ts
      excel-import.processor.ts
    offline-sync/         # Offline sync service
      offline-sync.service.ts
      sync-queue.service.ts
```

**Frontend (packages/twenty-front/src/):**
```
src/
  modules/
    product/
      components/
        ProductSelector.tsx
        ProductSelector.test.tsx
      hooks/
        useProductSelector.ts
      types/
        product.types.ts
    quick-record/
      components/
        QuickRecordForm.tsx
        QuickRecordFloatingButton.tsx
      hooks/
        useQuickRecord.ts
    offline-sync/
      components/
        OfflineSyncStatus.tsx
      hooks/
        useOfflineSync.ts
  shared/
    components/           # Shared custom components
    hooks/                # Shared custom hooks
    utils/                # Shared utilities
    types/                # Shared TypeScript types
```

**Test Organization:**
- **Pattern:** Co-located tests with source files
- **Unit Tests:** `{filename}.test.ts` (standardized, not `*.spec.ts`) (e.g., `product.service.test.ts`)
- **Integration Tests:** `{filename}.integration.test.ts` (e.g., `product.resolver.integration.test.ts`)
- **E2E Tests:** `tests/e2e/{feature}.test.ts` (e.g., `tests/e2e/quick-record.test.ts`)
- **Test Utilities:** `tests/utils/` or `__tests__/utils/`
- **Rationale:** Jest default convention, consistent with Twenty CRM

**File Structure Patterns:**

**Component Files:**
```typescript
// ProductSelector.tsx
import { ... } from '...';

/**
 * ProductSelector component description
 * @param props - Component props
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({ ... }) => {
  // Component implementation
};

// Prefer named exports, avoid default exports for better tree-shaking and clarity
```

**Service Files:**
```typescript
// product.service.ts
import { Injectable } from '@nestjs/common';

/**
 * ProductService handles product-related business logic
 */
@Injectable()
export class ProductService {
  // Service implementation
}
```

**Configuration Files:**
- Environment: `.env`, `.env.local`, `.env.production`
- TypeScript: `tsconfig.json` (root and per-package)
- ESLint: `.eslintrc.js` or `.eslintrc.json`
- Prettier: `.prettierrc` or `.prettierrc.json`

**Static Assets:**
- Images: `packages/twenty-front/src/assets/images/`
- Icons: `packages/twenty-front/src/assets/icons/`
- Fonts: `packages/twenty-front/src/assets/fonts/`

### Format Patterns

**API Response Formats:**

**GraphQL Response:**
- **Pattern:** Direct GraphQL response (no wrapper)
- **Success Response:**
```json
{
  "data": {
    "product": {
      "id": "123",
      "name": "Product Name",
      "hsCode": "1234.56.78"
    }
  }
}
```
- **Error Response:**
```json
{
  "errors": [
    {
      "message": "User-friendly error message",
      "extensions": {
        "code": "PRODUCT_NOT_FOUND",
        "statusCode": 404
      }
    }
  ]
}
```

**Error Code Format:**
- **Pattern:** `UPPER_SNAKE_CASE`, descriptive
- **Examples:** `PRODUCT_NOT_FOUND`, `PERMISSION_DENIED`, `VALIDATION_ERROR`, `EXCEL_IMPORT_FAILED`
- **Error Code Enum:** Define in `packages/twenty-server/src/common/errors/error-codes.enum.ts` (verify actual location in POC)
- **Error Code Ranges:** Allocate 1000 codes per module (Product: 1000-1999, Customer: 2000-2999, etc.)
- **Error Messages:** Define mapping in `error-messages.ts` for user-friendly messages, support multi-language (Growth stage)

**Data Exchange Formats:**

**JSON Field Naming:**
- **Pattern:** `camelCase` for GraphQL (matches TypeScript conventions)
- **Database to API:** Convert `snake_case` (DB) → `camelCase` (API) in resolvers
- **API to Database:** Convert `camelCase` (API) → `snake_case` (DB) in services

**Date/Time Format:**
- **Pattern:** ISO 8601 strings in JSON (e.g., `"2025-12-23T10:30:00Z"`)
- **Database:** `TIMESTAMP WITH TIME ZONE` (PostgreSQL)
- **Display:** Format in frontend based on user locale

**Boolean Representations:**
- **Pattern:** `true`/`false` (not `1`/`0`)
- **Database:** `BOOLEAN` type
- **API:** JSON boolean values

**Null Handling:**
- **Pattern:** Use `null` for missing values, avoid `undefined` in JSON
- **Optional Fields:** Mark as nullable in GraphQL schema (`String` vs `String!`)

**Array vs Object:**
- **Single Item:** Return object (e.g., `{ product: {...} }`)
- **Multiple Items:** Return array (e.g., `{ products: [...] }`)
- **Consistent:** Always use same structure for same query type

### Communication Patterns

**Event System Patterns:**

**Event Naming:**
- **Pattern:** `{entity}.{action}` (e.g., `product.created`, `customer.updated`, `interaction.deleted`)
- **Custom Events:** `{module}.{action}` (e.g., `excel.import.started`, `offline.sync.completed`)

**Event Payload Structure:**
```typescript
interface EventPayload {
  event: string;           // Event name
  timestamp: string;       // ISO 8601
  userId: string;          // User who triggered event
  data: Record<string, any>; // Event-specific data
  metadata?: Record<string, any>; // Optional metadata
}
```

**State Management Patterns:**

**React Query (Server State):**
- **Query Keys:** Array format, hierarchical (e.g., `['products', productId]`, `['customers', { type: 'buyer' }]`)
- **Mutation Keys:** Consistent with query keys for invalidation
- **State Updates:** Immutable updates, use React Query's `setQueryData` for optimistic updates

**Local State (UI State):**
- **Pattern:** React `useState` for component-local state
- **Form State:** React Hook Form for form state management
- **Global UI State:** Context API or Zustand (if needed)

**Action Naming:**
- **Pattern:** `camelCase`, verb-based (e.g., `fetchProducts`, `createInteraction`, `updateCustomer`)

### Process Patterns

**Error Handling Patterns:**

**Error Code Specification:**
```typescript
// src/shared/errors/error-codes.enum.ts
export enum ErrorCode {
  // Product errors (1000-1999)
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_ALREADY_EXISTS = 'PRODUCT_ALREADY_EXISTS',
  
  // Customer errors (2000-2999)
  CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Interaction errors (3000-3999)
  INTERACTION_VALIDATION_ERROR = 'INTERACTION_VALIDATION_ERROR',
  
  // Excel import errors (4000-4999)
  EXCEL_IMPORT_FAILED = 'EXCEL_IMPORT_FAILED',
  EXCEL_VALIDATION_ERROR = 'EXCEL_VALIDATION_ERROR',
  
  // System errors (9000-9999)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}
```

**Error Response Structure:**
```typescript
interface ErrorResponse {
  message: string;        // User-friendly message
  code: ErrorCode;        // Error code enum
  statusCode: number;     // HTTP status code
  details?: Record<string, any>; // Additional error details
  timestamp: string;      // ISO 8601
}
```

**Error Handling Layers:**
- **User Layer:** React Error Boundary, friendly messages, recovery suggestions
- **Business Layer:** Custom exceptions with error codes, user-friendly messages
- **System Layer:** Global exception filter, structured logging, error tracking

**Loading State Patterns:**

**Loading State Naming:**
- **Pattern:** `is{Action}Loading` or `{entity}Loading` (e.g., `isLoading`, `isCreatingProduct`, `productsLoading`)
- **Consistent:** Use same naming pattern across all components

**Loading State Management:**
- **Server State:** React Query handles loading states automatically (`isLoading`, `isFetching`)
- **Local State:** `useState<boolean>` for component-specific loading
- **Global Loading:** Context or Zustand for app-wide loading indicators

**Loading UI Patterns:**
- **Skeleton Screens:** Preferred for content areas
- **Spinners:** For buttons and small actions
- **Progress Bars:** For long-running operations (Excel import, sync)

**Retry Implementation:**
- **Pattern:** Exponential backoff with max retries
- **Configuration:** `maxRetries: 3`, `retryDelay: 1000ms` (base), exponential multiplier: 2
- **Network Errors:** Automatic retry
- **Business Errors:** No retry (user action required)

**Validation Patterns:**

**Validation Timing:**
- **Client-side:** Real-time validation on input change (React Hook Form)
- **Server-side:** Validation on submit/mutation (NestJS DTOs)
- **Database:** Constraints as last line of defense

**Validation Error Format:**
```typescript
interface ValidationError {
  field: string;          // Field name (camelCase)
  message: string;        // User-friendly error message
  code: string;          // Validation error code (e.g., 'REQUIRED', 'INVALID_FORMAT')
}
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. **Follow Naming Conventions:**
   - Use `snake_case` for database tables/columns
   - Use `camelCase` for TypeScript/JavaScript code
   - Use `PascalCase` for React components and TypeScript classes
   - Use `UPPER_SNAKE_CASE` for constants and enum values

2. **Maintain Structure Consistency:**
   - Co-locate tests with source files (`*.test.ts`)
   - Organize code by feature/module, not by type
   - Place shared utilities in `shared/` directory
   - Follow Twenty CRM's module structure for custom code

3. **Use Consistent Formats:**
   - GraphQL responses: Direct response, no wrapper
   - Error responses: Use ErrorCode enum, consistent structure
   - Date/time: ISO 8601 strings
   - JSON fields: `camelCase` in API, `snake_case` in database

4. **Follow Process Patterns:**
   - Error handling: Use ErrorCode enum, layered approach
   - Loading states: Consistent naming (`isLoading`, `isCreating`)
   - Validation: Client + Server + Database layers
   - Retry: Exponential backoff with max retries

5. **Document Code:**
   - JSDoc comments for all public functions/classes
   - Type definitions for all interfaces/types
   - Inline comments for complex logic
   - README files for major modules

**Pattern Enforcement:**

**Verification Methods:**
- **Linting:** ESLint rules for naming conventions, export patterns, custom rules for project-specific patterns
- **Type Checking:** TypeScript strict mode for type safety, no `any` types
- **CI/CD:** Automated pattern validation in pipeline
- **Pre-commit Hooks:** Pattern validation before commit
- **Code Review:** Manual review for pattern compliance
- **Automated Tests:** Tests verify expected patterns

**Automated Validation Setup:**
- ESLint custom rules for naming conventions
- TypeScript compiler checks for type safety
- Pre-commit hooks for pattern validation
- CI/CD pipeline checks for pattern compliance

**Pattern Violation Process:**
- Document violations in code review comments
- Update patterns if violation reveals better approach
- Refactor violations to match patterns
- Update pattern documentation if needed

**Pattern Updates:**
- Patterns can be updated based on team consensus
- Document pattern changes with rationale
- Communicate changes to all team members
- Update examples and documentation

### Pattern Examples

**Good Examples:**

**Database Table:**
```sql
CREATE TABLE product_customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  interaction_type VARCHAR(50) NOT NULL,
  interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_interactions_product_customer ON product_customer_interactions(product_id, customer_id);
```

**GraphQL Resolver:**
```typescript
@Resolver(() => Product)
export class ProductResolver {
  constructor(
    private readonly productService: ProductService,
    private readonly permissionService: PermissionService
  ) {}

  @Query(() => [Product])
  async products(
    @Args() args: GetProductsArgs,
    @CurrentUser() user: User
  ): Promise<Product[]> {
    // Permission filtering using unified service
    const filteredProducts = await this.productService.findAll(
      args,
      user,
      this.permissionService
    );
    return filteredProducts;
  }
}
```

**React Component:**
```typescript
// ProductSelector.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface ProductSelectorProps {
  onSelect: (productId: string) => void;
  selectedProductId?: string;
}

/**
 * ProductSelector component for selecting products
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({
  onSelect,
  selectedProductId
}) => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts()
  });

  if (isLoading) return <div>Loading products...</div>;

  return (
    <select
      value={selectedProductId}
      onChange={(e) => onSelect(e.target.value)}
    >
      {products?.map((product) => (
        <option key={product.id} value={product.id}>
          {product.name}
        </option>
      ))}
    </select>
  );
};
```

**Service with Error Handling:**
```typescript
@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: Repository<Product>
  ) {}

  async findById(id: string, user: User): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    
    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        code: ErrorCode.PRODUCT_NOT_FOUND,
        statusCode: 404
      });
    }

    // Permission check using unified service
    if (!this.permissionService.canAccessProduct(user, product)) {
      throw new ForbiddenException({
        message: 'Permission denied',
        code: ErrorCode.PERMISSION_DENIED,
        statusCode: 403
      });
    }

    return product;
  }
}
```

**Anti-Patterns:**

**❌ Bad: Inconsistent Naming**
```typescript
// DON'T: Mixing naming conventions
const user_id = '123';  // snake_case
const productName = 'Product';  // camelCase
const CustomerType = 'buyer';  // PascalCase for variable
```

**✅ Good: Consistent Naming**
```typescript
// DO: Consistent camelCase for variables
const userId = '123';
const productName = 'Product';
const customerType = 'buyer';
```

**❌ Bad: Inconsistent Error Handling**
```typescript
// DON'T: Different error formats
throw new Error('Product not found');
throw { message: 'Permission denied', code: 403 };
throw 'Invalid input';
```

**✅ Good: Consistent Error Handling**
```typescript
// DO: Use ErrorCode enum and consistent structure
throw new NotFoundException({
  message: 'Product not found',
  code: ErrorCode.PRODUCT_NOT_FOUND,
  statusCode: 404
});
```

**❌ Bad: Inconsistent File Organization**
```typescript
// DON'T: Mixing organization styles
src/components/ProductSelector.tsx
src/services/productService.ts
src/utils/helpers.ts
```

**✅ Good: Consistent Module Organization**
```typescript
// DO: Organize by feature/module
src/core/product/product.service.ts
src/core/product/product.resolver.ts
src/core/product/components/ProductSelector.tsx
```

**❌ Bad: Inconsistent API Response**
```typescript
// DON'T: Different response structures
return { data: product };
return product;
return { product: product, success: true };
```

**✅ Good: Consistent GraphQL Response**
```typescript
// DO: Direct GraphQL response
return product;  // GraphQL handles wrapping
```

### Party Mode Discussion Insights

**Discussion Topic:** Reviewing implementation patterns and consistency rules - evaluating completeness and enforceability from multiple perspectives

**Participants:**
- **Winston (Architect)** - Technical architecture and consistency perspective
- **Amelia (Dev)** - Development implementation and code quality perspective
- **Mary (Analyst)** - Business analysis and requirements validation perspective
- **John (PM)** - Product management and team collaboration perspective

**Key Discussion Points:**

**Winston's Architectural Review:**
- **Overall Assessment:** Patterns are sound, but need clarification on some points
- **Critical Concerns:**
  1. **Project Organization:** Custom code in `src/core/` may conflict with Twenty CRM's existing structure - need to verify actual Twenty CRM structure first
  2. **Error Code Ranges:** ErrorCode enum needs clear range allocation - suggest allocating ranges per module (e.g., Product 1000-1999) for extensibility
  3. **Database to API Conversion:** `snake_case` → `camelCase` conversion location unclear - suggest using TypeORM `@Column({ name: 'snake_case' })` and GraphQL field mapping, or DTO conversion
- **Recommendations:**
  - Verify Twenty CRM's actual directory structure in POC phase
  - Define error code range allocation rules
  - Clarify database-to-API conversion approach

**Amelia's Development Review:**
- **Implementation Clarity:** Need technical details for implementation
- **Critical Details Needed:**
  1. **Test File Naming:** Document says `*.test.ts` or `*.spec.ts` - need to standardize. Suggest: Use `*.test.ts` consistently (Jest default)
  2. **Error Handling:** ErrorCode enum location `src/shared/errors/` may not exist in Twenty CRM - suggest: `packages/twenty-server/src/common/errors/` or custom directory
  3. **Component Exports:** Examples show both `export const` and `export default` - need to standardize. Suggest: Prefer named exports, avoid default exports
- **Recommendations:**
  - Standardize test file naming to `*.test.ts`
  - Verify error code enum location with Twenty CRM structure
  - Standardize component export pattern (prefer named exports)

**Mary's Business Analysis Review:**
- **Business Requirements Validation:** Need to verify patterns support business needs
- **Critical Validations:**
  1. **Data Model Naming:** `product_customer_interactions` table name is long - need to verify: Does table name length affect query performance?
  2. **Error Messages:** ErrorCode enum is good, but need to ensure all error messages are user-friendly - suggest: Define error message mapping table, support multi-language
  3. **Event Naming:** `{entity}.{action}` pattern - need to verify: Does it cover all business scenarios? (e.g., `product.quoted`, `customer.contacted`)
- **Recommendations:**
  - Verify table name length impact on performance
  - Define error message mapping for user-friendly messages
  - Validate event naming covers all business scenarios

**John's Product Management Review:**
- **Team Collaboration:** Need to ensure patterns support team collaboration
- **Critical Questions:**
  1. **Pattern Enforceability:** Are patterns specific enough for different AI agents to follow? Need more concrete examples, especially edge cases
  2. **Pattern Validation:** How to verify patterns are followed? Need automated checks (ESLint rules, TypeScript type checks, CI/CD checks)
  3. **Pattern Updates:** How to update patterns if better approaches found? Need pattern update process to keep team in sync
- **Recommendations:**
  - Add more concrete examples, especially edge cases
  - Define automated validation methods
  - Establish pattern update process

**Cross-Agent Discussion:**

**Winston → Amelia:**
- Project organization concern valid - suggest: Verify directory structure in POC phase to ensure custom code doesn't conflict with Twenty CRM

**Amelia → Mary:**
- Table name length has minimal performance impact in PostgreSQL, but if too long, consider abbreviations (e.g., `prod_cust_interactions`) with documentation

**Mary → John:**
- Pattern enforceability needs more examples - suggest: Include "common mistakes" examples to help AI agents avoid common pitfalls

**John → Winston:**
- Error code range allocation is good - suggest: Reserve sufficient error code space per module to avoid future conflicts

**Consensus & Recommendations:**

**Unanimous Agreement:**
- Pattern definitions are sound, but need enhancements and clarifications

**Key Enhancements Needed:**
1. **Technical Details:**
   - Verify Twenty CRM's actual directory structure
   - Define error code range allocation rules
   - Standardize test file naming
   - Clarify component export pattern

2. **Enforceability:**
   - Add more concrete examples
   - Define automated validation methods
   - Add common mistakes examples

3. **Business Support:**
   - Verify table name length impact
   - Define error message mapping
   - Validate event naming coverage

**Enhancement Actions:**
- [ ] Add Twenty CRM structure verification step
- [ ] Define error code range allocation rules
- [ ] Standardize test file naming convention
- [ ] Add automated validation methods
- [ ] Add edge case examples
- [ ] Define error message mapping structure
- [ ] Validate event naming covers all business scenarios

**Enhanced Pattern Specifications:**

**Error Code Range Allocation:**
```typescript
// Error code ranges per module (1000 codes per module)
export enum ErrorCodeRange {
  PRODUCT = 1000,        // 1000-1999
  CUSTOMER = 2000,       // 2000-2999
  INTERACTION = 3000,    // 3000-3999
  EXCEL_IMPORT = 4000,   // 4000-4999
  OFFLINE_SYNC = 5000,   // 5000-5999
  PERMISSION = 6000,      // 6000-6999
  VALIDATION = 7000,      // 7000-7999
  SYSTEM = 9000          // 9000-9999
}
```

**Test File Naming Standard:**
- **Standard:** Always use `*.test.ts` (not `*.spec.ts`)
- **Rationale:** Jest default, consistent with Twenty CRM conventions
- **Examples:** `product.service.test.ts`, `ProductSelector.test.tsx`

**Component Export Pattern:**
- **Standard:** Prefer named exports, avoid default exports
- **Rationale:** Better tree-shaking, clearer imports, easier refactoring
- **Example:**
```typescript
// ✅ Good: Named export
export const ProductSelector: React.FC<Props> = ({ ... }) => { ... };

// ❌ Bad: Default export
export default ProductSelector;
```

**Error Message Mapping:**
```typescript
// src/common/errors/error-messages.ts
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.PRODUCT_NOT_FOUND]: 'Product not found',
  [ErrorCode.PERMISSION_DENIED]: 'You do not have permission to access this resource',
  // ... more mappings
};

// Support for multi-language (Growth stage)
export const getErrorMessage = (code: ErrorCode, locale: string = 'en'): string => {
  // Return localized error message
};
```

**Twenty CRM Structure Verification:**
- **Step 1:** In POC phase, examine Twenty CRM's actual directory structure
- **Step 2:** Identify where custom code should be placed
- **Step 3:** Update project organization patterns based on actual structure
- **Step 4:** Document custom code location clearly

**Automated Pattern Validation:**
- **ESLint Rules:** Custom rules for naming conventions, export patterns
- **TypeScript:** Strict type checking, no `any` types
- **CI/CD:** Automated checks in pipeline
- **Pre-commit Hooks:** Pattern validation before commit

**Common Mistakes Examples:**
- Mixing naming conventions in same file
- Using default exports for components
- Inconsistent error handling patterns
- Missing error code in error responses
- Inconsistent loading state naming

## Project Structure & Boundaries

### Complete Project Directory Structure

**Base Structure (Twenty CRM Monorepo):**

```
fenghua-crm/                          # Project root (customization of Twenty CRM)
├── packages/
│   ├── twenty-server/                # Backend (Twenty CRM base)
│   │   ├── src/
│   │   │   ├── core/                 # Twenty CRM core modules
│   │   │   │   ├── custom-object/    # Custom objects system (extend)
│   │   │   │   ├── graphql/          # GraphQL resolvers (extend)
│   │   │   │   ├── customer/         # Customer module (extend)
│   │   │   │   └── ...               # Other Twenty CRM modules
│   │   │   │
│   │   │   ├── custom/               # Custom modules (NEW)
│   │   │   │   ├── product/          # Product module
│   │   │   │   │   ├── product.service.ts
│   │   │   │   │   ├── product.resolver.ts
│   │   │   │   │   ├── product.entity.ts
│   │   │   │   │   ├── product.dto.ts
│   │   │   │   │   ├── product.module.ts
│   │   │   │   │   └── product.service.test.ts
│   │   │   │   │
│   │   │   │   ├── interaction/     # Product-Customer-Interaction module
│   │   │   │   │   ├── interaction.service.ts
│   │   │   │   │   ├── interaction.resolver.ts
│   │   │   │   │   ├── interaction.entity.ts
│   │   │   │   │   ├── interaction.dto.ts
│   │   │   │   │   ├── interaction.module.ts
│   │   │   │   │   └── interaction.service.test.ts
│   │   │   │   │
│   │   │   │   ├── permission/       # Unified permission service
│   │   │   │   │   ├── permission.service.ts
│   │   │   │   │   ├── permission.guard.ts
│   │   │   │   │   ├── permission.decorator.ts
│   │   │   │   │   ├── permission.module.ts
│   │   │   │   │   └── permission.service.test.ts
│   │   │   │   │
│   │   │   │   ├── excel-import/     # Excel import/export service
│   │   │   │   │   ├── excel-import.service.ts
│   │   │   │   │   ├── excel-import.processor.ts
│   │   │   │   │   ├── excel-import.dto.ts
│   │   │   │   │   ├── excel-import.module.ts
│   │   │   │   │   └── excel-import.service.test.ts
│   │   │   │   │
│   │   │   │   └── offline-sync/     # Offline sync service
│   │   │   │       ├── offline-sync.service.ts
│   │   │   │       ├── sync-queue.service.ts
│   │   │   │       ├── conflict-resolver.service.ts
│   │   │   │       ├── offline-sync.module.ts
│   │   │   │       └── offline-sync.service.test.ts
│   │   │   │
│   │   │   ├── common/               # Shared utilities (NEW)
│   │   │   │   ├── errors/
│   │   │   │   │   ├── error-codes.enum.ts
│   │   │   │   │   ├── error-messages.ts
│   │   │   │   │   └── custom-exceptions.ts
│   │   │   │   ├── utils/
│   │   │   │   │   ├── validation.utils.ts
│   │   │   │   │   └── format.utils.ts
│   │   │   │   └── types/
│   │   │   │       └── common.types.ts
│   │   │   │
│   │   │   └── main.ts               # Application entry point
│   │   │
│   │   ├── test/                     # Backend tests
│   │   │   ├── unit/
│   │   │   ├── integration/
│   │   │   └── e2e/
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   │
│   ├── twenty-front/                 # Frontend (Twenty CRM base)
│   │   ├── src/
│   │   │   ├── modules/              # Twenty CRM modules (extend)
│   │   │   │   ├── customer/         # Customer module (extend)
│   │   │   │   └── ...               # Other Twenty CRM modules
│   │   │   │
│   │   │   ├── custom/               # Custom modules (NEW)
│   │   │   │   ├── product/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ProductSelector.tsx
│   │   │   │   │   │   ├── ProductSelector.test.tsx
│   │   │   │   │   │   ├── ProductList.tsx
│   │   │   │   │   │   └── ProductList.test.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useProductSelector.ts
│   │   │   │   │   │   └── useProductSelector.test.ts
│   │   │   │   │   ├── types/
│   │   │   │   │   │   └── product.types.ts
│   │   │   │   │   └── utils/
│   │   │   │   │       └── product.utils.ts
│   │   │   │   │
│   │   │   │   ├── quick-record/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── QuickRecordForm.tsx
│   │   │   │   │   │   ├── QuickRecordForm.test.tsx
│   │   │   │   │   │   ├── QuickRecordFloatingButton.tsx
│   │   │   │   │   │   └── QuickRecordFloatingButton.test.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   ├── useQuickRecord.ts
│   │   │   │   │   │   └── useQuickRecord.test.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── quick-record.types.ts
│   │   │   │   │
│   │   │   │   ├── interaction/
│   │   │   │   │   ├── components/
│   │   │   │   │   │   ├── ProductCustomerInteractionView.tsx
│   │   │   │   │   │   ├── InteractionTimeline.tsx
│   │   │   │   │   │   └── InteractionTimeline.test.tsx
│   │   │   │   │   ├── hooks/
│   │   │   │   │   │   └── useInteraction.ts
│   │   │   │   │   └── types/
│   │   │   │   │       └── interaction.types.ts
│   │   │   │   │
│   │   │   │   └── offline-sync/
│   │   │   │       ├── components/
│   │   │   │       │   ├── OfflineSyncStatus.tsx
│   │   │   │       │   └── OfflineSyncStatus.test.tsx
│   │   │   │       ├── hooks/
│   │   │   │       │   ├── useOfflineSync.ts
│   │   │   │       │   └── useOfflineSync.test.ts
│   │   │   │       └── utils/
│   │   │   │           └── indexeddb.utils.ts
│   │   │   │
│   │   │   ├── shared/               # Shared custom components (NEW)
│   │   │   │   ├── components/
│   │   │   │   │   └── ...           # Shared UI components
│   │   │   │   ├── hooks/
│   │   │   │   │   └── ...           # Shared hooks
│   │   │   │   ├── utils/
│   │   │   │   │   └── ...           # Shared utilities
│   │   │   │   └── types/
│   │   │   │       └── ...           # Shared types
│   │   │   │
│   │   │   └── ...                   # Twenty CRM frontend structure
│   │   │
│   │   ├── tests/                    # Frontend tests
│   │   │   ├── e2e/
│   │   │   │   ├── quick-record.test.ts
│   │   │   │   ├── product-selector.test.ts
│   │   │   │   └── offline-sync.test.ts
│   │   │   └── utils/
│   │   │       └── test-utils.ts
│   │   │
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── twenty-docker/                # Docker configuration (Twenty CRM)
│       ├── docker-compose.yml
│       └── Dockerfile
│
├── .github/                          # CI/CD (if added)
│   └── workflows/
│       └── ci.yml
│
├── .env.example                      # Environment variables template
├── .gitignore
├── package.json                      # Root package.json (monorepo)
├── nx.json                           # Nx workspace configuration
├── tsconfig.base.json                # Base TypeScript config
└── README.md
```

**Note:** This structure extends Twenty CRM's existing monorepo. Custom code is organized in `custom/` directories to maintain clear separation from Twenty CRM core code.

### Architectural Boundaries

**API Boundaries:**

**GraphQL API Endpoints:**
- **Base Endpoint:** `/graphql` (Twenty CRM standard)
- **Custom Queries:**
  - `products` - List products with filtering
  - `product(id)` - Get single product
  - `productCustomerInteractions` - Get interactions with product/customer filters
  - `searchProducts` - Fuzzy search products
  - `searchCustomers` - Fuzzy search customers (role-filtered)
- **Custom Mutations:**
  - `createProduct` - Create new product
  - `updateProduct` - Update product
  - `createInteraction` - Create product-customer interaction
  - `updateInteraction` - Update interaction
  - `importExcel` - Trigger Excel import
  - `exportData` - Export data (role-restricted)

**Internal Service Boundaries:**
- **Product Service:** `packages/twenty-server/src/custom/product/product.service.ts`
- **Interaction Service:** `packages/twenty-server/src/custom/interaction/interaction.service.ts`
- **Permission Service:** `packages/twenty-server/src/custom/permission/permission.service.ts`
- **Excel Import Service:** `packages/twenty-server/src/custom/excel-import/excel-import.service.ts`
- **Offline Sync Service:** `packages/twenty-server/src/custom/offline-sync/offline-sync.service.ts`

**Authentication and Authorization Boundaries:**
- **Authentication:** JWT validation (Twenty CRM standard) - `packages/twenty-server/src/core/auth/`
- **Authorization:** Permission guards - `packages/twenty-server/src/custom/permission/permission.guard.ts`
- **Data Isolation:** Resolver filtering + RLS policies

**Data Access Layer Boundaries:**
- **Repository Pattern:** TypeORM repositories (Twenty CRM standard)
- **Custom Repositories:** Extend Twenty CRM repositories for custom objects
- **Database Access:** All database access through repositories, no direct queries

**Component Boundaries:**

**Frontend Component Communication:**
- **Props-based:** Parent-child communication via props
- **Context API:** Shared state (if needed) via React Context
- **React Query:** Server state management, automatic caching
- **Event System:** Custom events for cross-component communication (if needed)

**State Management Boundaries:**
- **Server State:** React Query (`@tanstack/react-query`)
- **Local State:** React `useState` for component-local state
- **Form State:** React Hook Form for form state
- **Global UI State:** Context API or Zustand (if needed)

**Service Communication Patterns:**
- **GraphQL:** All server communication via GraphQL API
- **REST (External):** AI analysis service (Growth stage) - external microservice
- **WebSocket:** Real-time updates (Growth stage) - GraphQL Subscriptions

**Event-Driven Integration Points:**
- **Internal Events:** Custom event system for module communication
- **External Events:** Webhook support for third-party integrations (Growth stage)

**Data Boundaries:**

**Database Schema Boundaries:**
- **Twenty CRM Tables:** `companies`, `people`, `workspaces`, etc. (existing)
- **Custom Tables:**
  - `products` - Product information
  - `product_customer_interactions` - Product-customer interaction records
  - `excel_imports` - Excel import job tracking
  - `offline_sync_queue` - Offline sync queue
- **Schema Management:** TypeORM migrations in `packages/twenty-server/src/migrations/`

**Data Access Patterns:**
- **Read Operations:** GraphQL queries → Resolvers → Services → Repositories → Database
- **Write Operations:** GraphQL mutations → Resolvers → Services → Repositories → Database (with transactions)
- **Permission Filtering:** Applied at Resolver and RLS levels

**Caching Boundaries:**
- **Client-side Cache:** React Query cache (in-memory, per-session)
- **Server-side Cache:** Redis cache (shared across requests)
- **Cache Invalidation:** Tag-based invalidation, manual invalidation on mutations

**External Data Integration Points:**
- **AI Analysis Service:** REST API (Growth stage) - `packages/twenty-server/src/custom/ai-analysis/`
- **Email Integration:** Twenty CRM email integration (if available)
- **Excel Import:** File upload → Bull Queue → Processing → Database

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

**Product Management (FR1-FR8):**
- **Backend:**
  - Service: `packages/twenty-server/src/custom/product/product.service.ts`
  - Resolver: `packages/twenty-server/src/custom/product/product.resolver.ts`
  - Entity: `packages/twenty-server/src/custom/product/product.entity.ts`
  - DTOs: `packages/twenty-server/src/custom/product/product.dto.ts`
- **Frontend:**
  - Components: `packages/twenty-front/src/custom/product/components/`
  - Hooks: `packages/twenty-front/src/custom/product/hooks/`
- **Database:**
  - Table: `products`
  - Migrations: `packages/twenty-server/src/migrations/*products*`

**Customer Management (FR9-FR16):**
- **Backend:**
  - Service: Extend `packages/twenty-server/src/core/customer/` (Twenty CRM existing)
  - Resolver: Extend `packages/twenty-server/src/core/customer/` (Twenty CRM existing)
- **Frontend:**
  - Components: Extend `packages/twenty-front/src/modules/customer/` (Twenty CRM existing)
- **Database:**
  - Table: `companies` (Twenty CRM existing, extend with custom fields)

**Interaction Recording (FR17-FR22):**
- **Backend:**
  - Service: `packages/twenty-server/src/custom/interaction/interaction.service.ts`
  - Resolver: `packages/twenty-server/src/custom/interaction/interaction.resolver.ts`
  - Entity: `packages/twenty-server/src/custom/interaction/interaction.entity.ts`
- **Frontend:**
  - Components: `packages/twenty-front/src/custom/interaction/components/`
- **Database:**
  - Table: `product_customer_interactions`
  - Migrations: `packages/twenty-server/src/migrations/*interactions*`

**Quick Record (FR23-FR27):**
- **Frontend:**
  - Components: `packages/twenty-front/src/custom/quick-record/components/QuickRecordForm.tsx`
  - Hooks: `packages/twenty-front/src/custom/quick-record/hooks/useQuickRecord.ts`
- **Backend:**
  - Uses: `interaction.service.ts` for data persistence

**Data Import/Export (FR38-FR46):**
- **Backend:**
  - Service: `packages/twenty-server/src/custom/excel-import/excel-import.service.ts`
  - Processor: `packages/twenty-server/src/custom/excel-import/excel-import.processor.ts`
  - Queue: Bull Queue integration
- **Frontend:**
  - Components: Extend Twenty CRM import/export UI or create custom

**Offline Capability (FR39-FR40):**
- **Backend:**
  - Service: `packages/twenty-server/src/custom/offline-sync/offline-sync.service.ts`
  - Queue: `packages/twenty-server/src/custom/offline-sync/sync-queue.service.ts`
- **Frontend:**
  - Components: `packages/twenty-front/src/custom/offline-sync/components/OfflineSyncStatus.tsx`
  - Hooks: `packages/twenty-front/src/custom/offline-sync/hooks/useOfflineSync.ts`
  - Storage: IndexedDB utilities

**Permission & Access Control (FR47-FR56):**
- **Backend:**
  - Service: `packages/twenty-server/src/custom/permission/permission.service.ts`
  - Guard: `packages/twenty-server/src/custom/permission/permission.guard.ts`
  - RLS Policies: Database-level policies
- **Frontend:**
  - Hooks: Permission checking hooks (if needed)

**Cross-Cutting Concerns:**

**Authentication System:**
- **Location:** `packages/twenty-server/src/core/auth/` (Twenty CRM existing)
- **Customization:** Extend for role-based authentication if needed

**Error Handling:**
- **Location:** `packages/twenty-server/src/common/errors/`
- **Files:**
  - `error-codes.enum.ts` - Error code definitions
  - `error-messages.ts` - Error message mappings
  - `custom-exceptions.ts` - Custom exception classes

**Logging:**
- **Location:** `packages/twenty-server/src/core/logging/` (Twenty CRM existing)
- **Customization:** Extend for business metrics logging

**Validation:**
- **Client-side:** React Hook Form validation in components
- **Server-side:** DTOs with class-validator in `packages/twenty-server/src/custom/*/dto.ts`
- **Database:** Constraints in entity definitions

### Integration Points

**Internal Communication:**

**Frontend to Backend:**
- **Pattern:** GraphQL queries and mutations
- **Client:** Apollo Client or React Query with GraphQL
- **Location:** `packages/twenty-front/src/graphql/` (if custom queries needed)

**Backend Service to Service:**
- **Pattern:** Dependency injection (NestJS)
- **Communication:** Direct service injection, no HTTP calls between services
- **Example:** `ProductService` injects `PermissionService` for permission checks

**Backend to Database:**
- **Pattern:** TypeORM repositories
- **Communication:** Repository pattern, transactions for data consistency
- **Location:** Entity repositories in `packages/twenty-server/src/custom/*/entity.ts`

**External Integrations:**

**AI Analysis Service (Growth Stage):**
- **Type:** REST API (external microservice)
- **Location:** `packages/twenty-server/src/custom/ai-analysis/ai-analysis.service.ts`
- **Communication:** HTTP client (Axios/Fetch)
- **Configuration:** Environment variables for API keys and endpoints

**Email Integration:**
- **Type:** Twenty CRM email integration (if available) or custom IMAP/POP3
- **Location:** Extend `packages/twenty-server/src/core/email/` or create custom

**Excel Import/Export:**
- **Type:** File processing (Bull Queue)
- **Location:** `packages/twenty-server/src/custom/excel-import/`
- **Communication:** File upload → Queue → Background processing

**Data Flow:**

**Product Association Flow:**
1. User selects product in `ProductSelector` component
2. Component calls GraphQL query `products`
3. GraphQL Resolver (`product.resolver.ts`) applies permission filtering
4. Resolver calls `ProductService` to fetch data
5. Service uses Repository to query database
6. RLS policies apply additional filtering
7. Data returned to frontend, cached in React Query

**Quick Record Flow:**
1. User fills `QuickRecordForm` component
2. Form validation (React Hook Form)
3. On submit, GraphQL mutation `createInteraction`
4. Resolver validates and applies permission check
5. Service creates interaction record with product association
6. Database transaction ensures data consistency
7. Success response triggers cache invalidation
8. UI updates with new interaction

**Offline Sync Flow:**
1. User creates record offline in `QuickRecordForm`
2. Record saved to IndexedDB via `useOfflineSync` hook
3. Record added to local sync queue
4. When online, sync service processes queue
5. Records sent to server via GraphQL mutations
6. Server validates and saves to database
7. Conflict resolution (last-write-wins MVP)
8. UI updates with sync status

### File Organization Patterns

**Configuration Files:**

**Root Level:**
- `package.json` - Monorepo package management
- `nx.json` - Nx workspace configuration
- `tsconfig.base.json` - Base TypeScript configuration
- `.env.example` - Environment variables template
- `.gitignore` - Git ignore rules

**Package Level:**
- `packages/twenty-server/package.json` - Backend dependencies
- `packages/twenty-server/tsconfig.json` - Backend TypeScript config
- `packages/twenty-server/nest-cli.json` - NestJS CLI configuration
- `packages/twenty-front/package.json` - Frontend dependencies
- `packages/twenty-front/tsconfig.json` - Frontend TypeScript config
- `packages/twenty-front/vite.config.ts` - Vite build configuration

**Environment Files:**
- `.env` - Local development (gitignored)
- `.env.local` - Local overrides (gitignored)
- `.env.production` - Production configuration (gitignored)
- `.env.example` - Template with all required variables

**Source Organization:**

**Backend Module Structure:**
```
custom/{module}/
  ├── {module}.service.ts          # Business logic
  ├── {module}.resolver.ts         # GraphQL resolver
  ├── {module}.entity.ts           # TypeORM entity
  ├── {module}.dto.ts              # Data transfer objects
  ├── {module}.module.ts           # NestJS module
  └── {module}.service.test.ts     # Unit tests
```

**Frontend Module Structure:**
```
custom/{module}/
  ├── components/
  │   ├── {Component}.tsx
  │   └── {Component}.test.tsx
  ├── hooks/
  │   ├── use{Feature}.ts
  │   └── use{Feature}.test.ts
  ├── types/
  │   └── {module}.types.ts
  └── utils/
      └── {module}.utils.ts
```

**Test Organization:**

**Unit Tests:**
- **Location:** Co-located with source files (`*.test.ts`)
- **Pattern:** `{filename}.test.ts` (e.g., `product.service.test.ts`)

**Integration Tests:**
- **Location:** Co-located with source files (`*.integration.test.ts`)
- **Pattern:** `{filename}.integration.test.ts` (e.g., `product.resolver.integration.test.ts`)

**E2E Tests:**
- **Location:** `packages/twenty-front/tests/e2e/`
- **Pattern:** `{feature}.test.ts` (e.g., `quick-record.test.ts`)

**Test Utilities:**
- **Location:** `packages/twenty-front/tests/utils/` or `__tests__/utils/`
- **Files:** `test-utils.ts`, `mock-data.ts`, `test-helpers.ts`

**Asset Organization:**

**Static Assets:**
- **Images:** `packages/twenty-front/src/assets/images/`
- **Icons:** `packages/twenty-front/src/assets/icons/`
- **Fonts:** `packages/twenty-front/src/assets/fonts/`

**Public Assets:**
- **Location:** `packages/twenty-front/public/` (if needed)
- **Files:** Favicon, robots.txt, etc.

### Party Mode Discussion Insights

**Discussion Topic:** Reviewing project structure and boundaries - evaluating structure rationality from multiple development perspectives.

**Participants:** Winston (Architect), Amelia (Dev), John (PM), Mary (Analyst)

**Key Discussion Points:**

**Winston (Architect) - Technical Architecture & Boundary Design:**
1. **Custom Code Location Verification:**
   - Need to verify Twenty CRM's actual directory structure in POC phase
   - Current assumption: `src/custom/` may need adjustment
   - Alternative options: `src/modules/custom/` or `src/extensions/`
   - Recommendation: Validate in POC, prepare fallback options

2. **Module Dependency Direction:**
   - Interaction module depends on Product module (unidirectional)
   - Product module should NOT depend on Interaction module
   - Need clear dependency rules to prevent circular dependencies
   - Recommendation: Document dependency graph, enforce in code review

3. **Shared Code Location:**
   - `common/` directory location needs clarification
   - Options: `packages/twenty-server/src/common/` or `packages/twenty-server/src/shared/`
   - Must be accessible by all custom modules
   - Recommendation: Use `src/common/` for consistency

**Amelia (Dev) - Development Implementation & Code Organization:**
1. **Module Registration:**
   - How to register custom modules in NestJS?
   - Options: Import in `app.module.ts` or create `custom.module.ts` as entry point
   - Recommendation: Create `custom.module.ts` to manage all custom modules centrally

2. **GraphQL Schema Generation:**
   - How to generate GraphQL schema for custom objects?
   - Options: Use Twenty CRM's schema generation or manual schema files
   - Recommendation: Use Twenty CRM's mechanism, document extension points

3. **Cross-Package Testing:**
   - E2E tests in `packages/twenty-front/tests/e2e/` may need cross-package testing
   - Consider root-level `tests/e2e/` for integration tests
   - Recommendation: Define test structure for cross-package scenarios

**John (PM) - Product Management & Team Collaboration:**
1. **Feature Completeness Mapping:**
   - Need requirements-to-files mapping table
   - Ensure all functional requirements have corresponding files
   - Recommendation: Create comprehensive mapping table

2. **Phased Development Support:**
   - Structure should support MVP Phase 1 and Phase 2 separation
   - Need clear file scope for each phase
   - Recommendation: Define phase-specific file lists

3. **Team Collaboration:**
   - Multiple developers need clear module boundaries
   - Avoid conflicts in shared code
   - Recommendation: Define module ownership and collaboration rules

**Mary (Analyst) - Business Analysis & Requirements Mapping:**
1. **Data Model Completeness:**
   - Verify Product and Interaction data models support all business scenarios
   - Ensure all business data needs are covered
   - Recommendation: Validate data model against business requirements

2. **Permission Module Position:**
   - Permission module should be positioned earlier (foundational)
   - Other modules depend on it, should be loaded first
   - Recommendation: Move permission module to first position in `custom/` directory

3. **Future Extensibility:**
   - Structure should support Growth stage features (e.g., AI analysis)
   - Reserve space for future modules
   - Recommendation: Define extension points and reserved locations

**Consensus & Recommendations:**

1. **Twenty CRM Structure Verification:**
   - **Action:** In POC phase, examine Twenty CRM's actual directory structure
   - **Steps:**
     - Clone Twenty CRM repository
     - Identify where custom code should be placed
     - Document actual structure
     - Update project organization patterns based on findings
   - **Fallback:** If `custom/` not available, use `extensions/` or `modules/custom/`

2. **Module Dependency Graph:**
   - **Action:** Create and document module dependency relationships
   - **Rules:**
     - Permission → All other modules (foundational)
     - Product → Interaction (unidirectional)
     - Excel Import → Product, Customer (read-only)
     - Offline Sync → All modules (cross-cutting)
   - **Enforcement:** Document in architecture, enforce in code review

3. **Requirements-to-Files Mapping Table:**
   - **Action:** Create comprehensive mapping table
   - **Scope:** Functional requirements, non-functional requirements, UX requirements
   - **Format:** Requirement ID → File Path → Implementation Status
   - **Maintenance:** Update as development progresses

4. **Module Registration Strategy:**
   - **Action:** Define unified module registration approach
   - **Implementation:**
     - Create `packages/twenty-server/src/custom/custom.module.ts`
     - Import all custom modules in `custom.module.ts`
     - Import `CustomModule` in `app.module.ts`
   - **Benefits:** Centralized management, easier maintenance

5. **Permission Module Position:**
   - **Action:** Move permission module to first position
   - **New Structure:**
     ```
     custom/
       ├── permission/       # First (foundational)
       ├── product/          # Second
       ├── interaction/       # Third (depends on product)
       ├── excel-import/     # Fourth
       └── offline-sync/      # Fifth (cross-cutting)
     ```

6. **Cross-Package Test Structure:**
   - **Action:** Define test structure for cross-package scenarios
   - **Structure:**
     - Unit tests: Co-located with source files
     - Integration tests: Co-located with source files
     - E2E tests: `packages/twenty-front/tests/e2e/` (frontend-specific)
     - Cross-package E2E: `tests/e2e/` (root level, if needed)

**Enhanced Action Items:**

1. **POC Phase Tasks:**
   - Verify Twenty CRM directory structure
   - Identify custom code location
   - Test module registration approach
   - Validate GraphQL schema generation

2. **Architecture Documentation:**
   - Create module dependency graph
   - Create requirements-to-files mapping table
   - Document module registration process
   - Define test structure guidelines

3. **Code Organization:**
   - Reorganize permission module position
   - Create `custom.module.ts` for centralized registration
   - Define shared code location (`src/common/`)
   - Establish module boundary rules

### Module Dependency Graph

**Dependency Relationships:**

```
Permission Module (Foundation)
  ↓
  ├── Product Module
  │     ↓
  │     └── Interaction Module
  │
  ├── Excel Import Module
  │     ├── → Product Module (read-only)
  │     └── → Customer Module (read-only)
  │
  └── Offline Sync Module (Cross-cutting)
        ├── → Product Module
        ├── → Interaction Module
        └── → Customer Module
```

**Dependency Rules:**
- **Unidirectional:** Interaction → Product (Interaction depends on Product, not vice versa)
- **Foundation First:** Permission module must be loaded before all other modules
- **No Circular Dependencies:** Enforced in code review and architecture validation
- **Read-Only Dependencies:** Excel Import only reads from Product/Customer, doesn't modify

**Module Loading Order:**
1. Permission Module (foundational)
2. Product Module (independent)
3. Interaction Module (depends on Product)
4. Excel Import Module (depends on Product, Customer)
5. Offline Sync Module (depends on all, cross-cutting)

### Requirements-to-Files Mapping Table

**Functional Requirements Mapping:**

| Requirement ID | Requirement Description | Backend File | Frontend File | Database Table | Status |
|---------------|------------------------|--------------|---------------|----------------|--------|
| FR1-FR8 | Product Management | `custom/product/product.service.ts` | `custom/product/components/` | `products` | Planned |
| FR9-FR16 | Customer Management | Extend `core/customer/` | Extend `modules/customer/` | `companies` | Planned |
| FR17-FR22 | Interaction Recording | `custom/interaction/interaction.service.ts` | `custom/interaction/components/` | `product_customer_interactions` | Planned |
| FR23-FR27 | Quick Record | Uses `interaction.service.ts` | `custom/quick-record/components/QuickRecordForm.tsx` | `product_customer_interactions` | Planned |
| FR38-FR46 | Data Import/Export | `custom/excel-import/excel-import.service.ts` | Extend Twenty CRM UI | `excel_imports` | Planned |
| FR47-FR56 | Permission & Access Control | `custom/permission/permission.service.ts` | Permission hooks | RLS policies | Planned |
| FR57-FR65 | Search & Filter | Extend resolvers | Extend components | Indexes | Planned |
| FR66-FR75 | Business Dashboard | Aggregation services | Dashboard components | Views | Planned |
| FR76-FR85 | Mobile Offline | `custom/offline-sync/offline-sync.service.ts` | `custom/offline-sync/components/` | `offline_sync_queue` | Planned |
| FR86-FR95 | Audit Logging | Extend Twenty CRM logging | Log viewer components | `audit_logs` | Planned |
| FR96-FR105 | GDPR Compliance | Data export/delete services | GDPR request UI | Data export tables | Planned |
| FR106-FR115 | Batch Operations | Batch service | Batch UI components | Batch job tables | Planned |
| FR116-FR125 | Smart Suggestions | Suggestion service | Suggestion components | Suggestion cache | Growth |
| FR126-FR132 | AI Analysis | `custom/ai-analysis/ai-analysis.service.ts` | AI dashboard components | AI analysis cache | Growth |

**Non-Functional Requirements Mapping:**

| Requirement ID | Requirement Description | Implementation Location | Status |
|---------------|------------------------|-------------------------|--------|
| NFR1-NFR5 | Performance | Caching, indexing, pagination | Planned |
| NFR6-NFR10 | Security | Permission guards, RLS, encryption | Planned |
| NFR11-NFR15 | Reliability | Error handling, logging, monitoring | Planned |
| NFR16-NFR20 | Scalability | Horizontal scaling, load balancing | Growth |
| NFR21-NFR25 | Integration | API design, webhook support | Growth |
| NFR26-NFR30 | Maintainability | Code organization, documentation | Ongoing |

**UX Requirements Mapping:**

| Requirement ID | Requirement Description | Frontend File | Status |
|---------------|------------------------|---------------|--------|
| UX-001 | Quick Record Form | `custom/quick-record/components/QuickRecordForm.tsx` | Planned |
| UX-002 | Product Selector | `custom/product/components/ProductSelector.tsx` | Planned |
| UX-003 | Offline Sync Status | `custom/offline-sync/components/OfflineSyncStatus.tsx` | Planned |
| UX-004 | Interaction Timeline | `custom/interaction/components/InteractionTimeline.tsx` | Planned |
| UX-005 | Multi-View Toggle | `custom/interaction/components/MultiViewToggle.tsx` | Planned |

### Module Registration Strategy

**Centralized Module Registration:**

**Step 1: Create Custom Module Entry Point**

**File:** `packages/twenty-server/src/custom/custom.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PermissionModule } from './permission/permission.module';
import { ProductModule } from './product/product.module';
import { InteractionModule } from './interaction/interaction.module';
import { ExcelImportModule } from './excel-import/excel-import.module';
import { OfflineSyncModule } from './offline-sync/offline-sync.module';

@Module({
  imports: [
    // Load in dependency order
    PermissionModule,      // First (foundational)
    ProductModule,         // Second (independent)
    InteractionModule,     // Third (depends on Product)
    ExcelImportModule,     // Fourth (depends on Product, Customer)
    OfflineSyncModule,     // Fifth (cross-cutting, depends on all)
  ],
  exports: [
    PermissionModule,
    ProductModule,
    InteractionModule,
    ExcelImportModule,
    OfflineSyncModule,
  ],
})
export class CustomModule {}
```

**Step 2: Register in App Module**

**File:** `packages/twenty-server/src/app.module.ts` (or Twenty CRM's equivalent)

```typescript
import { Module } from '@nestjs/common';
import { CustomModule } from './custom/custom.module';
// ... other imports

@Module({
  imports: [
    // ... Twenty CRM core modules
    CustomModule,  // Import custom module
  ],
  // ... other configuration
})
export class AppModule {}
```

**Benefits:**
- **Centralized Management:** All custom modules registered in one place
- **Dependency Order:** Clear loading order enforced
- **Easy Maintenance:** Add/remove modules in single location
- **Clear Boundaries:** Separation between Twenty CRM core and custom code

### Twenty CRM Structure Verification Plan

**POC Phase Tasks:**

**Task 1: Clone and Examine Twenty CRM Structure**
- Clone Twenty CRM repository
- Examine `packages/twenty-server/src/` structure
- Identify existing `custom/` or similar directories
- Document actual structure

**Task 2: Identify Custom Code Location**
- Test if `src/custom/` directory exists
- If not, identify alternative locations:
  - `src/modules/custom/`
  - `src/extensions/`
  - `src/app/custom/`
- Document findings

**Task 3: Test Module Registration**
- Create test custom module
- Test registration in `app.module.ts`
- Verify module loading order
- Document registration process

**Task 4: Validate GraphQL Schema Generation**
- Test custom object GraphQL schema generation
- Identify extension points
- Document schema generation process

**Task 5: Update Project Structure**
- Based on findings, update project structure documentation
- Adjust directory paths if needed
- Update all references in architecture document

**Verification Checklist:**
- [ ] Twenty CRM directory structure documented
- [ ] Custom code location identified and verified
- [ ] Module registration approach tested
- [ ] GraphQL schema generation validated
- [ ] Project structure updated based on findings

### Development Workflow Integration

**Development Server Structure:**
- **Backend:** NestJS dev server with hot reload
- **Frontend:** Vite dev server with HMR
- **Database:** PostgreSQL (Docker)
- **Redis:** Redis (Docker) for caching and queues
- **Worker:** Bull Queue worker process

**Build Process Structure:**
- **Backend:** NestJS build → `packages/twenty-server/dist/`
- **Frontend:** Vite build → `packages/twenty-front/dist/`
- **Docker:** Multi-stage builds for production images

**Deployment Structure:**
- **Docker Compose:** Multi-container setup (server, db, redis, worker)
- **Environment:** Environment variables via `.env` files
- **Migrations:** TypeORM migrations run on startup
- **Health Checks:** `/health` endpoints for monitoring

### Pre-mortem Analysis

**Method Applied:** Pre-mortem Analysis - Imagine future failure then work backwards to prevent it.

**Scenario:** It's June 23, 2025 (6 months from now). The project has failed. We need to understand what went wrong and how to prevent it.

**Failure Scenarios Identified:**

#### Failure Scenario 1: Low User Adoption - System Abandoned

**The Failure:**
- Only 20% of users actively use the system after 3 months
- Frontend/Backend Specialists continue using Excel and email
- Director questions ROI, considers canceling the project
- System becomes "shelfware"

**Root Causes (Working Backwards):**
1. **Poor User Onboarding:**
   - Users didn't understand how to use product association
   - No clear training or documentation
   - First-time experience was confusing

2. **Performance Issues:**
   - System was slow (API > 1s response time)
   - Users found it faster to use Excel
   - Mobile offline sync was unreliable

3. **Feature Mismatch:**
   - Product association was too complex for users
   - Quick record didn't save time (took > 1 minute)
   - Excel import failed for their data format

4. **Lack of Business Value:**
   - Users didn't see immediate value
   - No clear ROI demonstration
   - System didn't solve their real pain points

**Prevention Measures:**
- **User Onboarding:**
  - Create comprehensive user guide with product association examples
  - Provide video tutorials for key workflows
  - Implement interactive onboarding flow
  - Assign "champions" to help users adopt

- **Performance Targets:**
  - Strict performance budgets (< 500ms API, < 30s record)
  - Regular performance testing with real user scenarios
  - Monitor and alert on performance degradation
  - Optimize before launch, not after

- **User Validation:**
  - Early user testing (before MVP completion)
  - Validate product association workflow with real users
  - Test Excel import with actual company data
  - Iterate based on feedback

- **Value Demonstration:**
  - Show ROI metrics (time saved, records completed)
  - Create success stories from early adopters
  - Provide business dashboard showing value
  - Regular check-ins with users to gather feedback

---

#### Failure Scenario 2: Critical Data Loss - System Unreliable

**The Failure:**
- Backend Specialist loses 3 days of factory records due to offline sync failure
- Excel import corrupts 500 customer records
- Product associations are lost during system upgrade
- Users lose trust, stop using the system

**Root Causes (Working Backwards):**
1. **Offline Sync Failure:**
   - IndexedDB quota exceeded, data not saved
   - Sync queue failed, no retry mechanism
   - Conflict resolution lost data (last-write-wins)

2. **Data Migration Issues:**
   - Excel import didn't validate product associations
   - Data corruption during import
   - No rollback mechanism

3. **System Upgrade Problems:**
   - Twenty CRM upgrade broke custom objects
   - Data migration script failed
   - No backup before upgrade

4. **Insufficient Backup/Recovery:**
   - Daily backups not tested
   - Recovery process was unclear
   - No point-in-time recovery

**Prevention Measures:**
- **Offline Sync Reliability:**
  - Monitor IndexedDB quota, warn users before limit
  - Implement robust sync queue with retry and persistence
  - Conflict detection and preview before sync
  - Test offline scenarios extensively (8+ hours offline)

- **Data Migration Safety:**
  - Comprehensive validation before import
  - Dry-run import with preview
  - Rollback capability for failed imports
  - Product association validation and matching

- **Upgrade Safety:**
  - Test upgrades in staging environment first
  - Backup before every upgrade
  - Data migration scripts with rollback
  - Gradual rollout with monitoring

- **Backup/Recovery:**
  - Automated daily backups with verification
  - Test recovery process monthly
  - Point-in-time recovery capability
  - Documented recovery procedures

---

#### Failure Scenario 3: Security Breach - Data Leakage

**The Failure:**
- Frontend Specialist can see Backend Specialist's supplier data
- Customer data leaked to unauthorized users
- GDPR violation, legal consequences
- System shut down for security audit

**Root Causes (Working Backwards):**
1. **Permission Logic Bugs:**
   - Resolver filtering had bugs, allowed unauthorized access
   - RLS policies were incorrect or missing
   - Role change didn't update permissions correctly

2. **Insufficient Testing:**
   - Permission scenarios not fully tested
   - Edge cases not covered
   - No security audit before launch

3. **Direct Database Access:**
   - Admin tools bypassed permission checks
   - Migration scripts didn't respect permissions
   - API endpoints had permission gaps

4. **Audit Trail Gaps:**
   - Audit logs didn't catch unauthorized access
   - No alerting on permission violations
   - Insufficient monitoring

**Prevention Measures:**
- **Comprehensive Permission Testing:**
  - Test all permission scenarios (all roles, all data types)
  - Test edge cases (role changes, customer type changes)
  - Automated permission tests in CI/CD
  - Regular security audits and penetration testing

- **Unified Permission Logic:**
  - Single source of truth for permission logic
  - Resolver and RLS use same logic
  - No direct database access without permission checks

- **Security Monitoring:**
  - Audit all data access operations
  - Alert on permission violations
  - Regular security reviews
  - Incident response plan

- **Compliance:**
  - GDPR compliance verification
  - Data protection impact assessment
  - Regular compliance audits
  - User data export/deletion capabilities

---

#### Failure Scenario 4: Performance Degradation - System Unusable

**The Failure:**
- API response time > 5 seconds under load
- System crashes when 20+ users use it simultaneously
- Database queries timeout
- Users abandon system due to slowness

**Root Causes (Working Backwards):**
1. **Insufficient Load Testing:**
   - Only tested with 5 users
   - Didn't test concurrent operations
   - Didn't test realistic usage patterns

2. **Database Performance Issues:**
   - Missing indexes on critical queries
   - RLS policies too slow
   - N+1 query problems
   - No query optimization

3. **Caching Failures:**
   - Cache invalidation too frequent
   - Cache misses causing database load
   - No cache warming strategy

4. **Resource Constraints:**
   - Database connection pool too small
   - Server resources insufficient
   - No auto-scaling

**Prevention Measures:**
- **Comprehensive Load Testing:**
  - Test with 50+ concurrent users
  - Test realistic usage patterns (mixed operations)
  - Test peak load scenarios
  - Regular performance testing

- **Database Optimization:**
  - Profile all queries, identify slow ones
  - Create indexes for all critical queries
  - Optimize RLS policies
  - Use query analysis tools

- **Caching Strategy:**
  - Implement cache warming
  - Reduce cache invalidation frequency
  - Monitor cache hit rates
  - Use multi-layer caching effectively

- **Resource Planning:**
  - Right-size database connection pool
  - Monitor resource usage
  - Plan for scaling (read replicas, etc.)
  - Set up auto-scaling if needed

---

#### Failure Scenario 5: MVP Delivery Delay - Project Cancelled

**The Failure:**
- MVP delivery delayed by 3 months
- Budget exceeded by 50%
- Key features incomplete (offline sync, Excel import)
- Management cancels project

**Root Causes (Working Backwards):**
1. **Scope Creep:**
   - Added features not in MVP scope
   - Perfectionism (over-engineering)
   - Changed requirements mid-development

2. **Technical Challenges Underestimated:**
   - Offline sync more complex than expected
   - Excel import had unexpected edge cases
   - Product association queries were slow

3. **Resource Constraints:**
   - Team size insufficient
   - Key developers unavailable
   - External dependencies delayed

4. **Poor Project Management:**
   - No clear milestones
   - No risk management
   - No regular progress reviews

**Prevention Measures:**
- **Strict Scope Management:**
  - Define MVP scope clearly, stick to it
  - No scope changes without approval
  - Regular scope reviews
  - "Must-have" vs "nice-to-have" prioritization

- **Risk Management:**
  - Identify high-risk features early
  - Create proof-of-concepts for risky features
  - Have fallback plans for risky features
  - Regular risk assessment

- **Resource Planning:**
  - Right-size team for scope
  - Identify dependencies early
  - Buffer time for unexpected issues
  - Regular resource reviews

- **Project Management:**
  - Clear milestones and deliverables
  - Weekly progress reviews
  - Early warning system for delays
  - Transparent communication with stakeholders

---

#### Failure Scenario 6: User Satisfaction Low - System Rejected

**The Failure:**
- User satisfaction score < 3/5
- Users complain about complexity
- Director receives negative feedback
- System considered a failure

**Root Causes (Working Backwards):**
1. **Poor UX Design:**
   - Product association workflow was confusing
   - Quick record was not quick (> 1 minute)
   - Mobile experience was poor

2. **Feature Complexity:**
   - Too many features, overwhelming
   - Not intuitive, required training
   - Didn't match user mental model

3. **Lack of User Input:**
   - Designed without user feedback
   - Didn't understand user workflows
   - Assumed user needs incorrectly

4. **Insufficient Support:**
   - No help documentation
   - Errors were unclear
   - No user support channel

**Prevention Measures:**
- **User-Centered Design:**
  - Early user research and testing
  - Iterative design based on feedback
  - Validate UX with real users
  - Follow UX design specification

- **Simplicity First:**
  - Focus on core workflows
  - Reduce cognitive load
  - Progressive disclosure of features
  - Clear, intuitive interface

- **User Support:**
  - Comprehensive help documentation
  - Clear error messages with solutions
  - User support channel (chat, email)
  - Regular user feedback collection

- **Success Metrics:**
  - Track user satisfaction regularly
  - Monitor user adoption metrics
  - Act on negative feedback quickly
  - Celebrate user successes

---

#### Failure Scenario 7: Integration Failure - Twenty CRM Upgrade Breaks System

**The Failure:**
- Twenty CRM major upgrade breaks all customizations
- Custom objects API changed, system broken
- Migration takes 2 months, users frustrated
- Consider rebuilding from scratch

**Root Causes (Working Backwards):**
1. **Tight Coupling:**
   - Custom objects tightly coupled to Twenty CRM internals
   - Resolver modifications depend on internal APIs
   - No abstraction layer

2. **No Upgrade Strategy:**
   - Didn't plan for Twenty CRM upgrades
   - No compatibility testing
   - No migration path

3. **Insufficient Abstraction:**
   - Direct use of Twenty CRM internal APIs
   - No wrapper layer
   - Hard to adapt to changes

**Prevention Measures:**
- **Abstraction Layer:**
  - Create wrapper layer for Twenty CRM APIs
  - Use public APIs when possible
  - Minimize dependency on internal APIs
  - Document all dependencies

- **Upgrade Strategy:**
  - Monitor Twenty CRM release notes
  - Test upgrades in staging first
  - Plan migration path for major upgrades
  - Maintain compatibility layer

- **Modular Design:**
  - Separate customizations from core
  - Make customizations upgradeable independently
  - Clear boundaries between custom and core
  - Version compatibility checks

---

**Pre-mortem Analysis Summary:**

**Critical Failure Scenarios:**
1. **Low User Adoption** - Most likely, highest impact
2. **Data Loss** - High impact, medium likelihood
3. **Security Breach** - High impact, low likelihood
4. **Performance Degradation** - Medium impact, medium likelihood
5. **MVP Delay** - Medium impact, medium likelihood
6. **Low User Satisfaction** - High impact, medium likelihood
7. **Integration Failure** - Medium impact, low likelihood

**Key Prevention Strategies:**
1. **User-Centric Approach:** Early user testing, validation, support
2. **Performance First:** Load testing, optimization, monitoring
3. **Data Safety:** Backup, recovery, validation, testing
4. **Security:** Comprehensive testing, monitoring, audits
5. **Scope Management:** Strict MVP scope, risk management
6. **Quality:** Testing, validation, iterative improvement
7. **Integration:** Abstraction, upgrade strategy, compatibility

**Action Items:**
- [ ] Create user onboarding plan and materials
- [ ] Set up comprehensive load testing environment
- [ ] Implement backup and recovery procedures
- [ ] Plan security audit schedule
- [ ] Define strict MVP scope and change control process
- [ ] Establish user feedback collection mechanism
- [ ] Create Twenty CRM upgrade compatibility strategy

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**

所有架构决策相互兼容，技术栈选择一致：

- **技术栈兼容性：** ✅ 所有技术选择基于 Twenty CRM 平台，完全兼容
  - NestJS + TypeScript + PostgreSQL + GraphQL - 由 Twenty CRM 提供，版本一致
  - React + TypeScript + Tailwind CSS - 前端技术栈统一
  - IndexedDB + React Query - 离线支持与缓存策略一致
  - Docker + Redis + Bull Queue - 部署和队列处理技术统一

- **数据架构一致性：** ✅ 所有数据决策基于 Twenty CRM Custom Objects
  - Product 对象和 Product-Customer-Interaction 对象使用统一的 Custom Objects 机制
  - 数据验证策略（客户端 + 服务端 + 数据库）三层一致
  - 缓存策略（React Query + Redis）多层一致，TTL 配置合理

- **安全架构一致性：** ✅ 权限过滤策略（Resolver + RLS）双重保障
  - GraphQL Resolver 作为主过滤层，PostgreSQL RLS 作为防御层
  - JWT 认证 + 统一权限服务 + 自定义 Guards 架构清晰
  - AES-256 加密 + TLS/SSL 传输加密策略一致

- **API 架构一致性：** ✅ GraphQL 作为统一 API 模式
  - 所有内部通信使用 GraphQL API
  - 外部服务（AI 分析）使用 REST API（Growth 阶段），架构明确
  - 错误处理三层结构（User/Business/System）一致

**Pattern Consistency:**

实现模式全面支持架构决策：

- **命名模式：** ✅ 数据库 snake_case、API PascalCase/camelCase、代码 camelCase/PascalCase
  - 所有命名约定已定义，包含示例和反模式
  - 错误代码范围分配（1000 代码/模块）清晰

- **结构模式：** ✅ 遵循 Twenty CRM monorepo 结构，自定义代码在 `custom/` 目录
  - 模块组织模式统一（service/resolver/entity/dto/module）
  - 前端组件结构一致（components/hooks/types/utils）
  - 测试文件命名统一（`*.test.ts`）

- **通信模式：** ✅ GraphQL 查询/变更、事件命名、React Query key 格式统一
  - 错误响应结构一致（ErrorCode 枚举）
  - 加载状态命名一致

- **流程模式：** ✅ 分层错误处理、指数退避重试、多层验证一致
  - 所有模式都有示例代码和反模式说明

**Structure Alignment:**

项目结构完全支持架构决策：

- **模块边界清晰：** ✅ 自定义模块在 `custom/` 目录，与 Twenty CRM 核心分离
  - 模块依赖关系已定义（单向依赖，无循环）
  - 模块注册策略已定义（`custom.module.ts` 统一入口）

- **集成点明确：** ✅ 所有集成点（GraphQL API、数据库、外部服务）已定义
  - 数据流图已绘制（Product Association、Quick Record、Offline Sync）
  - 边界清晰（API 边界、组件边界、数据边界）

- **需求映射完整：** ✅ 所有 132 个 FR 和 30 个 NFR 都有结构映射
  - 需求到文件映射表已创建
  - 每个功能需求都有对应的后端/前端/数据库文件路径

### Requirements Coverage Validation ✅

**Epic/Feature Coverage:**

所有功能类别都有架构支持：

- **产品管理（FR1-FR8）：** ✅ Custom Objects + GraphQL Resolver + 前端组件
- **客户管理（FR9-FR16）：** ✅ 扩展 Twenty CRM Customer 模块 + 角色权限过滤
- **交互记录（FR17-FR22）：** ✅ Custom Objects + 产品关联 + 权限过滤
- **快速记录（FR23-FR27）：** ✅ 前端组件 + 后端服务集成
- **数据导入/导出（FR38-FR46）：** ✅ Bull Queue 异步处理 + Excel 处理服务
- **搜索与查询（FR9-FR65）：** ✅ GraphQL 查询 + 模糊搜索 + 复合索引
- **权限与访问控制（FR47-FR56）：** ✅ 统一权限服务 + RLS + Guards
- **业务分析（FR66-FR75）：** ✅ 聚合查询 + 业务仪表板组件
- **移动离线（FR76-FR85）：** ✅ IndexedDB + 离线同步服务
- **审计日志（FR86-FR95）：** ✅ 扩展 Twenty CRM 日志系统
- **GDPR 合规（FR96-FR105）：** ✅ 数据导出/删除服务 + 请求 UI
- **批量操作（FR106-FR115）：** ✅ 批量服务 + 批量 UI 组件
- **智能建议（FR116-FR125）：** ✅ 建议服务（Growth 阶段）
- **AI 分析（FR126-FR132）：** ✅ 外部微服务集成（Growth 阶段）

**Functional Requirements Coverage:**

所有 132 个功能需求都有架构支持：

- **核心功能（MVP）：** ✅ 100% 覆盖
  - 产品关联、快速记录、Excel 导入/导出、移动离线、角色数据隔离
- **支持功能：** ✅ 100% 覆盖
  - 业务仪表板、批量操作、智能建议、搜索过滤
- **增长功能（Growth）：** ✅ 架构预留
  - AI 分析、实时更新、高级冲突解决

**Non-Functional Requirements Coverage:**

所有 30 个非功能需求都有架构支持：

- **性能（NFR1-NFR5）：** ✅
  - GraphQL API < 500ms（缓存策略 + 索引优化）
  - 页面加载 < 2s（代码分割 + 懒加载）
  - 搜索查询 < 1s（缓存 + 索引）
  - 支持 50 并发用户（垂直扩展 MVP）

- **安全（NFR6-NFR10）：** ✅
  - AES-256 加密（敏感数据）
  - RBAC 4 角色 + 完全数据隔离（Resolver + RLS）
  - 审计日志（1 年保留）
  - GDPR 合规（数据导出/删除）

- **可靠性（NFR11-NFR15）：** ✅
  - 系统可用性 > 99.5%（监控 + 健康检查）
  - 数据丢失率 < 0.1%（备份 + 恢复）
  - 自动备份（每日，30 天保留）

- **可扩展性（NFR16-NFR20）：** ✅
  - 支持 10-100 用户（垂直扩展 → 水平扩展）
  - 支持 10x 数据增长（索引 + 分页优化）

- **集成（NFR21-NFR25）：** ✅
  - GraphQL API（所有功能）
  - API 版本支持（Growth 阶段）
  - 第三方集成（Webhook/API）

- **可维护性（NFR26-NFR30）：** ✅
  - 代码测试覆盖率 > 80%（单元 + 集成测试）
  - 关键功能测试覆盖率 > 95%
  - API 文档覆盖率 > 90%（GraphQL Schema + JSDoc）

### Implementation Readiness Validation ✅

**Decision Completeness:**

所有关键决策都已完整记录：

- **技术决策：** ✅ 所有技术选择都有版本和理由
  - Twenty CRM 平台（已部署验证）
  - PostgreSQL + TypeORM（Twenty CRM 提供）
  - React Query + Redis 缓存（策略完整）
  - IndexedDB 离线存储（移动支持）

- **架构决策：** ✅ 所有 ADR 已记录
  - ADR-001: 权限过滤策略（Resolver + RLS）
  - ADR-002: 产品关联数据模型（Custom Objects）
  - ADR-003: 离线同步冲突解决（Last-write-wins MVP）
  - ADR-004: 缓存策略（多层缓存）
  - ADR-005: Excel 导入处理（异步队列）

- **模式决策：** ✅ 所有实现模式都有详细规范
  - 命名约定（数据库/API/代码）
  - 结构模式（模块组织）
  - 通信模式（GraphQL/事件）
  - 流程模式（错误处理/验证）

**Structure Completeness:**

项目结构完整且具体：

- **目录结构：** ✅ 完整定义到文件级别
  - 后端模块结构（service/resolver/entity/dto/module/test）
  - 前端模块结构（components/hooks/types/utils）
  - 测试结构（单元/集成/E2E）
  - 配置文件结构（package.json/tsconfig/env）

- **文件路径：** ✅ 所有需求都有具体文件路径
  - 需求到文件映射表已创建
  - 模块依赖关系已定义
  - 集成点已明确

- **边界定义：** ✅ 所有边界清晰
  - API 边界（GraphQL 端点）
  - 组件边界（Props/Context/Query）
  - 数据边界（数据库表/缓存）
  - 服务边界（内部/外部通信）

**Pattern Completeness:**

实现模式全面且可执行：

- **命名模式：** ✅ 涵盖所有场景
  - 数据库表/字段（snake_case）
  - GraphQL 类型/字段（PascalCase/camelCase）
  - 代码变量/类（camelCase/PascalCase）
  - 错误代码（范围分配）

- **结构模式：** ✅ 模块组织完整
  - 后端模块结构（6 个文件类型）
  - 前端模块结构（4 个目录类型）
  - 测试组织（单元/集成/E2E）

- **通信模式：** ✅ 所有通信场景已覆盖
  - GraphQL 查询/变更
  - 事件命名（{entity}.{action}）
  - React Query key 格式
  - 错误响应结构

- **流程模式：** ✅ 所有流程都有规范
  - 分层错误处理（User/Business/System）
  - 指数退避重试
  - 多层验证（Client/Server/Database）
  - 缓存失效策略

### Gap Analysis Results

**Critical Gaps: 无**

所有关键架构元素都已定义，无阻塞实施的缺口。

**Important Gaps: 2 项**

1. **Twenty CRM 结构验证：**
   - **状态：** 已识别，在 POC 阶段验证
   - **影响：** 可能需要调整自定义代码位置
   - **缓解措施：** POC 验证计划已制定，备选方案已准备

2. **GraphQL Schema 生成方式：**
   - **状态：** 已识别，需要验证 Twenty CRM 机制
   - **影响：** 可能需要手动定义 schema
   - **缓解措施：** 在 POC 阶段验证，文档扩展点

**Nice-to-Have Gaps: 3 项**

1. **开发工具推荐：**
   - ESLint 自定义规则（模式验证）
   - Pre-commit hooks（模式检查）
   - 代码生成工具（模块脚手架）

2. **开发工作流优化：**
   - 热重载配置优化
   - 调试配置（VS Code launch.json）
   - 开发环境快速启动脚本

3. **补充文档：**
   - API 使用示例（常见场景）
   - 故障排查指南
   - 性能优化最佳实践

### Validation Issues Addressed

**已识别并通过 Party Mode 讨论解决的问题：**

1. **模块注册策略：** ✅ 已解决
   - 创建 `custom.module.ts` 作为统一入口
   - 模块加载顺序已定义（依赖关系）

2. **权限模块位置：** ✅ 已解决
   - 权限模块移至首位（基础模块）
   - 模块依赖关系图已创建

3. **需求映射完整性：** ✅ 已解决
   - 需求到文件映射表已创建（132 FRs + 30 NFRs）
   - 所有功能都有对应的文件路径

4. **跨包测试结构：** ✅ 已解决
   - 测试结构已定义（单元/集成/E2E）
   - 跨包测试位置已明确

**待 POC 阶段验证的问题：**

1. **Twenty CRM 目录结构：** 待验证
   - POC 阶段验证实际结构
   - 调整自定义代码位置（如需要）

2. **GraphQL Schema 生成：** 待验证
   - 验证 Twenty CRM 的 schema 生成机制
   - 文档扩展点（如需要）

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped
- [x] Business rules and data migration strategy defined

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed
- [x] Security architecture complete
- [x] Data architecture defined
- [x] API architecture specified

**✅ Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented
- [x] Pattern examples provided
- [x] Anti-patterns identified

**✅ Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete
- [x] Module dependency graph created
- [x] Module registration strategy defined

**✅ Validation & Risk Management**

- [x] Pre-mortem analysis completed
- [x] Failure scenarios identified and addressed
- [x] Party Mode discussions completed
- [x] Architecture validation completed
- [x] Gap analysis completed

### Architecture Readiness Assessment

**Overall Status:** ✅ **READY FOR IMPLEMENTATION**

**Confidence Level:** **HIGH** - 所有关键架构元素已完整定义，无阻塞问题

**Key Strengths:**

1. **完整的技术栈定义：** 所有技术选择基于 Twenty CRM，兼容性高
2. **清晰的架构决策：** 5 个 ADR 完整记录，决策理由明确
3. **全面的实现模式：** 命名/结构/通信/流程模式完整，包含示例
4. **详细的项目结构：** 目录结构到文件级别，需求映射完整
5. **充分的验证：** Pre-mortem 分析、Party Mode 讨论、需求覆盖验证
6. **风险识别与缓解：** 关键风险已识别，缓解措施已定义

**Areas for Future Enhancement:**

1. **POC 验证：** 在实施前验证 Twenty CRM 结构兼容性
2. **开发工具：** 添加 ESLint 规则、Pre-commit hooks 等自动化验证
3. **补充文档：** API 使用示例、故障排查指南、性能优化最佳实践
4. **CI/CD 配置：** Growth 阶段添加自动化部署流程

### Implementation Handoff

**AI Agent Guidelines:**

- **遵循架构决策：** 严格按照架构文档中的所有决策实施
  - 使用 Twenty CRM Custom Objects（不要自行创建表）
  - 遵循权限过滤策略（Resolver + RLS）
  - 使用统一的错误处理模式（ErrorCode 枚举）

- **遵循实现模式：** 在所有组件中一致使用定义的模式
  - 命名约定（数据库 snake_case、API PascalCase/camelCase、代码 camelCase/PascalCase）
  - 结构模式（模块组织、文件命名）
  - 通信模式（GraphQL 查询/变更、事件命名）
  - 流程模式（错误处理、验证、缓存失效）

- **尊重项目结构：** 按照定义的结构组织代码
  - 自定义代码在 `custom/` 目录
  - 模块注册通过 `custom.module.ts`
  - 测试文件使用 `*.test.ts` 命名

- **参考架构文档：** 所有架构问题参考此文档
  - 技术选择参考 "Core Architectural Decisions"
  - 实现细节参考 "Implementation Patterns & Consistency Rules"
  - 文件位置参考 "Requirements to Structure Mapping"

**First Implementation Priority:**

1. **POC 阶段（验证关键架构）：**
   - 验证 Twenty CRM 目录结构
   - 创建测试 Product Custom Object
   - 验证权限过滤（Resolver + RLS）
   - 测试 GraphQL Schema 生成

2. **MVP Phase 1（基础设置）：**
   - 设置项目结构（`custom/` 目录）
   - 创建 `custom.module.ts`
   - 实现权限模块（基础）
   - 实现产品模块（基础）

3. **MVP Phase 2（核心功能）：**
   - 实现交互记录模块
   - 实现快速记录组件
   - 实现 Excel 导入/导出
   - 实现移动离线支持

### Party Mode Discussion Insights

**Discussion Topic:** Reviewing architecture validation results - evaluating validation completeness and implementation readiness from multiple implementation perspectives.

**Participants:** Winston (Architect), Amelia (Dev), John (PM), Mary (Analyst)

**Key Discussion Points:**

**Winston (Architect) - Technical Architecture & Validation Completeness:**
1. **Technical Compatibility Verification:**
   - Validation report confirms Twenty CRM tech stack compatibility
   - Missing: Version compatibility check
   - Recommendation: Define Twenty CRM version in POC phase, verify all dependency versions
   - Action: Add version compatibility verification plan

2. **Performance Target Validation:**
   - Validation report confirms performance targets (API < 500ms, Page < 2s)
   - Missing: Performance testing strategy
   - Recommendation: Add performance testing plan with load test scenarios and performance benchmarks
   - Action: Add performance testing plan section

3. **Security Architecture Validation:**
   - Validation report confirms security strategy
   - Missing: Security testing plan
   - Recommendation: Add security testing plan with permission test scenarios and penetration testing plan
   - Action: Add security testing plan section

**Amelia (Dev) - Development Implementation & Executability:**
1. **Development Environment Setup:**
   - Validation report confirms implementation readiness
   - Missing: Development environment configuration
   - Recommendation: Add development environment setup guide including Docker Compose config, environment variables, database initialization scripts
   - Action: Add development environment setup guide

2. **Code Generation Tools:**
   - Validation report mentions code generation tools as "Nice-to-Have"
   - Impact: Critical for development efficiency
   - Recommendation: At minimum, define module scaffolding templates to help quickly create new modules
   - Action: Add module scaffolding template definition

3. **Debugging Configuration:**
   - Validation report doesn't mention debugging configuration
   - Recommendation: Add VS Code launch.json configuration for frontend and backend debugging
   - Action: Add debugging configuration section

**John (PM) - Product Management & Delivery Readiness:**
1. **MVP Scope Validation:**
   - Validation report confirms all FRs have architectural support
   - Missing: Clear boundary between MVP and Growth stages
   - Recommendation: Add MVP Phase 1 and Phase 2 feature list with corresponding file paths, clarify delivery scope
   - Action: Add MVP feature list with file path mapping

2. **User Acceptance Criteria:**
   - Validation report confirms architecture readiness
   - Missing: User acceptance criteria definition
   - Recommendation: Add user acceptance testing plan to ensure architecture supports UAT
   - Action: Add user acceptance testing plan

3. **Risk Mitigation Timeline:**
   - Validation report identifies risks
   - Missing: Risk mitigation timeline
   - Recommendation: Add risk mitigation plan with POC validation timeline and key decision points
   - Action: Add risk mitigation timeline

**Mary (Analyst) - Business Analysis & Requirements Coverage:**
1. **Business Value Validation:**
   - Validation report confirms feature coverage
   - Missing: Validation that architecture supports business goals
   - Recommendation: Add business value validation plan ensuring architecture supports "40% sales efficiency improvement" and "20% customer churn reduction" goals
   - Action: Add business value validation plan

2. **Data Migration Validation:**
   - Validation report confirms Excel import architecture
   - Missing: Data migration completeness validation
   - Recommendation: Add data migration validation plan including data quality checks and migration success rate metrics
   - Action: Add data migration validation plan

3. **User Adoption Validation:**
   - Validation report confirms feature coverage
   - Missing: Validation that architecture supports user adoption goals
   - Recommendation: Add user adoption validation ensuring architecture supports "80% users active within 3 months" goal
   - Action: Add user adoption validation plan

**Consensus & Recommendations:**

All four experts agree the validation report is comprehensive but needs the following enhancements:

1. **Technical Implementation Details:**
   - Development environment setup guide
   - Code generation tools/scaffolding templates
   - Debugging configuration (VS Code launch.json)
   - Version compatibility verification plan

2. **Performance & Security Validation:**
   - Performance testing plan (load test scenarios, performance benchmarks)
   - Security testing plan (permission test scenarios, penetration testing plan)

3. **Product Delivery Readiness:**
   - MVP Phase 1 and Phase 2 feature list (with file path mapping)
   - User acceptance testing plan
   - Risk mitigation timeline

4. **Business Value Validation:**
   - Business value validation plan (how architecture supports business goals)
   - Data migration validation plan (data quality checks, migration success rate)
   - User adoption validation plan (how architecture supports user adoption goals)

**Enhanced Action Items:**

1. **POC Phase Tasks:**
   - Verify Twenty CRM directory structure
   - Identify custom code location
   - Test module registration approach
   - Validate GraphQL schema generation
   - **NEW:** Verify version compatibility (Twenty CRM version, dependency versions)

2. **Architecture Documentation:**
   - Create module dependency graph
   - Create requirements-to-files mapping table
   - Document module registration process
   - Define test structure guidelines
   - **NEW:** Add development environment setup guide
   - **NEW:** Add module scaffolding template definition
   - **NEW:** Add debugging configuration

3. **Testing & Validation Plans:**
   - **NEW:** Performance testing plan (load test scenarios, performance benchmarks)
   - **NEW:** Security testing plan (permission test scenarios, penetration testing plan)
   - **NEW:** User acceptance testing plan
   - **NEW:** Business value validation plan
   - **NEW:** Data migration validation plan
   - **NEW:** User adoption validation plan

4. **Product Delivery:**
   - **NEW:** MVP Phase 1 and Phase 2 feature list (with file path mapping)
   - **NEW:** Risk mitigation timeline with key decision points

### Enhanced Validation Content

**Development Environment Setup Guide:**

**Prerequisites:**
- Node.js v18+ (verify with `node --version`)
- Yarn (verify with `yarn --version`)
- Docker Desktop (verify with `docker --version`)
- Docker Compose (verify with `docker-compose --version`)
- PostgreSQL 14+ (via Docker)
- Redis 7+ (via Docker)

**Local Development Setup:**
1. **Clone Twenty CRM Repository:**
   ```bash
   git clone https://github.com/twentyhq/twenty.git
   cd twenty
   ```

2. **Environment Variables:**
   - Copy `.env.example` to `.env`
   - Configure required variables:
     - `SERVER_URL=http://localhost:3000`
     - `STORAGE_TYPE=local`
     - `APP_SECRET=<generate-secret>`
     - Database connection strings
     - Redis connection string

3. **Docker Compose Setup:**
   ```bash
   cd packages/twenty-docker
   docker-compose up -d
   ```

4. **Database Initialization:**
   - Twenty CRM migrations run automatically on startup
   - Custom migrations: `packages/twenty-server/src/migrations/`

5. **Development Servers:**
   - Backend: `cd packages/twenty-server && yarn start:dev`
   - Frontend: `cd packages/twenty-front && yarn dev`

**Module Scaffolding Template:**

**Backend Module Template:**
```bash
# Create new module structure
mkdir -p packages/twenty-server/src/custom/{module-name}
cd packages/twenty-server/src/custom/{module-name}

# Create files
touch {module-name}.service.ts
touch {module-name}.resolver.ts
touch {module-name}.entity.ts
touch {module-name}.dto.ts
touch {module-name}.module.ts
touch {module-name}.service.test.ts
```

**Frontend Module Template:**
```bash
# Create new module structure
mkdir -p packages/twenty-front/src/custom/{module-name}/{components,hooks,types,utils}
cd packages/twenty-front/src/custom/{module-name}

# Create files
touch components/{Component}.tsx
touch components/{Component}.test.tsx
touch hooks/use{Feature}.ts
touch hooks/use{Feature}.test.ts
touch types/{module-name}.types.ts
touch utils/{module-name}.utils.ts
```

**VS Code Debugging Configuration:**

**File:** `.vscode/launch.json`
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "yarn",
      "runtimeArgs": ["start:dev"],
      "cwd": "${workspaceFolder}/packages/twenty-server",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "chrome",
      "request": "launch",
      "name": "Debug Frontend",
      "url": "http://localhost:3001",
      "webRoot": "${workspaceFolder}/packages/twenty-front",
      "sourceMaps": true
    }
  ]
}
```

**Performance Testing Plan:**

**Load Test Scenarios:**
1. **API Response Time:**
   - Target: GraphQL API < 500ms (P95)
   - Test: 50 concurrent users, 100 requests/user
   - Tools: k6, Apache JMeter, or Artillery
   - Metrics: Response time distribution, error rate

2. **Page Load Time:**
   - Target: Page load < 2 seconds
   - Test: Lighthouse performance audit
   - Metrics: First Contentful Paint (FCP), Time to Interactive (TTI)

3. **Search Query Performance:**
   - Target: Search query < 1 second (P95)
   - Test: 100 concurrent search queries
   - Metrics: Query response time, cache hit rate

**Performance Benchmarks:**
- **Baseline:** Current Twenty CRM performance
- **Target:** Meet all NFR performance requirements
- **Monitoring:** Continuous performance monitoring in production

**Security Testing Plan:**

**Permission Test Scenarios:**
1. **Role-Based Access Control:**
   - Test: Frontend Specialist can only access buyer-type customers
   - Test: Backend Specialist can only access supplier-type customers
   - Test: Director/Administrator can access all customer types
   - Test: Unauthorized access attempts are blocked

2. **Data Isolation:**
   - Test: Complete data isolation between Frontend/Backend Specialists
   - Test: RLS policies enforce isolation at database level
   - Test: Resolver filtering enforces isolation at application level

3. **API Security:**
   - Test: Unauthenticated requests are rejected
   - Test: Invalid tokens are rejected
   - Test: Rate limiting (Growth stage)

**Penetration Testing Plan:**
- **Scope:** Authentication, authorization, data isolation, API security
- **Frequency:** Before MVP launch, annually thereafter
- **Tools:** OWASP ZAP, Burp Suite, manual testing

**MVP Feature List with File Path Mapping:**

**MVP Phase 1 (0-6 weeks):**

| Feature | Backend File | Frontend File | Database Table | Status |
|---------|-------------|---------------|----------------|--------|
| Permission Module | `custom/permission/permission.service.ts` | Permission hooks | RLS policies | Planned |
| Product Module (Basic) | `custom/product/product.service.ts` | `custom/product/components/ProductSelector.tsx` | `products` | Planned |
| Customer Extension | Extend `core/customer/` | Extend `modules/customer/` | `companies` | Planned |

**MVP Phase 2 (6-12 weeks):**

| Feature | Backend File | Frontend File | Database Table | Status |
|---------|-------------|---------------|----------------|--------|
| Interaction Module | `custom/interaction/interaction.service.ts` | `custom/interaction/components/` | `product_customer_interactions` | Planned |
| Quick Record | Uses `interaction.service.ts` | `custom/quick-record/components/QuickRecordForm.tsx` | `product_customer_interactions` | Planned |
| Excel Import/Export | `custom/excel-import/excel-import.service.ts` | Extend Twenty CRM UI | `excel_imports` | Planned |
| Offline Sync | `custom/offline-sync/offline-sync.service.ts` | `custom/offline-sync/components/OfflineSyncStatus.tsx` | `offline_sync_queue` | Planned |

**User Acceptance Testing Plan:**

**UAT Scenarios:**
1. **Quick Record (30 seconds):**
   - User creates product-customer interaction record in < 30 seconds
   - Product association works correctly
   - Record appears in history immediately

2. **Product Association:**
   - User can search and select products quickly (< 3 seconds)
   - Product-customer associations are visible
   - History shows all interactions for a product-customer pair

3. **Role-Based Data Isolation:**
   - Frontend Specialist only sees buyer-type customers
   - Backend Specialist only sees supplier-type customers
   - Director/Administrator sees all customers

4. **Excel Import:**
   - User imports Excel file with customer data
   - Data is validated and cleaned automatically
   - Import progress is visible
   - Errors are reported clearly

5. **Mobile Offline:**
   - User creates record offline
   - Record syncs when online
   - Sync status is visible

**UAT Success Criteria:**
- All UAT scenarios pass
- User satisfaction score > 4.0/5.0
- No critical bugs
- Performance meets targets

**Business Value Validation Plan:**

**Business Goals Mapping:**
1. **40% Sales Efficiency Improvement:**
   - **Architecture Support:** Quick record (< 30s), product association, smart pre-fill
   - **Measurement:** Time saved per interaction, number of interactions recorded
   - **Target:** 40% reduction in time spent on record-keeping

2. **20% Customer Churn Reduction:**
   - **Architecture Support:** Interaction history, follow-up reminders, customer insights
   - **Measurement:** Customer churn rate, follow-up completion rate
   - **Target:** 20% reduction in customer churn

3. **Complete Business Process Recording:**
   - **Architecture Support:** Product-customer-interaction model, audit logs
   - **Measurement:** Process recording completeness, data quality
   - **Target:** 100% of business processes recorded

**Validation Metrics:**
- Sales efficiency: Time saved per interaction
- Customer churn: Churn rate reduction
- Process recording: Recording completeness rate

**Data Migration Validation Plan:**

**Migration Process:**
1. **Data Quality Check:**
   - Validate Excel data format
   - Check for duplicates
   - Verify required fields
   - Clean data (trim, encoding, format)

2. **Product Matching:**
   - Fuzzy matching for product associations
   - Manual review for unmatched products
   - Product creation for new products

3. **Migration Execution:**
   - Dry-run import with preview
   - Full import with progress tracking
   - Error reporting and resolution
   - Rollback capability

**Migration Success Metrics:**
- **Data Quality:** > 95% data quality score
- **Migration Success Rate:** > 98% records migrated successfully
- **Product Matching:** > 90% products matched automatically
- **Error Rate:** < 2% records require manual intervention

**User Adoption Validation Plan:**

**Adoption Goals:**
- **80% users active within 3 months:** Architecture supports this through:
  - Easy onboarding (quick record, product association)
  - Mobile offline support (factory field use)
  - Performance optimization (fast response times)
  - User-friendly interface (UX design)

**Adoption Metrics:**
- **User Activation:** % of users who complete first record
- **User Engagement:** % of users active weekly
- **User Retention:** % of users active after 3 months
- **Feature Adoption:** % of users using key features (quick record, product association)

**Architecture Support:**
- Quick record (< 30s) enables easy first use
- Mobile offline support enables field use
- Performance (< 500ms API) ensures smooth experience
- Product association provides clear value

**Risk Mitigation Timeline:**

**POC Phase (Week 1-2):**
- [ ] Verify Twenty CRM directory structure
- [ ] Test Product Custom Object creation
- [ ] Validate permission filtering (Resolver + RLS)
- [ ] Test GraphQL Schema generation
- [ ] Verify version compatibility

**MVP Phase 1 (Week 3-8):**
- [ ] Set up project structure
- [ ] Create `custom.module.ts`
- [ ] Implement permission module
- [ ] Implement product module (basic)
- [ ] Performance testing (API < 500ms)
- [ ] Security testing (permission scenarios)

**MVP Phase 2 (Week 9-14):**
- [ ] Implement interaction module
- [ ] Implement quick record component
- [ ] Implement Excel import/export
- [ ] Implement mobile offline support
- [ ] User acceptance testing
- [ ] Business value validation

**Key Decision Points:**
- **Week 2:** POC validation complete - proceed or pivot?
- **Week 6:** MVP Phase 1 complete - performance targets met?
- **Week 12:** MVP Phase 2 complete - ready for user testing?

**Next Workflow Suggestion:**

架构工作流完成后，建议进入实施阶段：
- 使用 `create-story` 工作流创建用户故事
- 使用 `dev-story` 工作流进行开发实施
- 或使用 `quick-dev` 工作流进行快速开发迭代

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-23
**Document Location:** _bmad-output/architecture.md

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- **15+ architectural decisions** made (5 ADRs + 10+ critical decisions)
- **20+ implementation patterns** defined (naming, structure, communication, process)
- **6 core architectural components** specified (Product, Customer, Interaction, Permission, Excel Import, Offline Sync)
- **162 requirements** fully supported (132 FRs + 30 NFRs)

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions (Twenty CRM, NestJS, React, PostgreSQL, GraphQL)
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing fenghua-crm. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**

1. **POC Phase (Week 1-2):**
   - Verify Twenty CRM directory structure
   - Test Product Custom Object creation
   - Validate permission filtering (Resolver + RLS)
   - Test GraphQL Schema generation
   - Verify version compatibility

2. **MVP Phase 1 (Week 3-8):**
   - Set up project structure (`custom/` directory)
   - Create `custom.module.ts` for centralized module registration
   - Implement permission module (foundational)
   - Implement product module (basic)

3. **MVP Phase 2 (Week 9-14):**
   - Implement interaction module
   - Implement quick record component
   - Implement Excel import/export
   - Implement mobile offline support

**Development Sequence:**

1. Initialize project using Twenty CRM as base platform
2. Set up development environment per architecture (Docker Compose, environment variables)
3. Implement core architectural foundations (permission module, custom.module.ts)
4. Build features following established patterns (Product, Interaction, Quick Record)
5. Maintain consistency with documented rules (naming, structure, communication, process)

### Quality Assurance Checklist

**✅ Architecture Coherence**

- [x] All decisions work together without conflicts
- [x] Technology choices are compatible (Twenty CRM stack)
- [x] Patterns support the architectural decisions
- [x] Structure aligns with all choices

**✅ Requirements Coverage**

- [x] All 132 functional requirements are supported
- [x] All 30 non-functional requirements are addressed
- [x] Cross-cutting concerns are handled (RBAC, Product Association, Offline Sync, Audit Logging, Performance, Excel Integration)
- [x] Integration points are defined (GraphQL API, Database, External Services)

**✅ Implementation Readiness**

- [x] Decisions are specific and actionable (5 ADRs with clear rationale)
- [x] Patterns prevent agent conflicts (comprehensive naming, structure, communication, process patterns)
- [x] Structure is complete and unambiguous (complete directory structure to file level)
- [x] Examples are provided for clarity (good/bad examples for all patterns)

**✅ Validation & Testing**

- [x] Architecture validation completed (coherence, coverage, readiness)
- [x] Performance testing plan defined
- [x] Security testing plan defined
- [x] User acceptance testing plan defined
- [x] Business value validation plan defined

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction. All decisions are documented in ADRs with context, options, and consequences.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly. Comprehensive patterns cover naming, structure, communication, and process.

**📋 Complete Coverage**
All project requirements (132 FRs + 30 NFRs) are architecturally supported, with clear mapping from business needs to technical implementation. Requirements-to-files mapping table provides complete traceability.

**🏗️ Solid Foundation**
The chosen Twenty CRM platform and architectural patterns provide a production-ready foundation following current best practices. Custom code is organized in `custom/` directories to maintain clear separation from core platform code.

**✅ Comprehensive Validation**
Architecture has been validated through:
- Coherence validation (decision compatibility, pattern consistency, structure alignment)
- Requirements coverage validation (all FRs and NFRs supported)
- Implementation readiness validation (decision completeness, structure completeness, pattern completeness)
- Party Mode discussions (multiple expert perspectives)
- Pre-mortem analysis (risk identification and mitigation)

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.

**Key Implementation Resources:**
- Development Environment Setup Guide (Section: Enhanced Validation Content)
- Module Scaffolding Templates (Section: Enhanced Validation Content)
- Performance Testing Plan (Section: Enhanced Validation Content)
- Security Testing Plan (Section: Enhanced Validation Content)
- MVP Feature List with File Path Mapping (Section: Enhanced Validation Content)
- Risk Mitigation Timeline (Section: Enhanced Validation Content)

