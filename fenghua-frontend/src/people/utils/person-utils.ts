/**
 * Person Utility Functions
 * 
 * Shared utility functions for person (contact) operations
 * All custom code is proprietary and not open source.
 */

import { Person } from '../people.service';
import { ContactMethodType } from './contact-protocols';

/**
 * Get person display name
 * 
 * Formats person's first and last name into a display string.
 * Returns "未命名联系人" if both names are empty.
 * 
 * @param person - Person object
 * @returns Formatted person name string
 */
export const getPersonName = (person: Person): string => {
  const firstName = person.firstName || '';
  const lastName = person.lastName || '';
  const name = `${firstName} ${lastName}`.trim();
  return name || '未命名联系人';
};

/**
 * Get primary contact method from person with priority
 * 
 * Priority order: mobile > email > phone > whatsapp > wechat > linkedin > facebook
 * Returns the first available contact method based on priority.
 * 
 * @param person - Person object
 * @returns Primary contact method type or null if no contact method available
 */
export const getPrimaryContactMethod = (person: Person): ContactMethodType | null => {
  if (person.mobile) return 'mobile';
  if (person.email) return 'email';
  if (person.phone) return 'phone';
  if (person.whatsapp) return 'whatsapp';
  if (person.wechat) return 'wechat';
  if (person.linkedinUrl) return 'linkedin';
  if (person.facebook) return 'facebook';
  return null;
};

/**
 * Get person initials for avatar
 * 
 * Returns the first letter of firstName and lastName, or first two letters of the name.
 * 
 * @param person - Person object
 * @returns Initials string (1-2 characters)
 */
export const getPersonInitials = (person: Person): string => {
  const firstName = person.firstName || '';
  const lastName = person.lastName || '';
  
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  const name = firstName || lastName || '未命名联系人';
  return name.substring(0, 2).toUpperCase();
};

/**
 * Generate a stable color for a person based on their ID
 * 
 * Uses a simple hash function to generate a consistent color for the same person ID.
 * Returns a hex color code from a limited palette (blue and purple color schemes only).
 * 
 * @param personId - Person ID (UUID)
 * @returns Hex color code (e.g., '#0369A1')
 */
export const getPersonAvatarColor = (personId: string): string => {
  // Limited color palette (2 color schemes for consistency)
  // Blue shades and Purple shades only
  const colors = [
    '#0369A1', // Blue (primary)
    '#0284C7', // Sky Blue
    '#0EA5E9', // Light Blue
    '#1E40AF', // Indigo Blue
    '#7C3AED', // Purple (primary)
    '#8B5CF6', // Violet
    '#A78BFA', // Light Purple
    '#C084FC', // Lavender
  ];
  
  // Simple hash function to convert UUID to index
  let hash = 0;
  for (let i = 0; i < personId.length; i++) {
    hash = ((hash << 5) - hash) + personId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

/**
 * Format relative time for contact history
 * 
 * Formats a date as relative time (e.g., "3天前联系", "今天联系").
 * Adapted from CommentItem.tsx formatRelativeTime function.
 * 
 * @param date - Date string (ISO 8601) or null
 * @returns Formatted relative time string
 */
export const formatRelativeTime = (date: string | null): string => {
  if (!date) return '从未联系';
  
  const now = new Date();
  const contactDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - contactDate.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  
  // Handle future dates (data error case)
  if (diffDays < 0) {
    return '未来时间';
  }
  
  if (diffDays === 0) return '今天联系';
  if (diffDays === 1) return '1天前联系';
  return `${diffDays}天前联系`;
};
