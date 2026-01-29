/**
 * CustomerLink Component
 * 
 * Displays customer name as a clickable link
 * All custom code is proprietary and not open source.
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface CustomerLinkProps {
  customerId: string;
  customerName?: string;
  className?: string;
}

export const CustomerLink: React.FC<CustomerLinkProps> = ({ 
  customerId, 
  customerName, 
  className = '' 
}) => {
  const displayName = customerName || '未知客户';
  
  return (
    <Link
      to={`/customers/${customerId}`}
      className={`text-monday-base font-medium text-uipro-cta hover:text-uipro-cta/80 hover:underline transition-colors ${className}`}
    >
      {displayName}
    </Link>
  );
};
