// theme.ts
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