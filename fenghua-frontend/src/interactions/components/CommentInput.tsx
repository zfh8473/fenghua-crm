/**
 * Comment Input Component
 * 
 * Input form for creating new comments
 * All custom code is proprietary and not open source.
 */

import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';

export interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  onError?: (error: Error) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  onSubmit,
  onError,
  disabled = false,
  placeholder = '添加评论...',
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate content
    if (!content.trim()) {
      setError('评论内容不能为空');
      return;
    }

    if (content.length > 5000) {
      setError('评论内容不能超过5000个字符');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(content.trim());
      setContent(''); // Clear input on success
    } catch (err) {
      const error = err instanceof Error ? err : new Error('提交评论失败');
      setError(error.message);
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (error) {
      setError(null); // Clear error when user starts typing
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div>
        <label htmlFor="comment-content" className="block text-monday-sm font-medium text-uipro-text mb-monday-1">
          评论
        </label>
        <textarea
          id="comment-content"
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-uipro-cta/50 focus:border-uipro-cta disabled:bg-gray-100 disabled:cursor-not-allowed resize-none transition-colors duration-200"
          aria-invalid={!!error}
          aria-describedby={error ? 'comment-error' : undefined}
        />
        {error && (
          <p id="comment-error" className="mt-1 text-sm text-semantic-error" role="alert">{error}</p>
        )}
        <div className="mt-1 flex justify-between items-center">
          <span className="text-xs text-uipro-secondary">{content.length}/5000 字符</span>
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={disabled || isSubmitting || !content.trim()}
          variant="primary"
        >
          {isSubmitting ? '提交中...' : '提交评论'}
        </Button>
      </div>
    </form>
  );
};
