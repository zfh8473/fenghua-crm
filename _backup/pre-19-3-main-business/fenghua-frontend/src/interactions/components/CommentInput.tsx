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
        <textarea
          value={content}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        <div className="mt-1 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {content.length}/5000 字符
          </span>
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
