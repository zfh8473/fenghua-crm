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
        // Monday.com style colors (legacy support)
        'monday-bg': themeTokens.colors.monday.bg,
        'monday-surface': themeTokens.colors.monday.surface,
        'monday-text': themeTokens.colors.monday.text,
        'monday-text-secondary': themeTokens.colors.monday.textSecondary,
        'monday-text-placeholder': themeTokens.colors.monday.textPlaceholder,
        // Linear style colors (preferred, mapping to monday values)
        'linear-dark': '#0a0a0a',
        'linear-dark-alt': '#1a1a1a',
        'linear-surface': themeTokens.colors.monday.surface,
        'linear-text': themeTokens.colors.monday.text,
        'linear-text-secondary': themeTokens.colors.monday.textSecondary,
        'linear-text-placeholder': themeTokens.colors.monday.textPlaceholder,
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
        // Linear style aliases (mapping to monday-* values for consistency)
        'linear-0': themeTokens.spacing['monday-0'],
        'linear-1': themeTokens.spacing['monday-1'],
        'linear-2': themeTokens.spacing['monday-2'],
        'linear-3': themeTokens.spacing['monday-3'],
        'linear-4': themeTokens.spacing['monday-4'],
        'linear-5': themeTokens.spacing['monday-5'],
        'linear-6': themeTokens.spacing['monday-6'],
        'linear-8': themeTokens.spacing['monday-8'],
        'linear-10': themeTokens.spacing['monday-10'],
        'linear-12': themeTokens.spacing['monday-12'],
        'linear-14': themeTokens.spacing['monday-14'],
        'linear-16': themeTokens.spacing['monday-16'],
      },
      // Typography Tokens
      fontFamily: {
        ...themeTokens.typography.fontFamily,
      },
      fontSize: {
        ...themeTokens.typography.fontSize,
        // Linear style aliases (mapping to monday-* values for consistency)
        'linear-xs': themeTokens.typography.fontSize['monday-xs'],
        'linear-sm': themeTokens.typography.fontSize['monday-sm'],
        'linear-base': themeTokens.typography.fontSize['monday-base'],
        'linear-lg': themeTokens.typography.fontSize['monday-lg'],
        'linear-xl': themeTokens.typography.fontSize['monday-xl'],
        'linear-2xl': themeTokens.typography.fontSize['monday-2xl'],
        'linear-3xl': themeTokens.typography.fontSize['monday-3xl'],
        'linear-4xl': themeTokens.typography.fontSize['monday-4xl'],
        'linear-5xl': themeTokens.typography.fontSize['monday-5xl'],
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
        // Linear style aliases
        'linear-sm': themeTokens.boxShadow['monday-sm'],
        'linear-md': themeTokens.boxShadow['monday-md'],
        'linear-lg': themeTokens.boxShadow['monday-lg'],
      },
      // Border Radius Tokens
      borderRadius: {
        ...themeTokens.borderRadius,
        // Linear style aliases
        'linear-sm': themeTokens.borderRadius['monday-sm'],
        'linear-md': themeTokens.borderRadius['monday-md'],
        'linear-lg': themeTokens.borderRadius['monday-lg'],
        'linear-xl': themeTokens.borderRadius['monday-xl'],
        'linear-full': themeTokens.borderRadius['monday-full'],
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
