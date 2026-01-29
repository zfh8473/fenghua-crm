/**
 * ContactName Component
 * 
 * Displays contact person name with icon
 * All custom code is proprietary and not open source.
 */

import React from 'react';

interface ContactNameProps {
  personName?: string;
  className?: string;
}

// User icon SVG (Heroicons style)
const userIcon = (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

export const ContactName: React.FC<ContactNameProps> = ({ personName, className = '' }) => {
  if (!personName) {
    return null;
  }
  
  return (
    <div className={`flex items-center gap-monday-1 ${className}`}>
      <span className="text-uipro-secondary flex-shrink-0">{userIcon}</span>
      <span className="text-monday-sm text-uipro-text">{personName}</span>
    </div>
  );
};
