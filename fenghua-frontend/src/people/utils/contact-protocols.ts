/**
 * Contact Protocol Utilities
 * 
 * Functions for generating and opening contact method protocols (tel:, mailto:, whatsapp://, etc.)
 * Story 20.4: Customer List Integration
 * All custom code is proprietary and not open source.
 */

export type ContactMethodType = 'phone' | 'mobile' | 'email' | 'wechat' | 'whatsapp' | 'linkedin' | 'facebook';

/**
 * Detects the operating system
 */
export const detectOS = (): 'Windows' | 'macOS' | 'Linux' | 'Unknown' => {
  if (typeof navigator === 'undefined') return 'Unknown';
  
  const platform = navigator.platform || navigator.userAgent;
  
  if (platform.includes('Win')) return 'Windows';
  if (platform.includes('Mac')) return 'macOS';
  if (platform.includes('Linux')) return 'Linux';
  
  return 'Unknown';
};

/**
 * Generates a phone protocol URL
 */
export const generatePhoneProtocol = (phone: string): string => {
  return `tel:${phone}`;
};

/**
 * Generates a mobile protocol URL
 */
export const generateMobileProtocol = (mobile: string): string => {
  return `tel:${mobile}`;
};

/**
 * Generates an email protocol URL
 */
export const generateEmailProtocol = (
  email: string, 
  subject?: string, 
  body?: string
): string => {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  
  const queryString = params.toString();
  return queryString ? `mailto:${email}?${queryString}` : `mailto:${email}`;
};

/**
 * Generates a WhatsApp protocol URL
 * 
 * Note: WhatsApp requires phone number format: country code + number (without + sign)
 * Example: 8613800138000 (for +86 138 0013 8000)
 */
export const generateWhatsAppProtocol = (whatsapp: string, text?: string): string => {
  // Remove all non-digit characters, keep country code
  const cleaned = whatsapp.replace(/\D/g, '');
  const params = new URLSearchParams();
  params.append('phone', cleaned);
  if (text) params.append('text', text);
  
  return `whatsapp://send?${params.toString()}`;
};

/**
 * Generates a WeChat protocol URL
 * 
 * Note: WeChat protocol (weixin://) may have limitations and needs verification
 */
export const generateWeChatProtocol = (_wechat: string): string => {
  // WeChat protocol format may vary, using basic format
  // This may need adjustment based on actual WeChat desktop app support
  // Currently not fully implemented - reserved for future use
  return `weixin://`;
};

/**
 * Generates a LinkedIn protocol URL
 */
export const generateLinkedInProtocol = (linkedinUrl: string): string => {
  // If already a full URL, use it directly
  if (linkedinUrl.startsWith('http://') || linkedinUrl.startsWith('https://')) {
    return linkedinUrl;
  }
  // Otherwise, construct LinkedIn profile URL
  return `https://www.linkedin.com/in/${linkedinUrl}`;
};

/**
 * Generates a Facebook protocol URL
 */
export const generateFacebookProtocol = (facebook: string): string => {
  // If already a full URL, use it directly
  if (facebook.startsWith('http://') || facebook.startsWith('https://')) {
    return facebook;
  }
  // Otherwise, construct Facebook profile URL
  return `https://www.facebook.com/${facebook}`;
};

/**
 * Generates a protocol URL for a given contact method type
 */
export const generateProtocol = (
  type: ContactMethodType,
  value: string,
  options?: {
    subject?: string;
    body?: string;
    text?: string;
  }
): string => {
  switch (type) {
    case 'phone':
      return generatePhoneProtocol(value);
    case 'mobile':
      return generateMobileProtocol(value);
    case 'email':
      return generateEmailProtocol(value, options?.subject, options?.body);
    case 'whatsapp':
      return generateWhatsAppProtocol(value, options?.text);
    case 'wechat':
      return generateWeChatProtocol(value);
    case 'linkedin':
      return generateLinkedInProtocol(value);
    case 'facebook':
      return generateFacebookProtocol(value);
    default:
      throw new Error(`Unsupported contact method type: ${type}`);
  }
};

/**
 * Gets a user-friendly error message for a contact method type
 */
const getErrorMessage = (type: ContactMethodType, value?: string): string => {
  switch (type) {
    case 'phone':
    case 'mobile':
      return '无法拨打电话，请检查设备是否支持电话功能';
    case 'email':
      return value ? `无法打开邮件客户端，请手动发送邮件到 ${value}` : '无法打开邮件客户端';
    case 'whatsapp':
      return '无法打开 WhatsApp，请确保已安装 WhatsApp 应用';
    case 'wechat':
      return '无法打开微信，请确保已安装微信应用';
    case 'linkedin':
      return value ? `无法打开链接，请手动访问 ${value}` : '无法打开 LinkedIn 链接';
    case 'facebook':
      return value ? `无法打开链接，请手动访问 ${value}` : '无法打开 Facebook 链接';
    default:
      return '无法打开联系方式';
  }
};

/**
 * Opens a contact protocol URL
 * 
 * @param protocol - The protocol URL to open
 * @param contactMethod - The contact method type (for error messages)
 * @param value - The contact method value (for error messages)
 * @returns Promise that resolves when the protocol is opened, or rejects on error
 */
export const openContactProtocol = async (
  protocol: string,
  contactMethod: ContactMethodType,
  value?: string
): Promise<void> => {
  try {
    // Try to open the protocol
    // Use window.open for better cross-browser compatibility
    const opened = window.open(protocol, '_blank');
    
    // For some protocols, we can't detect if the app is installed
    // Use a timeout to detect if the protocol failed
    return new Promise((resolve, reject) => {
      // Set a timeout to detect if protocol opening failed
      const timeout = setTimeout(() => {
        // If window.open returned null, it was likely blocked
        if (!opened || opened.closed) {
          const error = new Error(getErrorMessage(contactMethod, value));
          console.error('Failed to open contact protocol:', {
            protocol,
            contactMethod,
            value,
            os: detectOS(),
          });
          reject(error);
        } else {
          // Protocol opened successfully
          resolve();
        }
      }, 2000); // 2 second timeout
      
      // If the window closes quickly, it might mean the protocol failed
      // But we can't reliably detect this, so we'll use the timeout
      if (opened) {
        // Check if window was closed (might indicate protocol failure)
        const checkInterval = setInterval(() => {
          if (opened.closed) {
            clearInterval(checkInterval);
            clearTimeout(timeout);
            // Window closed - might be protocol failure or user closed it
            // We'll assume success for now
            resolve();
          }
        }, 100);
        
        // Clean up after timeout
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 2000);
      }
    });
  } catch (error) {
    // Log error for debugging
    console.error('Error opening contact protocol:', {
      protocol,
      contactMethod,
      value,
      os: detectOS(),
      error,
    });
    
    // Throw user-friendly error
    throw new Error(getErrorMessage(contactMethod, value));
  }
};

/**
 * Checks if a protocol is supported on the current platform
 */
export const isProtocolSupported = (type: ContactMethodType): boolean => {
  const _os = detectOS(); // Reserved for future platform-specific checks
  
  // Standard protocols are supported on all platforms
  if (['phone', 'mobile', 'email'].includes(type)) {
    return true;
  }
  
  // HTTPS protocols are supported on all platforms
  if (['linkedin', 'facebook'].includes(type)) {
    return true;
  }
  
  // Custom protocols may have platform-specific support
  if (type === 'whatsapp') {
    // WhatsApp Desktop is available on Windows, macOS, and Linux
    return true; // Assume available if installed
  }
  
  if (type === 'wechat') {
    // WeChat protocol may have limitations
    return true; // Assume available if installed, but may need verification
  }
  
  return false;
};

/**
 * Gets a fallback message for unsupported protocols
 */
export const getFallbackMessage = (type: ContactMethodType, value?: string): string => {
  const _os = detectOS(); // Reserved for future platform-specific messages
  
  if (type === 'linkedin' || type === 'facebook') {
    return value 
      ? `该联系方式在当前平台可能不受支持，请手动访问: ${value}`
      : '该联系方式在当前平台可能不受支持，请手动联系';
  }
  
  if (type === 'email') {
    return value 
      ? `请手动发送邮件到: ${value}`
      : '请手动发送邮件';
  }
  
  return '该联系方式在当前平台可能不受支持，请手动联系';
};
