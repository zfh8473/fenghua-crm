/**
 * Contact Method Icon Component
 * 
 * Displays contact method icons (phone, mobile, email, wechat, whatsapp, linkedin, facebook)
 * Extracted from PersonList for reuse in CustomerPersonManagementModal
 * All custom code is proprietary and not open source.
 */

import React from 'react';

export interface ContactMethodIconProps {
  type: 'phone' | 'mobile' | 'email' | 'wechat' | 'whatsapp' | 'linkedin' | 'facebook';
  hasValue: boolean;
  onClick?: () => void;
  value?: string; // Optional: contact method value for tooltip
}

/**
 * Contact method icon component
 * 
 * Displays an icon for a contact method. Icons are "lit up" (text-uipro-cta) if hasValue is true,
 * otherwise grayed out (text-gray-300). Icons are clickable if hasValue is true.
 */
export const ContactMethodIcon: React.FC<ContactMethodIconProps> = ({ 
  type, 
  hasValue, 
  onClick,
  value 
}) => {
  const iconMap: Record<string, JSX.Element> = {
    phone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
      </svg>
    ),
    mobile: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 1.5H5.625c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75m-7.5-6h6.375c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-6.375m-4.5 0V1.5m4.5 0v21" />
      </svg>
    ),
    email: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    wechat: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
      </svg>
    ),
    whatsapp: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
      </svg>
    ),
    linkedin: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14z" />
        <path d="M8 12h.01M12 12h.01M16 12h.01M8 8h.01M12 8h.01M16 8h.01" />
      </svg>
    ),
    facebook: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
  };

  const icon = iconMap[type] || iconMap.phone;
  const baseClasses = 'w-4 h-4 flex-shrink-0 transition-colors duration-200';
  const colorClasses = hasValue 
    ? 'text-uipro-cta cursor-pointer hover:text-uipro-cta/80' 
    : 'text-gray-300 cursor-not-allowed';

  const tooltipText = hasValue 
    ? (value ? `${type}: ${value}` : `${type} 联系方式`)
    : `无 ${type} 联系方式`;

  return (
    <span 
      className={`${baseClasses} ${colorClasses}`}
      onClick={hasValue ? onClick : undefined}
      title={tooltipText}
    >
      {icon}
    </span>
  );
};
