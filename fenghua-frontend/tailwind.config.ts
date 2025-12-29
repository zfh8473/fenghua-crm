/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss';
import themeTokens from './src/styles/theme';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  // Monday.com Style Theme
  theme: {
    extend: {
      // Color Tokens
      colors: {
        // Monday.com style colors
        'monday-bg': themeTokens.colors.monday.bg,
        'monday-surface': themeTokens.colors.monday.surface,
        'monday-text': themeTokens.colors.monday.text,
        'monday-text-secondary': themeTokens.colors.monday.textSecondary,
        'monday-text-placeholder': themeTokens.colors.monday.textPlaceholder,
        // Primary colors
        'primary-blue': themeTokens.colors.primary.blue,
        'primary-blue-hover': themeTokens.colors.primary.blueHover,
        'primary-purple': themeTokens.colors.primary.purple,
        'primary-green': themeTokens.colors.primary.green,
        'primary-red': themeTokens.colors.primary.red,
        // Semantic colors
        'semantic-success': themeTokens.colors.semantic.success,
        'semantic-warning': themeTokens.colors.semantic.warning,
        'semantic-error': themeTokens.colors.semantic.error,
        'semantic-info': themeTokens.colors.semantic.info,
      },
      // Spacing Tokens (extending Tailwind default)
      spacing: {
        ...themeTokens.spacing,
      },
      // Typography Tokens
      fontFamily: {
        ...themeTokens.typography.fontFamily,
      },
      fontSize: {
        ...themeTokens.typography.fontSize,
      },
      fontWeight: {
        ...themeTokens.typography.fontWeight,
      },
      lineHeight: {
        ...themeTokens.typography.lineHeight,
      },
      // Shadow Tokens
      boxShadow: {
        ...themeTokens.boxShadow,
      },
      // Border Radius Tokens
      borderRadius: {
        ...themeTokens.borderRadius,
      },
      // Background Image Tokens (gradients)
      backgroundImage: {
        ...themeTokens.backgroundImage,
      },
    },
  },
  plugins: [],
};

export default config;
