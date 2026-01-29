/**
 * RelativeTime Component Tests
 * 
 * Unit tests for RelativeTime component
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RelativeTime } from './RelativeTime';

describe('RelativeTime', () => {
  it('should display "刚刚" for dates less than 1 minute ago', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
    
    render(<RelativeTime date={date} />);
    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });

  it('should display "X分钟前" for dates less than 1 hour ago', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    
    render(<RelativeTime date={date} />);
    expect(screen.getByText('30分钟前')).toBeInTheDocument();
  });

  it('should display "X小时前" for dates less than 24 hours ago', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    
    render(<RelativeTime date={date} />);
    expect(screen.getByText('2小时前')).toBeInTheDocument();
  });

  it('should display "昨天" for dates 1 day ago', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
    
    render(<RelativeTime date={date} />);
    expect(screen.getByText('昨天')).toBeInTheDocument();
  });

  it('should display "X天前" for dates 2-6 days ago', () => {
    const now = new Date();
    const date = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    
    render(<RelativeTime date={date} />);
    expect(screen.getByText('3天前')).toBeInTheDocument();
  });

  it('should display full date for dates older than 7 days', () => {
    const date = new Date('2024-01-01');
    
    render(<RelativeTime date={date} />);
    // Should display formatted date in Chinese
    const formattedDate = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  it('should handle string dates', () => {
    const date = new Date();
    const dateString = date.toISOString();
    
    render(<RelativeTime date={dateString} />);
    expect(screen.getByText('刚刚')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const date = new Date();
    const { container } = render(<RelativeTime date={date} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
