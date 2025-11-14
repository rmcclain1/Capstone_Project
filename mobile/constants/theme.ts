/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export type ThemeName = 'light' | 'dark';
export type Tokens = {
    name: ThemeName;
    bg: string;          // app background
    surface: string;     // lifted surfaces (cards, sheets)
    card: string;        // legacy alias for surface (kept for compat)
    text: string;        // primary text
    onBg: string;        // high-contrast text/icons on bg
    textDim: string;     // secondary text
    iconDim: string;     // muted icon color
    border: string;      // hairline borders
    primary: string;     // brand color
    primarySoft: string; // soft/tinted bg using primary (chips, subtle buttons)
    success: string;
    warn: string;
    danger: string;
    inputBg: string;     // input backgrounds
    tint: string;        // generic subtle tint
    muted: string;       // placeholders / hints
    overlay: string;     // modal backdrops
    shadow: string;      // iOS shadow color
};

export const light: Tokens = {
  name: 'light',
  bg: '#f6f6f6ff',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111827',
  onBg: '#111111',
  textDim: '#6B7280',
  iconDim: '#9CA3AF',
  border: '#E5E7EB',
  primary: '#2563EB',
  primarySoft: '#EFF6FF',
  success: '#16A34A',
  warn: '#D97706',
  danger: '#DC2626',
  inputBg: '#ffffffff',
  tint: '#F1F5F9',
  muted: '#9CA3AF',
  overlay: 'rgba(0,0,0,0.15)',
  shadow: 'rgba(0,0,0,0.15)',
};

export const dark: Tokens = {
  name: 'dark',
  bg: '#0B0C10',
  surface: '#14161C',
  card: '#1A1C23',
  text: '#F3F4F6',
  onBg: '#FFFFFF',
  textDim: '#9CA3AF',
  iconDim: '#8B929A',
  border: '#2B2E38',
  primary: '#3B82F6',
  primarySoft: '#132A4D',
  success: '#22C55E',
  warn: '#FACC15',
  danger: '#F87171',
  inputBg: '#1E2028',
  tint: '#1C2230',
  muted: '#9BA1A6',
  overlay: 'rgba(0,0,0,0.85)',
  shadow: 'rgba(0,0,0,0.65)',
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },

  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },

  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
