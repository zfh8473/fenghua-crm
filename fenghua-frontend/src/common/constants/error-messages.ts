/**
 * Error Messages Constants
 * 
 * Centralized error messages for consistent error handling across the application
 * All custom code is proprietary and not open source.
 */

/**
 * Customer-related error messages
 */
export const CUSTOMER_ERRORS = {
  INVALID_ID: '无效的客户ID',
  NOT_FOUND: '客户不存在',
  NO_PERMISSION: '您没有权限查看该客户',
  LOAD_FAILED: '加载客户信息失败',
  CREATE_FAILED: '创建客户失败',
  UPDATE_FAILED: '更新客户失败',
  DELETE_FAILED: '删除客户失败',
} as const;

/**
 * Timeline-related error messages
 */
export const TIMELINE_ERRORS = {
  NO_PERMISSION: '您没有权限查看时间线',
  NOT_FOUND: '客户不存在',
  LOAD_FAILED: '获取时间线失败',
  GENERIC_LOAD_FAILED: '加载失败',
} as const;

/**
 * Photo preview error messages
 */
export const PHOTO_PREVIEW_ERRORS = {
  LOAD_FAILED: '照片预览加载失败',
  IMAGE_LOAD_FAILED: '图片加载失败',
} as const;

/**
 * Product interaction error messages
 */
export const PRODUCT_INTERACTION_ERRORS = {
  NO_PERMISSION: '您没有权限查看互动历史',
  NOT_FOUND: '产品或客户不存在',
  LOAD_FAILED: '获取互动历史失败',
  GENERIC_LOAD_FAILED: '加载失败',
  NO_INTERACTIONS: '该产品与该客户尚未有任何互动记录',
  NO_INTERACTIONS_IN_STAGE: '该阶段尚未有任何互动记录',
  INVALID_ID: '无效的产品或客户ID',
} as const;

/**
 * Customer product interaction error messages
 * (Reuses PRODUCT_INTERACTION_ERRORS but with different NO_INTERACTIONS message)
 */
export const CUSTOMER_PRODUCT_INTERACTION_ERRORS = {
  ...PRODUCT_INTERACTION_ERRORS,
  NO_INTERACTIONS: '该客户与该产品尚未有任何互动记录',
} as const;

/**
 * Interaction edit and delete error messages
 */
export const INTERACTION_EDIT_ERRORS = {
  NO_PERMISSION: '您只能编辑/删除自己创建的互动记录',
  NOT_FOUND: '互动记录不存在或已被删除',
  UPDATE_FAILED: '更新互动记录失败',
  DELETE_FAILED: '删除互动记录失败',
  LOAD_FAILED: '加载互动记录失败',
  INVALID_ID: '无效的互动记录ID',
  FUTURE_DATE_ERROR: '互动时间不能是未来时间',
} as const;

/**
 * Generic error messages
 */
export const GENERIC_ERRORS = {
  LOAD_FAILED: '加载失败',
  OPERATION_FAILED: '操作失败',
  NETWORK_ERROR: '网络连接错误，请稍后重试',
  UNKNOWN_ERROR: '发生未知错误',
  RETRY: '重试',
} as const;

/**
 * HTTP status code to error message mapping
 */
export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: '请求参数错误',
  401: '未授权，请重新登录',
  403: '您没有权限执行此操作',
  404: '资源不存在',
  500: '服务器内部错误',
  503: '服务暂时不可用，请稍后重试',
} as const;

/**
 * Get error message for HTTP status code
 * 
 * @param status - HTTP status code
 * @param defaultMessage - Default message if status code not found
 * @returns Error message string
 */
export const getHttpErrorMessage = (status: number, defaultMessage?: string): string => {
  return HTTP_ERROR_MESSAGES[status] || defaultMessage || GENERIC_ERRORS.OPERATION_FAILED;
};

/**
 * Product creation and association error messages
 */
export const PRODUCT_CREATE_SUCCESS = '产品创建成功';

/**
 * Product creation with associations success message
 * 
 * @param count - Number of associations created
 * @returns Success message string
 */
export const PRODUCT_CREATE_WITH_ASSOCIATIONS_SUCCESS = (count: number): string =>
  `产品创建成功，已关联 ${count} 个客户`;/**
 * Product creation with partial association failures
 * 
 * @param successCount - Number of successful associations
 * @param failureCount - Number of failed associations
 * @returns Warning message string
 */
export const PRODUCT_CREATE_ASSOCIATIONS_PARTIAL_FAILURE = (
  successCount: number,
  failureCount: number,
): string =>
  `产品已创建，但部分客户关联失败（成功：${successCount}，失败：${failureCount}）`;export const PRODUCT_CREATE_ASSOCIATIONS_ALL_FAILURE = '产品已创建，但所有客户关联失败';

/**
 * Association creation failed message
 * 
 * @param error - Error message
 * @returns Error message string
 */
export const ASSOCIATION_CREATE_FAILED = (error: string): string => `创建关联失败：${error}`;

export const MANAGE_ASSOCIATIONS_IN_DETAIL = '在详情页管理关联';

/**
 * Customer creation and association error messages
 */
export const CUSTOMER_CREATE_SUCCESS = '客户创建成功';

/**
 * Customer creation with associations success message
 *
 * @param count - Number of associations created
 * @returns Success message string
 */
export const CUSTOMER_CREATE_WITH_ASSOCIATIONS_SUCCESS = (count: number): string =>
  `客户创建成功，已关联 ${count} 个产品`;

/**
 * Customer creation with partial association failures
 *
 * @param successCount - Number of successful associations
 * @param failureCount - Number of failed associations
 * @returns Warning message string
 */
export const CUSTOMER_CREATE_ASSOCIATIONS_PARTIAL_FAILURE = (
  successCount: number,
  failureCount: number,
): string =>
  `客户已创建，但部分产品关联失败（成功：${successCount}，失败：${failureCount}）`;

export const CUSTOMER_CREATE_ASSOCIATIONS_ALL_FAILURE = '客户已创建，但所有产品关联失败';

/**
 * Association management error messages
 */
export const ASSOCIATION_CREATE_SUCCESS = '关联已建立';

export const ASSOCIATION_DELETE_SUCCESS = '关联已删除';

/**
 * Association delete failed message
 * 
 * @param error - Error message
 * @returns Error message string
 */
export const ASSOCIATION_DELETE_FAILED = (error: string): string => `删除关联失败：${error}`;

export const ASSOCIATION_ALREADY_EXISTS = '该关联关系已存在';

export const ASSOCIATION_NOT_FOUND = '关联关系不存在';

export const ASSOCIATION_DELETE_CONFIRM = '确定要删除此关联吗？';

export const ASSOCIATION_DELETE_CONFIRM_MESSAGE = '删除关联不会影响已有的互动记录';

export const ASSOCIATION_NO_PERMISSION_CREATE = '您没有权限创建此关联';

export const ASSOCIATION_NO_PERMISSION_DELETE = '您没有权限删除此关联';

export const ASSOCIATION_PRODUCT_NOT_FOUND = '产品不存在';

export const ASSOCIATION_CUSTOMER_NOT_FOUND = '客户不存在';
