/**
 * EmptyState Component
 *
 * Generic empty state component for use across modules.
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: 'search' | 'folder' | 'users' | 'cube';
  title: string;
  description?: string;
  suggestions?: string[];
  primaryAction?: { label: string; onClick?: () => void; to?: string };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}

const icons: Record<NonNullable<EmptyStateProps['icon']>, React.ReactNode> = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
      <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
      <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
      <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
  cube: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
      <path d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
};

const lightbulbIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 01-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 013.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 013.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 01-3.09 3.09z" />
  </svg>
);

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'search',
  title,
  description,
  suggestions,
  primaryAction,
  secondaryAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-monday-16 px-monday-4 ${className}`}>
      <div className="text-center max-w-md">
        <div className="text-uipro-secondary/50 mb-monday-6 flex justify-center">
          {icons[icon]}
        </div>

        <h3 className="text-monday-xl font-semibold text-uipro-text mb-monday-2">
          {title}
        </h3>

        {description && (
          <p className="text-monday-base text-uipro-secondary mb-monday-4">
            {description}
          </p>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="bg-monday-bg rounded-monday-md p-monday-4 mb-monday-6">
            <div className="flex items-center gap-monday-2 mb-monday-2">
              <span className="text-uipro-secondary">{lightbulbIcon}</span>
              <p className="text-monday-sm font-semibold text-uipro-text">搜索建议：</p>
            </div>
            <ul className="text-monday-sm text-uipro-secondary space-y-monday-1 text-left list-disc list-inside">
              {suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-monday-3 justify-center">
            {secondaryAction && (
              <Button
                variant="ghost"
                size="md"
                onClick={secondaryAction.onClick}
                className="text-uipro-secondary hover:text-uipro-text"
              >
                {secondaryAction.label}
              </Button>
            )}
            {primaryAction && (
              primaryAction.to ? (
                <Link to={primaryAction.to}>
                  <Button variant="primary" size="md">
                    {primaryAction.label}
                  </Button>
                </Link>
              ) : (
                <Button variant="primary" size="md" onClick={primaryAction.onClick}>
                  {primaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};
