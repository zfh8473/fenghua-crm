/**
 * Comment Item Component
 * 
 * Displays a single comment with author and timestamp
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import DOMPurify from 'dompurify';

export interface CommentItemProps {
  comment: {
    id: string;
    userId: string;
    content: string;
    createdAt: Date | string;
    updatedAt?: Date | string;
    createdBy?: string;
    userEmail?: string;
    userFirstName?: string;
    userLastName?: string;
  };
  currentUserId?: string;
}

/**
 * Format date to relative time (e.g., "2 小时前", "3 天前")
 */
function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const commentDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - commentDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return '刚刚';
  } else if (diffMins < 60) {
    return `${diffMins} 分钟前`;
  } else if (diffHours < 24) {
    return `${diffHours} 小时前`;
  } else if (diffDays < 7) {
    return `${diffDays} 天前`;
  } else {
    // Format as date if older than 7 days
    return commentDate.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

export const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId }) => {
  const isOwner = currentUserId && comment.userId === currentUserId;

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-start space-x-3">
        {/* Avatar placeholder */}
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
            <span className="text-gray-600 text-sm font-medium">
              {(() => {
                if (comment.userFirstName) {
                  return comment.userFirstName.charAt(0).toUpperCase();
                }
                if (comment.userEmail) {
                  return comment.userEmail.charAt(0).toUpperCase();
                }
                return 'U';
              })()}
            </span>
          </div>
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium text-gray-900">
              {(() => {
                if (comment.userFirstName && comment.userLastName) {
                  return `${comment.userFirstName} ${comment.userLastName}`;
                }
                if (comment.userFirstName) {
                  return comment.userFirstName;
                }
                if (comment.userEmail) {
                  return comment.userEmail.split('@')[0];
                }
                return '未知用户';
              })()}
            </span>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          <div 
            className="text-sm text-gray-700 whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(comment.content, {
                ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
                ALLOWED_ATTR: [],
              })
            }}
          />
          {isOwner && (
            <div className="mt-2 flex space-x-2">
              <button
                className="text-xs text-gray-500 hover:text-gray-700"
                onClick={() => {
                  // TODO: Implement edit functionality (Story 10.3)
                  console.log('Edit comment', comment.id);
                }}
              >
                编辑
              </button>
              <button
                className="text-xs text-gray-500 hover:text-red-600"
                onClick={() => {
                  // TODO: Implement delete functionality (Story 10.3)
                  console.log('Delete comment', comment.id);
                }}
              >
                删除
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
