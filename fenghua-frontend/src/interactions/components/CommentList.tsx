/**
 * Comment List Component
 * 
 * Displays a list of comments with pagination support and real-time updates
 * All custom code is proprietary and not open source.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CommentItem, CommentItemProps } from './CommentItem';
import { commentService, Comment } from '../services/comment.service';
import { useCommentPolling } from '../hooks/useCommentPolling';

export interface CommentListProps {
  interactionId: string;
  currentUserId?: string;
}

export const CommentList: React.FC<CommentListProps> = ({
  interactionId,
  currentUserId,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hasNewComments, setHasNewComments] = useState(false);
  const [newCommentCount, setNewCommentCount] = useState(0);
  const [showNewCommentsButton, setShowNewCommentsButton] = useState(false);
  const [pollingError, setPollingError] = useState<string | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const limit = 20;

  const loadComments = useCallback(async (pageNum: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await commentService.getComments(interactionId, pageNum, limit);
      setComments(response.data);
      setTotal(response.total);
      setHasMore(response.data.length === limit && response.total > pageNum * limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载评论失败';
      setError(errorMessage);
      console.error('Failed to load comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [interactionId, limit]);

  useEffect(() => {
    loadComments(page);
  }, [loadComments, page]);

  /**
   * Handle new comments detected by polling
   * Merges new comments into existing list while maintaining scroll position
   */
  const handleNewComments = useCallback((newComments: Comment[]) => {
    if (newComments.length === 0) return;

    // Save current scroll position
    scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;

    setComments((prevComments) => {
      // Create a Set of existing comment IDs for fast lookup
      const existingIds = new Set(prevComments.map((c) => c.id));
      
      // Filter out duplicates and merge
      const uniqueNewComments = newComments.filter((c) => !existingIds.has(c.id));
      
      if (uniqueNewComments.length === 0) {
        return prevComments;
      }

      // Merge: new comments at top, then existing comments
      const merged = [...uniqueNewComments, ...prevComments];
      
      // Sort by createdAt descending (newest first)
      merged.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      // Update total count
      setTotal((prevTotal) => prevTotal + uniqueNewComments.length);
      
      // Show notification if user is not at the top
      setHasNewComments(true);
      setNewCommentCount((prev) => prev + uniqueNewComments.length);

      // Restore scroll position after a brief delay (allowing render to complete)
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: 'auto' // Instant, not smooth
        });
      }, 0);

      return merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Note: Empty dependency array is intentional - setState functions (setComments, setTotal, etc.)
    // are stable and don't need to be in dependencies. The callback only uses these stable functions.
  }, []);

  /**
   * Handle polling errors
   */
  const handlePollingError = useCallback((error: Error) => {
    setPollingError(error.message);
    // Auto-clear error after 5 seconds
    setTimeout(() => setPollingError(null), 5000);
  }, []);

  /**
   * Enable polling only when on first page and comments are loaded
   */
  const pollingEnabled = page === 1 && comments.length > 0 && !isLoading;

  // Use polling hook for real-time updates
  useCommentPolling({
    interactionId,
    currentComments: comments,
    onNewComments: handleNewComments,
    onError: handlePollingError,
    interval: 5000, // 5 seconds
    enabled: pollingEnabled,
  });

  /**
   * Detect if user is scrolled away from top to show "View new comments" button
   */
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setShowNewCommentsButton(scrollTop > 100 && hasNewComments);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasNewComments]);

  /**
   * Scroll to top with smooth animation
   */
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Smooth scroll animation
    });
    setHasNewComments(false);
    setShowNewCommentsButton(false);
    setNewCommentCount(0);
  }, []);

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  };

  if (isLoading && comments.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        加载评论中...
      </div>
    );
  }

  if (error && comments.length === 0) {
    return (
      <div className="py-4 text-center text-red-600">
        {error}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        暂无评论
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* New comments notification button */}
      {showNewCommentsButton && (
        <div className="sticky top-4 z-10 flex justify-center mb-4">
          <button
            onClick={scrollToTop}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
          >
            查看新评论 ({newCommentCount})
          </button>
        </div>
      )}

      {/* Polling error notification */}
      {pollingError && (
        <div className="py-2 text-center text-sm text-yellow-600 bg-yellow-50 rounded mb-2">
          {pollingError}
        </div>
      )}

      {/* Comments list */}
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
        />
      ))}

      {/* Load more button */}
      {hasMore && (
        <div className="py-4 text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            {isLoading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}

      {/* Error message */}
      {error && comments.length > 0 && (
        <div className="py-2 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Comment count display */}
      {total > 0 && (
        <div className="py-2 text-center text-sm text-gray-500">
          共 {total} 条评论
        </div>
      )}
    </div>
  );
};
