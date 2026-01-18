/**
 * Comment Item Component
 * 
 * Displays a single comment with author and timestamp
 * Supports editing and deleting comments (for comment owners)
 * All custom code is proprietary and not open source.
 */

import React, { useState, useEffect, useCallback } from 'react';
import DOMPurify from 'dompurify';
import { commentService } from '../services/comment.service';

export interface CommentItemProps {
  comment: {
    id: string;
    interactionId: string;
    userId: string;
    content: string;
    createdAt: Date | string;
    updatedAt?: Date | string;
    createdBy?: string;
    isEdited?: boolean;
    userEmail?: string;
    userFirstName?: string;
    userLastName?: string;
  };
  currentUserId?: string;
  onCommentUpdated?: () => void;
  onCommentDeleted?: () => void;
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

export const CommentItem: React.FC<CommentItemProps> = ({ 
  comment, 
  currentUserId,
  onCommentUpdated,
  onCommentDeleted,
}) => {
  const isOwner = currentUserId && (comment.userId === currentUserId || comment.createdBy === currentUserId);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // H1 Fix: Sync editContent when comment.content changes (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      setEditContent(comment.content);
    }
  }, [comment.content, isEditing]);

  // M1 Fix: Use useCallback to optimize callback functions
  const handleEdit = useCallback(() => {
    setEditContent(comment.content);
    setIsEditing(true);
    setError(null);
  }, [comment.content]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditContent(comment.content);
    setError(null);
  }, [comment.content]);

  const handleSaveEdit = useCallback(async () => {
    if (!editContent.trim()) {
      setError('评论内容不能为空');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await commentService.updateComment(comment.interactionId, comment.id, editContent.trim());
      setIsEditing(false);
      if (onCommentUpdated) {
        onCommentUpdated();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新评论失败';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [comment.interactionId, comment.id, editContent, onCommentUpdated]);

  const handleDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await commentService.deleteComment(comment.interactionId, comment.id);
      setShowDeleteConfirm(false);
      if (onCommentDeleted) {
        onCommentDeleted();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除评论失败';
      setError(errorMessage);
      setIsDeleting(false);
    }
  }, [comment.interactionId, comment.id, onCommentDeleted]);

  const handleCancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setError(null);
  }, []);

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
            {comment.isEdited && (
              <span className="text-xs text-gray-400 italic">已编辑</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={isSaving}
              />
              {error && (
                <div className="text-xs text-red-600">{error}</div>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editContent.trim()}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <div 
                className="text-sm text-gray-700 whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{ 
                  __html: DOMPurify.sanitize(comment.content, {
                    ALLOWED_TAGS: [], // No HTML tags allowed - plain text only
                    ALLOWED_ATTR: [],
                  })
                }}
              />
              {isOwner && !showDeleteConfirm && (
                <div className="mt-2 flex space-x-2">
                  <button
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={handleEdit}
                  >
                    编辑
                  </button>
                  <button
                    className="text-xs text-gray-500 hover:text-red-600"
                    onClick={handleDelete}
                  >
                    删除
                  </button>
                </div>
              )}
            </>
          )}

          {/* Delete confirmation dialog */}
          {showDeleteConfirm && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-gray-700 mb-3">确定要删除这条评论吗？</p>
              {error && (
                <div className="text-xs text-red-600 mb-2">{error}</div>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isDeleting ? '删除中...' : '确定'}
                </button>
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  取消
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
