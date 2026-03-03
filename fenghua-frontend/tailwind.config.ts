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
        'semantic-danger': '#A00030',
        // Epic 19 / ui-ux-pro-max-skill（与 monday/linear 并存，19.2–19.5 可选用）
        'uipro-primary': themeTokens.proMax.colors.primary,
        'uipro-secondary': themeTokens.proMax.colors.secondary,
        'uipro-cta': themeTokens.proMax.colors.cta,
        'uipro-bg': themeTokens.proMax.colors.background,
        'uipro-text': themeTokens.proMax.colors.text,
      },
      // Spacing Tokens (extending Tailwind default)
      spacing: {
        ...themeTokens.spacing,
      },
      // Typography Tokens
      fontFamily: {
        ...themeTokens.typography.fontFamily,
        // Epic 19 / ui-ux-pro-max-skill（19.2–19.5 可选用）
        'uipro-heading': themeTokens.proMax.fontFamily.heading,
        'uipro-body': themeTokens.proMax.fontFamily.body,
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
