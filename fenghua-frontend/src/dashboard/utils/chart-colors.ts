/**
 * 图表系列色（Epic 19 / dashboard-analytics.md）
 * 从 uipro-*、semantic-* 选取，避免 MASTER 禁止的紫/粉渐变。
 */
export const CHART_COLORS = [
  '#0F172A', // uipro-primary
  '#334155', // uipro-secondary
  '#0369A1', // uipro-cta
  '#00A862', // semantic-success
  '#D97706', // semantic-warning
] as const;

/** 语义色（用于流失、错误、成功等） */
export const CHART_SEMANTIC = {
  error: '#FF3838',
  success: '#00A862',
  warning: '#D97706',
} as const;
