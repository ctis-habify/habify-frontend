import { Colors } from '@/constants/theme';

export const COLORS = {
  // Brand Gradients
  gradientTop: '#6D28D9',  // Violet-700
  gradientBottom: '#4C1D95', // Violet-900
  
  // Surfaces
  formBackground: Colors.light.card,
  
  // Interactive
  inputBlue: Colors.light.primary,
  
  // Text
  textDark: Colors.light.text,
  textPrimary: '#FFFFFF',
  textSecondary: Colors.light.icon,
};

export const BACKGROUND_GRADIENT = [
  COLORS.gradientTop, 
  COLORS.gradientBottom,
] as const;