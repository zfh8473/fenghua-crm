/**
 * EmptyState Component
 * 
 * Displays empty state when no interaction records found
 * Uses SVG icons (Heroicons style), no emoji
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

interface EmptyStateProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  className?: string;
}

// Search icon SVG (Heroicons style)
const searchIcon = (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-16 h-16"
  >
    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

// Lightbulb icon SVG (Heroicons style - suggestions)
const lightbulbIcon = (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 013.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 01-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
  </svg>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  searchQuery,
  onClearSearch,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-monday-16 px-monday-4 ${className}`}>
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="text-uipro-secondary/50 mb-monday-6 flex justify-center">
          {searchIcon}
        </div>

        {/* Message */}
        <h3 className="text-monday-xl font-semibold text-uipro-text mb-monday-2">
          未找到匹配的互动记录
        </h3>

        <p className="text-monday-base text-uipro-secondary mb-monday-4">
          {searchQuery ? (
            <>
              没有找到与 "<span className="font-semibold text-uipro-text">{searchQuery}</span>" 匹配的互动记录
            </>
          ) : (
            '请尝试使用不同的搜索关键词或筛选条件'
          )}
        </p>

        {/* Suggestions */}
        <div className="bg-monday-bg rounded-monday-md p-monday-4 mb-monday-6">
          <div className="flex items-center gap-monday-2 mb-monday-2">
            <span className="text-uipro-secondary">{lightbulbIcon}</span>
            <p className="text-monday-sm font-semibold text-uipro-text">
              搜索建议：
            </p>
          </div>
          <ul className="text-monday-sm text-uipro-secondary space-y-monday-1 text-left list-disc list-inside">
            <li>检查拼写是否正确</li>
            <li>尝试使用更通用的关键词</li>
            <li>使用客户名称、产品名称或互动内容搜索</li>
            <li>尝试选择不同的筛选条件</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-monday-3 justify-center">
          {onClearSearch && searchQuery && (
            <Button
              variant="ghost"
              size="md"
              onClick={onClearSearch}
              className="text-uipro-secondary hover:text-uipro-text"
            >
              清除搜索条件
            </Button>
          )}
          <Link to="/interactions/create">
            <Button variant="primary" size="md">
              记录新互动
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
