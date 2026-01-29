/**
 * InteractionCard Component
 * 
 * Displays a single interaction record as a card
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Interaction } from '../services/interactions.service';
import { Card } from '../../components/ui/Card';
import { TypeBadge } from './InteractionCard/TypeBadge';
import { StatusBadge } from './InteractionCard/StatusBadge';
import { DateTime } from './InteractionCard/DateTime';
import { RelativeTime } from './InteractionCard/RelativeTime';
import { CustomerLink } from './InteractionCard/CustomerLink';
import { ContactName } from './InteractionCard/ContactName';
import { ProductTags } from './InteractionCard/ProductTags';
import { CreatorInfo } from './InteractionCard/CreatorInfo';
import { ActionButtons } from './InteractionCard/ActionButtons';
import { User } from '../../users/users.service';

interface InteractionCardProps {
  interaction: Interaction;
  onInteractionClick?: (interaction: Interaction) => void;
  className?: string;
  /** Users list passed from parent component for performance optimization */
  users?: User[];
}

// Building icon SVG (Heroicons style - customer)
const buildingIcon = (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-4 h-4"
  >
    <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
  </svg>
);

export const InteractionCard: React.FC<InteractionCardProps> = ({ 
  interaction, 
  onInteractionClick,
  className = '',
  users = []
}) => {
  // Find creator from users list passed from parent (performance optimization)
  const creator = users.find((u) => u.id === interaction.createdBy);

  const handleCardClick = () => {
    if (onInteractionClick) {
      onInteractionClick(interaction);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <Card
      variant="default"
      className={`p-monday-5 hover:shadow-md transition-shadow duration-200 cursor-pointer ${className}`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`查看互动详情：${interaction.interactionType}`}
    >
      {/* Top row: Type badge, DateTime, RelativeTime, Status badge */}
      <div className="flex items-center justify-between mb-monday-3">
        <div className="flex items-center gap-monday-3 flex-wrap">
          <TypeBadge type={interaction.interactionType} />
          <DateTime date={interaction.interactionDate} />
          <RelativeTime date={interaction.interactionDate} />
        </div>
        <StatusBadge status={interaction.status} />
      </div>

      {/* Customer and Contact row */}
      <div className="flex items-center gap-monday-2 mb-monday-3 flex-wrap">
        <div className="flex items-center gap-monday-1">
          <span className="text-uipro-secondary flex-shrink-0">{buildingIcon}</span>
          <CustomerLink 
            customerId={interaction.customerId} 
            customerName={interaction.customerName}
          />
        </div>
        {interaction.personName && (
          <>
            <span className="text-uipro-secondary">|</span>
            <ContactName personName={interaction.personName} />
          </>
        )}
      </div>

      {/* Description - Compact for two-column layout (1 line) */}
      {interaction.description && (
        <p className="text-monday-sm text-gray-600 mb-monday-3 line-clamp-1">
          {interaction.description}
        </p>
      )}

      {/* Products */}
      {interaction.products && interaction.products.length > 0 && (
        <div className="mb-monday-3">
          <ProductTags products={interaction.products} />
        </div>
      )}

      {/* Bottom row: Creator info and Action buttons */}
      <div className="flex items-center justify-between pt-monday-3 border-t border-gray-200">
        <CreatorInfo
          creatorId={interaction.createdBy}
          creatorName={creator ? `${creator.firstName || ''} ${creator.lastName || ''}`.trim() || creator.email : undefined}
          creator={creator}
        />
        <ActionButtons
          interactionId={interaction.id}
          onView={handleCardClick}
        />
      </div>
    </Card>
  );
};
