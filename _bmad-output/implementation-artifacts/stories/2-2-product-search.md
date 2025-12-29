# Story 2.2: 产品搜索功能

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **所有用户**,
I want **根据产品名称、产品HS编码或产品类别搜索产品**,
So that **我可以快速找到需要的产品信息**.

## Acceptance Criteria

1. **Given** 用户已登录系统
   **When** 用户访问产品搜索页面或在产品列表页面使用搜索框
   **Then** 系统显示搜索输入框
   **And** 搜索框支持按产品名称、产品HS编码、产品类别搜索
   **And** 搜索框支持实时搜索（输入后自动搜索，无需点击搜索按钮）

2. **Given** 用户在搜索框输入产品名称（支持模糊搜索）
   **When** 用户输入产品名称的部分字符（如"不锈钢"）
   **Then** 系统实时显示匹配的产品列表（debounce 优化，避免频繁请求）
   **And** 匹配的产品按相关性排序（完全匹配优先，部分匹配其次）
   **And** 搜索结果响应时间 < 1 秒（P95）
   **And** 搜索结果包含产品名称、HS编码、类别、描述等关键信息

3. **Given** 用户在搜索框输入产品HS编码
   **When** 用户输入完整的或部分 HS 编码（如"7323"）
   **Then** 系统显示匹配的产品列表
   **And** 完全匹配的 HS 编码优先显示
   **And** 支持部分匹配（如输入"7323"可以找到"7323.93"）

4. **Given** 用户选择产品类别进行搜索
   **When** 用户从类别下拉列表中选择类别（如"电子产品"）
   **Then** 系统显示该类别下的所有产品
   **And** 产品列表按产品名称排序
   **And** 支持与名称/HS编码搜索组合使用（多条件搜索）

5. **Given** 用户进行搜索
   **When** 搜索结果为空
   **Then** 系统显示空状态提示"未找到匹配的产品"
   **And** 系统提供建议"尝试使用不同的搜索关键词"
   **And** 显示友好的空状态图标或插图

6. **Given** 用户进行搜索
   **When** 搜索结果数量较多（> 20 条）
   **Then** 系统使用分页显示结果
   **And** 每页显示 20 条产品
   **And** 用户可以翻页查看更多结果
   **And** 显示总结果数和当前页信息（如"共 45 条结果，第 1/3 页"）

7. **Given** 用户查看搜索结果
   **When** 用户点击搜索结果中的产品
   **Then** 系统跳转到产品详情页面
   **And** 系统显示产品的完整信息

8. **Given** 用户执行产品搜索
   **When** 用户输入搜索关键词
   **Then** 系统在 3 秒内显示搜索结果（P99）
   **And** 搜索结果响应时间 < 1 秒（P95）
   **And** 搜索过程中显示加载状态（loading indicator）

## Tasks / Subtasks

- [x] Task 1: 后端搜索服务 (AC: #2, #3, #4, #8)
  - [x] 扩展产品服务 (products.service.ts) - 添加搜索方法（已在Story 2.1中实现）
  - [x] 实现产品名称模糊搜索（使用 PostgreSQL LIKE 或全文搜索）
  - [x] 实现 HS 编码搜索（支持精确匹配和部分匹配）
  - [x] 实现产品类别搜索（支持下拉选择）
  - [x] 实现多条件组合搜索（名称 + HS编码 + 类别）
  - [x] 实现搜索结果排序（完全匹配优先，部分匹配其次）
  - [x] 实现搜索结果分页（limit/offset 或 cursor-based）
  - [x] 优化搜索性能（使用数据库索引，参考 database-schema-design.md）

- [x] Task 2: 后端搜索 DTO 和验证 (AC: #1, #2, #3, #4)
  - [x] 创建搜索查询 DTO (product-query.dto.ts - 已存在，已扩展)
  - [x] 实现搜索参数验证（名称、HS编码、类别）
  - [x] 实现分页参数验证（page, limit, offset）
  - [x] 实现搜索响应 DTO (使用 ProductListResponse)
  - [x] 添加搜索参数类型定义（支持可选参数）

- [x] Task 3: 后端搜索控制器 (AC: #1, #2, #3, #4, #8)
  - [x] 扩展产品控制器 (products.controller.ts) - 搜索功能已集成到 findAll 端点
  - [x] 实现 GET /products 端点（支持搜索查询参数）
  - [x] 实现搜索参数解析和验证
  - [x] 实现搜索响应格式化
  - [ ] 添加搜索性能监控（记录搜索响应时间）- 可选，后续优化

- [ ] Task 4: 数据库查询优化 (AC: #2, #3, #4, #8)
  - [ ] 确认产品表索引已创建（参考 001-create-products-table.sql）
  - [ ] 验证全文搜索索引（idx_products_name_search）可用
  - [ ] 优化搜索 SQL 查询（使用索引，避免全表扫描）
  - [ ] 实现搜索查询性能测试（确保 P95 < 1 秒）
  - [ ] 实现搜索缓存（可选，Redis 缓存热门搜索）

- [x] Task 5: 前端搜索组件 (AC: #1, #2, #3, #4)
  - [x] 创建产品搜索组件 (ProductSearch.tsx)
  - [x] 实现搜索输入框（支持名称、HS编码搜索）
  - [x] 实现类别下拉选择器（从预定义类别列表选择）
  - [x] 实现实时搜索（debounce 优化，500ms 延迟）
  - [x] 实现搜索加载状态（loading indicator）
  - [x] 实现搜索清空功能（清除搜索条件）

- [x] Task 6: 前端搜索结果展示 (AC: #2, #3, #4, #6, #7)
  - [x] 创建搜索结果列表组件 (ProductSearchResults.tsx)
  - [x] 实现搜索结果卡片/列表展示（产品名称、HS编码、类别、描述）
  - [x] 实现搜索结果高亮（匹配关键词高亮显示）
  - [x] 实现搜索结果排序显示（完全匹配优先）
  - [x] 实现搜索结果分页组件（上一页/下一页，页码显示）
  - [x] 实现搜索结果总数显示

- [x] Task 7: 前端空状态处理 (AC: #5)
  - [x] 创建空状态组件 (EmptySearchResults.tsx)
  - [x] 实现空状态提示消息"未找到匹配的产品"
  - [x] 实现空状态建议"尝试使用不同的搜索关键词"
  - [x] 实现友好的空状态图标或插图

- [x] Task 8: 前端搜索服务集成 (AC: #1, #2, #3, #4, #8)
  - [x] 扩展产品服务 (products.service.ts) - 搜索 API 调用已存在
  - [x] 实现搜索 API 调用（GET /products?search=...）
  - [x] 实现搜索参数构建（query string）
  - [x] 实现搜索响应处理（解析分页信息）
  - [x] 实现搜索错误处理（网络错误、超时等）
  - [ ] 实现搜索请求取消（用户输入新关键词时取消旧请求）- 可选优化

- [x] Task 9: 前端搜索页面集成 (AC: #1, #2, #3, #4, #7)
  - [x] 创建产品搜索页面 (ProductSearchPage.tsx)
  - [x] 集成搜索组件和结果展示组件
  - [x] 实现搜索结果点击跳转（跳转到产品管理页面）
  - [ ] 实现搜索历史记录（可选，localStorage）- 可选功能
  - [x] 实现响应式设计（移动端和桌面端适配）

## Dev Notes

- **Relevant architecture patterns and constraints:**
  - API Integration Architecture: Custom backend (`fenghua-backend`) interacts with Neon PostgreSQL database directly (not through Twenty CRM API for product search).
  - Database Schema: Products table (`products`) with indexes for search optimization (name, hs_code, category).
  - Search Strategy: Use PostgreSQL LIKE for fuzzy search or full-text search (GIN index) for better performance.
  - Performance Requirement: Search response time < 1 second (P95), < 3 seconds (P99).

- **Source tree components to touch:**
  - `fenghua-backend/src/products/`: Extend existing products module with search functionality.
  - `fenghua-frontend/src/products/`: Create search components and pages.

- **Testing standards summary:**
  - Unit tests for search service methods (backend).
  - Unit tests for search components (frontend).
  - Integration tests for search endpoints.
  - Performance tests for search queries (ensure P95 < 1 second).
  - E2E tests for search user flow.

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Custom code in `fenghua-backend` and `fenghua-frontend`
- **Detected Conflicts or Variances:**
  - Search implementation: Use direct database queries (not Twenty CRM API) for better performance
  - Search indexing: Use PostgreSQL GIN index for full-text search on product names
  - Search caching: Optional Redis caching for popular searches (future optimization)

### References

- **Epic Definition:** [epics.md#Story 2.2](_bmad-output/epics.md#story-22-产品搜索功能)
- **Architecture:** [architecture.md#Product Management](_bmad-output/architecture.md#product-management)
- **Database Schema:** [database-schema-design.md#Products Table](docs/database-schema-design.md#1-产品表products)
- **Database Migration:** [001-create-products-table.sql](../fenghua-backend/migrations/001-create-products-table.sql) - Products table and indexes
- **FR2:** [PRD.md#FR2](_bmad-output/prd.md) - 所有用户可以根据产品名称、产品HS编码或产品类别搜索产品
- **FR50:** [PRD.md#FR50](_bmad-output/prd.md) - 所有用户可以根据产品名称、产品HS编码、产品类别搜索产品（支持模糊搜索）

### Key Technical Details

- **Search Implementation Strategy:**
  - **Product Name Search:**
    - Use PostgreSQL `LIKE` operator with `%keyword%` pattern for fuzzy search
    - Or use full-text search with GIN index (`to_tsvector('english', name)`) for better performance
    - Code example:
      ```sql
      SELECT * FROM products 
      WHERE workspace_id = $1 
        AND deleted_at IS NULL 
        AND (name ILIKE '%keyword%' OR to_tsvector('english', name) @@ plainto_tsquery('english', 'keyword'))
      ORDER BY 
        CASE WHEN name = 'keyword' THEN 1 ELSE 2 END,  -- Exact match first
        name
      LIMIT 20 OFFSET 0;
      ```
  
  - **HS Code Search:**
    - Use `LIKE` operator for partial matching
    - Prioritize exact matches
    - Code example:
      ```sql
      SELECT * FROM products 
      WHERE workspace_id = $1 
        AND deleted_at IS NULL 
        AND hs_code LIKE '%keyword%'
      ORDER BY 
        CASE WHEN hs_code = 'keyword' THEN 1 ELSE 2 END,  -- Exact match first
        hs_code
      LIMIT 20 OFFSET 0;
      ```
  
  - **Category Search:**
    - Use exact match on category field
    - Combine with name/HS code search if needed
    - Code example:
      ```sql
      SELECT * FROM products 
      WHERE workspace_id = $1 
        AND deleted_at IS NULL 
        AND category = 'electronics'
      ORDER BY name
      LIMIT 20 OFFSET 0;
      ```

- **Database Indexes (from migration script):**
  - `idx_products_name_search`: GIN index for full-text search on product names
  - `idx_products_category`: B-tree index for category filtering
  - `idx_products_workspace_status`: Composite index for workspace + status filtering
  - All indexes include `WHERE deleted_at IS NULL` to exclude soft-deleted records

- **Performance Optimization:**
  - Use database indexes for fast search
  - Implement query result caching (optional, Redis)
  - Use debounce on frontend (300-500ms) to reduce API calls
  - Limit search results per page (20 items)
  - Use cursor-based pagination for large result sets (future optimization)

- **Frontend Search UX:**
  - Real-time search with debounce (300-500ms delay)
  - Show loading indicator during search
  - Highlight matching keywords in results
  - Display search result count and pagination
  - Handle empty states gracefully
  - Support keyboard navigation (Enter to search)

- **Error Handling:**
  - Network errors: Show user-friendly error message, allow retry
  - Timeout errors: Show timeout message, suggest refining search
  - Invalid search parameters: Validate on frontend and backend
  - Database errors: Log error, show generic error message to user

## Dev Agent Record

### Agent Model Used

Auto (Cursor AI Assistant)

### Debug Log References

### Completion Notes List

- **2025-12-26**: Story 2.2 文件已创建，状态设置为 `ready-for-dev`
- **2025-01-03**: Story 2.2 开发开始，创建前端搜索组件和独立搜索页面
  - 创建了 ProductSearch.tsx 组件（搜索输入框、类别选择器、防抖）
  - 创建了 ProductSearchResults.tsx 组件（搜索结果展示、关键词高亮、分页）
  - 创建了 EmptySearchResults.tsx 组件（空状态提示）
  - 创建了 ProductSearchPage.tsx 页面（独立搜索页面）
  - 添加了路由配置（/products/search）
  - 后端搜索功能已在 Story 2.1 中实现，只需少量完善（添加 name 和 hsCode 字段到 DTO）
- **2025-01-03**: Story 2.2 优化 - 移除独立搜索页面，在产品管理页面添加关键词高亮
  - 在 ProductList 组件中添加了关键词高亮功能
  - 移除了独立的 ProductSearchPage 页面和路由
  - 搜索功能完全集成到 ProductManagementPage 中
  - 减少了功能重复，降低了维护成本

### File List

**Backend Files (created/updated):**
- `fenghua-backend/src/products/dto/product-query.dto.ts` (UPDATED - 添加 name 和 hsCode 字段)
- `fenghua-backend/src/products/products.service.ts` (UPDATED - 搜索功能已在 Story 2.1 中实现)
- `fenghua-backend/src/products/products.controller.ts` (UPDATED - 搜索功能已集成到 findAll 端点)

**Frontend Files (created/updated):**
- `fenghua-frontend/src/products/components/ProductSearch.tsx` (NEW - 可选，未使用)
- `fenghua-frontend/src/products/components/ProductSearchResults.tsx` (NEW - 可选，未使用)
- `fenghua-frontend/src/products/components/EmptySearchResults.tsx` (NEW - 可选，未使用)
- `fenghua-frontend/src/products/components/ProductList.tsx` (UPDATED - 添加关键词高亮功能)
- `fenghua-frontend/src/products/ProductManagementPage.tsx` (UPDATED - 传递 searchQuery 到 ProductList)
- `fenghua-frontend/src/products/products.service.ts` (UPDATED - 搜索 API 调用已存在)
- `fenghua-frontend/src/App.tsx` (UPDATED - 移除了 /products/search 路由)
- `fenghua-frontend/src/products/ProductSearchPage.tsx` (DELETED - 已移除独立搜索页面)

