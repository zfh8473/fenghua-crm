/**
 * 设计 Token（theme）的基础校验，含 Epic 19 的 proMax。
 * @see docs/design-system/MASTER.md
 */
import theme from './theme';

describe('theme', () => {
  it('exports default theme with colors, typography, spacing, boxShadow, borderRadius, backgroundImage', () => {
    expect(theme.colors).toBeDefined();
    expect(theme.typography).toBeDefined();
    expect(theme.spacing).toBeDefined();
    expect(theme.boxShadow).toBeDefined();
    expect(theme.borderRadius).toBeDefined();
    expect(theme.backgroundImage).toBeDefined();
  });

  it('includes Epic 19 proMax tokens from ui-ux-pro-max-skill', () => {
    expect(theme.proMax).toBeDefined();
    expect(theme.proMax.colors).toBeDefined();
    expect(theme.proMax.colors.primary).toBe('#0F172A');
    expect(theme.proMax.colors.secondary).toBe('#334155');
    expect(theme.proMax.colors.cta).toBe('#0369A1');
    expect(theme.proMax.colors.background).toBe('#F8FAFC');
    expect(theme.proMax.colors.text).toBe('#020617');
    expect(theme.proMax.fontFamily).toBeDefined();
    expect(theme.proMax.fontFamily.heading).toContain('Fira Code');
    expect(theme.proMax.fontFamily.body).toContain('Fira Sans');
  });
});
