/**
 * CreatorInfo Component
 * 
 * Displays creator avatar and name with improved visual design
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { User } from '../../../users/users.service';

interface CreatorInfoProps {
  creatorId: string;
  creatorName?: string;
  creator?: User;
  className?: string;
}

/**
 * Get user initials for avatar
 */
const getUserInitials = (user: User | undefined, creatorName?: string): string => {
  if (user) {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName.charAt(0).toUpperCase();
    }
    if (user.lastName) {
      return user.lastName.charAt(0).toUpperCase();
    }
  }
  
  if (creatorName) {
    return creatorName.substring(0, 2).toUpperCase();
  }
  
  // Fallback to email first letter
  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }
  
  return 'U';
};

/**
 * Generate a stable color for a user based on their ID
 * Using a more refined color palette for better visual appeal
 */
const getUserAvatarColor = (userId: string): string => {
  // Simple hash function to generate consistent color
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Refined color palette - professional and modern
  const colors = [
    '#0369A1', // blue-700 - primary brand color
    '#1E40AF', // blue-800
    '#7C3AED', // violet-600
    '#059669', // emerald-600
    '#DC2626', // red-600
    '#EA580C', // orange-600
    '#CA8A04', // yellow-600
    '#0891B2', // cyan-600
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

export const CreatorInfo: React.FC<CreatorInfoProps> = ({ 
  creatorId, 
  creatorName, 
  creator,
  className = '' 
}) => {
  const initials = getUserInitials(creator, creatorName);
  const bgColor = getUserAvatarColor(creatorId);
  const displayName = creatorName || 
    (creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.email : '未知用户');
  
  return (
    <div className={`flex items-center gap-monday-3 ${className}`}>
      {/* Avatar with improved styling - larger with border and shadow */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-monday-sm font-semibold flex-shrink-0 shadow-md border-2 border-gray-100 ring-1 ring-gray-200/50"
        style={{ backgroundColor: bgColor }}
        aria-label={`${displayName} 的头像`}
      >
        {initials}
      </div>
      
      {/* Creator name - elegant typography */}
      <span className="text-monday-base text-gray-700 font-medium tracking-wide truncate leading-tight">
        {displayName}
      </span>
    </div>
  );
};
