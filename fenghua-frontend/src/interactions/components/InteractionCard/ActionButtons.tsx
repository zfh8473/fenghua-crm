/**
 * ActionButtons Component
 * 
 * Displays action buttons (View, Edit) with prominent styling for better visibility.
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface ActionButtonsProps {
  interactionId: string;
  onView?: () => void;
  onEdit?: () => void;
  className?: string;
}

// Eye icon SVG (Heroicons style - view) - Larger size for better visibility
const eyeIcon = (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// Pencil icon SVG (Heroicons style - edit) - Larger size for better visibility
const pencilIcon = (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-5 h-5"
  >
    <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
  </svg>
);

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  interactionId, 
  onView,
  onEdit,
  className = '' 
}) => {
  return (
    <div
      className={`flex items-center gap-monday-2 ${className}`}
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="操作按钮"
    >
      {/* View button - More prominent with primary color and background */}
      <Link
        to={`/interactions/${interactionId}`}
        onClick={onView}
        className="p-monday-2 text-[#0369A1] bg-[#0369A1]/10 hover:bg-[#0369A1]/20 hover:text-[#025a8a] border border-[#0369A1]/30 hover:border-[#0369A1]/50 rounded-monday-md transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
        aria-label="查看"
        title="查看详情"
      >
        {eyeIcon}
      </Link>
      {/* Edit button - More prominent with secondary color and background */}
      <Link
        to={`/interactions/${interactionId}/edit`}
        onClick={onEdit}
        className="p-monday-2 text-[#0369A1] bg-[#0369A1]/10 hover:bg-[#0369A1]/20 hover:text-[#025a8a] border border-[#0369A1]/30 hover:border-[#0369A1]/50 rounded-monday-md transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md"
        aria-label="编辑"
        title="编辑记录"
      >
        {pencilIcon}
      </Link>
    </div>
  );
};
