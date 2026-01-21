/**
 * Design Token System for Monday.com Style
 * 
 * This file defines all design tokens (colors, spacing, typography, shadows, etc.)
 * for the fenghua-crm design system.
 * 
 * Monday.com Style Features:
 * - Light gray background (#F4F5F8)
 * - Blue primary color (#0073EA)
 * - Multi-color labels (Blue, Purple, Green, Red)
 * - Professional yet vibrant design
 * 
 * All custom code is proprietary and not open source.
 */

// Type Definitions
export interface ColorTokens {
  monday: {
    bg: string; // Main background: #F4F5F8
    surface: string; // Surface: #FFFFFF
    text: string; // Primary text: #323338
    textSecondary: string; // Secondary text: #6D7175
    textPlaceholder: string; // Placeholder: #9CA3AF
  };
  primary: {
    blue: string; // #0073EA
    blueHover: string; // #0051CC
    purple: string; // #8B5CF6
    green: string; // #00C875
    red: string; // #FF3838
  };
  semantic: {
    success: string; // #00C875
    warning: string; // #F5A623
    error: string; // #FF3838
    info: string; // #0073EA
  };
  gradients: {
    primary: string;
    success: string;
  };
}

export interface SpacingTokens {
  'monday-0': string;
  'monday-1': string;
  'monday-2': string;
  'monday-3': string;
  'monday-4': string;
  'monday-5': string;
  'monday-6': string;
  'monday-8': string;
  'monday-10': string;
  'monday-12': string;
  'monday-14': string;
  'monday-16': string;
}

export interface TypographyTokens {
  fontFamily: {
    sans: string[];
  };
  fontSize: {
    'monday-xs': string;
    'monday-sm': string;
    'monday-base': string;
    'monday-lg': string;
    'monday-xl': string;
    'monday-2xl': string;
    'monday-3xl': string;
    'monday-4xl': string;
    'monday-5xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ShadowTokens {
  'monday-sm': string;
  'monday-md': string;
  'monday-lg': string;
}

export interface BorderRadiusTokens {
  'monday-sm': string;
  'monday-md': string;
  'monday-lg': string;
  'monday-xl': string;
  'monday-full': string;
}

export interface BackgroundImageTokens {
  'gradient-primary': string;
  'gradient-success': string;
}

/** Epic 19：由 ui-ux-pro-max-skill 生成的 B2B CRM 设计系统 Token，与现有 monday/linear 并存，供 19.2–19.5 选用 */
export interface ProMaxTokens {
  colors: { primary: string; secondary: string; cta: string; background: string; text: string };
  fontFamily: { heading: string[]; body: string[] };
}

export interface ThemeTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  boxShadow: ShadowTokens;
  borderRadius: BorderRadiusTokens;
  backgroundImage: BackgroundImageTokens;
  proMax: ProMaxTokens;
}

// Color Tokens (Monday.com Style)
const colors: ColorTokens = {
  monday: {
    bg: '#F4F5F8', // Main background: light gray
    surface: '#FFFFFF', // Surface: white
    text: '#323338', // Primary text: dark gray
    textSecondary: '#6D7175', // Secondary text: medium gray
    textPlaceholder: '#6B7280', // Placeholder text: adjusted for WCAG AA contrast (was #9CA3AF)
  },
  primary: {
    blue: '#0073EA', // Monday.com blue
    blueHover: '#0051CC', // Blue hover state
    purple: '#8B5CF6', // Purple for labels
    green: '#00A862', // Green for labels: adjusted for WCAG AA contrast (was #00C875)
    red: '#FF3838', // Red for labels
  },
  semantic: {
    success: '#00A862', // Success Green: adjusted for WCAG AA contrast (was #00C875)
    warning: '#D97706', // Warning Orange: adjusted for WCAG AA contrast (was #F5A623)
    error: '#FF3838', // Error Red
    info: '#0073EA', // Info Blue
  },
  gradients: {
    primary: 'linear-gradient(135deg, #0073EA 0%, #0051CC 100%)',
    success: 'linear-gradient(135deg, #00C875 0%, #00A862 100%)',
  },
};

// Spacing Tokens (based on 4px scale)
const spacing: SpacingTokens = {
  'monday-0': '0px',
  'monday-1': '4px',
  'monday-2': '8px',
  'monday-3': '12px',
  'monday-4': '16px',
  'monday-5': '20px',
  'monday-6': '24px',
  'monday-8': '32px',
  'monday-10': '40px',
  'monday-12': '48px',
  'monday-14': '56px',
  'monday-16': '64px',
};

// Typography Tokens (Rounded, friendly fonts for better user experience)
const typography: TypographyTokens = {
  fontFamily: {
    sans: [
      'Nunito',
      'Poppins',
      'Quicksand',
      '-apple-system',
      'BlinkMacSystemFont',
      'SF Pro Rounded',
      'SF Pro Text',
      'Segoe UI',
      'PingFang SC',
      'Hiragino Sans GB',
      'Microsoft YaHei',
      'sans-serif'
    ],
  },
  fontSize: {
    'monday-xs': '12px',
    'monday-sm': '14px',
    'monday-base': '16px',
    'monday-lg': '18px',
    'monday-xl': '20px',
    'monday-2xl': '24px',
    'monday-3xl': '30px',
    'monday-4xl': '36px',
    'monday-5xl': '48px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Shadow Tokens (Monday.com style: subtle shadows)
const boxShadow: ShadowTokens = {
  'monday-sm': '0 1px 3px rgba(0, 0, 0, 0.1)',
  'monday-md': '0 2px 8px rgba(0, 0, 0, 0.1)',
  'monday-lg': '0 4px 16px rgba(0, 0, 0, 0.1)',
};

// Border Radius Tokens (Monday.com uses 8px as standard)
const borderRadius: BorderRadiusTokens = {
  'monday-sm': '4px',
  'monday-md': '8px',
  'monday-lg': '12px',
  'monday-xl': '16px',
  'monday-full': '9999px',
};

// Background Image Tokens (gradients for Tailwind backgroundImage)
const backgroundImage: BackgroundImageTokens = {
  'gradient-primary': colors.gradients.primary,
  'gradient-success': colors.gradients.success,
};

// Pro Max Tokens (Epic 19, ui-ux-pro-max-skill; 与 monday/linear 并存，不替代)
const proMax: ProMaxTokens = {
  colors: {
    primary: '#0F172A',
    secondary: '#334155',
    cta: '#0369A1',
    background: '#F8FAFC',
    text: '#020617',
  },
  fontFamily: {
    heading: ['Fira Code', 'monospace'],
    body: ['Fira Sans', 'sans-serif'],
  },
};

// Complete Theme Tokens
const theme: ThemeTokens = {
  colors,
  spacing,
  typography,
  boxShadow,
  borderRadius,
  backgroundImage,
  proMax,
};

// Default export for Tailwind config import
export default theme;

// Named exports for direct usage in components
export { colors, spacing, typography, boxShadow, borderRadius, backgroundImage, proMax };

