const tintColorLight = '#1E3A8A'; // Royal Blue 900
const tintColorDark = '#3B82F6';  // Royal Blue 500

export default {
  light: {
    text: '#0F172A', // Slate 900
    background: '#F1F5F9', // Slate 100 for glass contrast
    card: 'rgba(255, 255, 255, 0.85)', // Translucent card background
    border: 'rgba(30, 58, 138, 0.15)', // Royal blue tinted border
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    success: '#10B981',
    warning: '#D4AF37', // Premium Gold
    danger: '#EF4444',
    primary: tintColorLight,
    secondary: '#D4AF37', // Premium Gold
    muted: '#64748B',
  },
  dark: {
    text: '#F8FAFC', // Slate 50
    background: '#0B0F19', // Dark Royal Blue/Slate 950
    card: 'rgba(15, 23, 42, 0.7)', // Slate 900 glass
    border: 'rgba(255, 255, 255, 0.08)', // Fine border
    tint: tintColorDark,
    tabIconDefault: '#475569',
    tabIconSelected: tintColorDark,
    success: '#34D399',
    warning: '#FBBF24', // Premium Gold Dark
    danger: '#F87171',
    primary: tintColorDark,
    secondary: '#FBBF24', // Premium Gold Dark
    muted: '#94A3B8',
  },
};
export type ThemeColors = typeof import('./Colors').default.light;

