// theme.ts
export interface Theme {
  dark: string;
  darker: string;
  accent: string;
  accentLight: string;
  card: string;
  text: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string;
  background: string;
  border: string;
}

export const THEME: Theme = {
  dark: '#1A1A1A',
  darker: '#121212',
  accent: '#7C4DFF',
  accentLight: '#9E7BFF',
  card: '#242424',
  text: '#FFF',
  textSecondary: '#B3B3B3',
  error: '#FF5252',
  success: '#4CAF50',
  warning: '#FFC107',
  background: '#1A1A1A',
  border: '#333333',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const FONTS = {
  regular: 'System',
  medium: 'System-Medium',
  bold: 'System-Bold',
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
};

export const COLORS = {
    primary: '#6B46C1',
    primaryLight: '#9F7AEA',
    white: '#FFFFFF',
    black: '#1A1A1A',
    gray: '#718096',
    lightGray: '#F7FAFC',
    error: '#E53E3E',
    success: '#38A169'
  } as const;
  
  export type ColorKeys = keyof typeof COLORS;