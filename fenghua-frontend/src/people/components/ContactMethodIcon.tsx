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
 * Displays an icon for a contact method with brand-specific colors and icons.
 * Uses official brand colors: WhatsApp (green), Facebook (blue), LinkedIn (blue), WeChat (green).
 * Icons are "lit up" with brand colors if hasValue is true, otherwise grayed out (text-gray-300).
 * Icons are clickable if hasValue is true.
 */
export const ContactMethodIcon: React.FC<ContactMethodIconProps> = ({ 
  type, 
  hasValue, 
  onClick,
  value 
}) => {
  // 品牌颜色映射
  const brandColors: Record<string, string> = {
    whatsapp: '#25D366', // WhatsApp 官方绿色
    wechat: '#07C160', // 微信官方绿色
    facebook: '#4267B2', // Facebook 官方蓝色
    linkedin: '#0077B5', // LinkedIn 官方蓝色
    phone: '#0369A1', // 系统蓝色（与 primary 一致）
    mobile: '#0369A1', // 系统蓝色（与 primary 一致）
    email: '#0369A1', // 系统蓝色（与 primary 一致）
  };

  // 图标映射 - 使用更接近官方设计的图标
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
      // 微信图标 - 使用更接近官方设计的图标
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18 0 .653-.52 1.18-1.162 1.18-.642 0-1.162-.527-1.162-1.18 0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18 0 .653-.52 1.18-1.162 1.18-.642 0-1.162-.527-1.162-1.18 0-.651.52-1.18 1.162-1.18zm5.34 3.24c-1.693 0-3.137.932-3.637 2.23-.9 2.315.26 4.896 2.58 5.826 1.82.72 3.973.315 5.308-1.004.07-.07.16-.1.25-.1a.9.9 0 0 1 .5.15l1.104.645a.2.2 0 0 0 .234-.033.19.19 0 0 0 .06-.188l-.24-.91a.58.58 0 0 1 .21-.66c1.625-1.18 2.535-2.835 2.535-4.655 0-2.348-2.05-4.25-4.555-4.25-.276 0-.543.027-.811.05.857-2.578-.157-4.972-1.932-6.446-1.703-1.415-3.882-1.98-5.853-1.838.576 3.583 4.196 6.348 8.596 6.348 2.52 0 4.81-.932 6.405-2.46-.576 3.583-4.196 6.348-8.596 6.348a10.17 10.17 0 0 1-2.837-.403.864.864 0 0 0-.717.098l-1.903 1.114a.326.326 0 0 1-.167.054.295.295 0 0 1-.29-.295c0-.072.03-.142.048-.213l.39-1.48a.59.59 0 0 0-.213-.665c-1.832-1.347-3.002-3.338-3.002-5.55 0-4.054 3.891-7.342 8.691-7.342z"/>
      </svg>
    ),
    whatsapp: (
      // WhatsApp 图标 - 使用更接近官方设计的图标
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
      </svg>
    ),
    linkedin: (
      // LinkedIn 图标 - 使用官方设计的图标
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    facebook: (
      // Facebook 图标 - 使用官方设计的图标
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  };

  const icon = iconMap[type] || iconMap.phone;
  const brandColor = brandColors[type] || '#0369A1';
  
  // 将十六进制颜色转换为 rgba（15% 透明度）
  const hexToRgba = (hex: string, alpha: number): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };
  
  // 根据是否有值来决定样式
  const baseClasses = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200';
  
  const colorClasses = hasValue 
    ? `cursor-pointer hover:scale-110 hover:shadow-md` 
    : 'cursor-not-allowed opacity-40';

  const tooltipText = hasValue 
    ? (value ? `${type}: ${value}` : `${type} 联系方式`)
    : `无 ${type} 联系方式`;

  return (
    <span 
      className={`${baseClasses} ${colorClasses}`}
      onClick={hasValue ? onClick : undefined}
      title={tooltipText}
      style={hasValue ? { 
        backgroundColor: hexToRgba(brandColor, 0.15), // 15% opacity background
        color: brandColor 
      } : {
        backgroundColor: '#F3F4F6', // Gray background for disabled
        color: '#9CA3AF' // Gray icon for disabled
      }}
    >
      <span className="w-4 h-4">
        {icon}
      </span>
    </span>
  );
};
