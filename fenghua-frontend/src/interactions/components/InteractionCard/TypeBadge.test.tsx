/**
 * TypeBadge Component Tests
 * 
 * Unit tests for TypeBadge component
 * All custom code is proprietary and not open source.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeBadge } from './TypeBadge';
import { FrontendInteractionType } from '../../services/interactions.service';

describe('TypeBadge', () => {
  it('should render interaction type label', () => {
    render(<TypeBadge type={FrontendInteractionType.INITIAL_CONTACT} />);
    expect(screen.getByText('初步接触')).toBeInTheDocument();
  });

  it('should apply correct color classes for initial contact types', () => {
    const { container } = render(<TypeBadge type={FrontendInteractionType.INITIAL_CONTACT} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-uipro-cta/15');
    expect(badge).toHaveClass('text-uipro-cta');
  });

  it('should apply correct color classes for discussion types', () => {
    const { container } = render(<TypeBadge type={FrontendInteractionType.PRODUCT_DEMO} />);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-uipro-secondary/15');
    expect(badge).toHaveClass('text-uipro-secondary');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <TypeBadge type={FrontendInteractionType.INITIAL_CONTACT} className="custom-class" />
    );
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('custom-class');
  });
});
