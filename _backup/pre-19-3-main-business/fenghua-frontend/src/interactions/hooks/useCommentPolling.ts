/**
 * Comment Polling Hook
 * 
 * Handles real-time polling for new comments on interaction records
 * All custom code is proprietary and not open source.
 */

import { useEffect, useRef, useCallback } from 'react';
import { commentService, Comment } from '../services/comment.service';

interface UseCommentPollingOptions {
  interactionId: string;
  currentComments: Comment[];
  onNewComments: (newComments: Comment[]) => void;
  onError?: (error: Error) => void;
  interval?: number; // Default: 5000ms
  enabled?: boolean; // Default: true
}

/**
 * Hook for polling new comments on an interaction record
 * 
 * Features:
 * - Automatic polling with configurable interval
 * - Page visibility detection (pauses when page is hidden)
 * - New comment detection using timestamp and ID comparison
 * - Exponential backoff retry mechanism
 * - Consecutive error handling
 */
export const useCommentPolling = ({
  interactionId,
  currentComments,
  onNewComments,
  onError,
  interval = 5000,
  enabled = true,
}: UseCommentPollingOptions) => {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCheckTimeRef = useRef<Date>(new Date());
  const retryCountRef = useRef<number>(0);
  const consecutiveErrorsRef = useRef<number>(0);
  // Use ref to store current comments to avoid dependency on currentComments in useEffect
  const currentCommentsRef = useRef<Comment[]>(currentComments);
  const MAX_CONSECUTIVE_ERRORS = 3;
  const MAX_RETRIES = 3;
  const BASE_RETRY_DELAY = 1000; // 1 second

  // Update ref when currentComments changes (without triggering useEffect)
  useEffect(() => {
    currentCommentsRef.current = currentComments;
    // Update last check time when comments are first loaded or updated
    if (currentComments.length > 0) {
      const latestComment = currentComments[0];
      if (latestComment?.createdAt) {
        lastCheckTimeRef.current = new Date(latestComment.createdAt);
      }
    }
  }, [currentComments]);

  /**
   * Detect new comments by comparing timestamps and IDs
   * 
   * Algorithm:
   * 1. Compare fetched comments' createdAt with latest current comment time
   * 2. Filter out duplicates using comment ID Set (handles clock skew)
   * 3. Return only truly new comments
   */
  const detectNewComments = useCallback((fetchedComments: Comment[]): Comment[] => {
    const currentComments = currentCommentsRef.current;
    if (currentComments.length === 0) {
      return fetchedComments;
    }

    // Get the latest comment timestamp from current list
    const latestCurrentTime = currentComments[0]?.createdAt 
      ? new Date(currentComments[0].createdAt).getTime()
      : 0;

    // Filter comments that are newer than the latest current comment
    const newComments = fetchedComments.filter((comment) => {
      const commentTime = new Date(comment.createdAt).getTime();
      return commentTime > latestCurrentTime;
    });

    // Also check by ID to avoid duplicates (in case of clock skew)
    const currentCommentIds = new Set(currentComments.map((c) => c.id));
    return newComments.filter((comment) => !currentCommentIds.has(comment.id));
  }, []);

  /**
   * Check for new comments with exponential backoff retry
   */
  const checkNewComments = useCallback(async (retryCount = 0): Promise<void> => {
    if (!enabled || document.hidden) return;

    try {
      // Use 'since' parameter to fetch only new comments
      const since = lastCheckTimeRef.current.toISOString();
      const response = await commentService.getComments(interactionId, 1, 20, since);
      
      // Detect new comments
      const newComments = detectNewComments(response.data);
      
      if (newComments.length > 0) {
        // Update last check time to the latest comment's time
        const latestTime = newComments[0]?.createdAt 
          ? new Date(newComments[0].createdAt)
          : new Date();
        lastCheckTimeRef.current = latestTime;
        
        // Notify parent component
        onNewComments(newComments);
      }

      // Reset error counters on success
      retryCountRef.current = 0;
      consecutiveErrorsRef.current = 0;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('检查新评论失败');
      
      // Exponential backoff retry
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY * Math.pow(2, retryCount);
        retryCountRef.current = retryCount + 1;
        
        // Clear any existing timeout before setting a new one
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          checkNewComments(retryCount + 1);
        }, delay);
        return;
      }

      // Track consecutive errors
      consecutiveErrorsRef.current += 1;
      
      if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
        // Stop polling after too many consecutive errors
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (onError) {
          onError(new Error('连续多次检查失败，已暂停自动更新'));
        }
      } else if (onError) {
        onError(err);
      }
    }
  }, [interactionId, enabled, detectNewComments, onNewComments, onError]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause polling when page is hidden
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Resume polling when page becomes visible
        if (!intervalRef.current) {
          // Immediate check when page becomes visible
          checkNewComments();
          // Then set up interval
          intervalRef.current = setInterval(() => {
            checkNewComments();
          }, interval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initial check
    checkNewComments();

    // Set up polling interval
    if (!document.hidden) {
      intervalRef.current = setInterval(() => {
        checkNewComments();
      }, interval);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Clear any pending timeout to prevent memory leaks
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [interactionId, enabled, interval, checkNewComments]);
};
