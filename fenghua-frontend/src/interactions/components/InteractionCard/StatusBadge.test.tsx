/**
 * StatusBadge Component Tests
 * 
 * Unit tests for StatusBadge component
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';
import { InteractionStatus } from '../../services/interactions.service';

describe('StatusBadge', () => {
  it('should render status label in Chinese', () => {
    render(<StatusBadge status={InteractionStatus.COMPLETED} />);
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });

  it('should display "未知" when status is undefined', () => {
    render(<StatusBadge />);
    expect(screen.getByText('未知')).toBeInTheDocument();
  });

  it('should apply correct color classes for completed status', () => {
    const { container } = render(<StatusBadge status={InteractionStatus.COMPLETED} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-semantic-success/15');
    expect(badge).toHaveClass('text-semantic-success');
  });

  it('should apply correct color classes for in_progress status', () => {
    const { container } = render(<StatusBadge status={InteractionStatus.IN_PROGRESS} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-uipro-cta/15');
    expect(badge).toHaveClass('text-uipro-cta');
  });

  it('should apply correct color classes for needs_follow_up status', () => {
    const { container } = render(<StatusBadge status={InteractionStatus.NEEDS_FOLLOW_UP} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-semantic-warning/15');
    expect(badge).toHaveClass('text-semantic-warning');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <StatusBadge status={InteractionStatus.COMPLETED} className="custom-class" />
    );
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('custom-class');
  });
});
