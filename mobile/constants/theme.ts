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
    bg: '#FFF',
    surface: '#F2F2F2',
    card: '#FFFFFF',
    text: '#111111',
    onBg: '#111111',
    textDim: '#5F5F5F',
    iconDim: '#9AA3AF',
    border: '#E7E7EE',

    // Brand / states
    primary: '#2563EB',
    primarySoft: '#E8F0FE',
    success: '#16A34A',
    warn: '#D97706',
    danger: '#EF4444',

    // Inputs & utility
    inputBg: '#F3F4F6',
    tint: '#E8F0FE',
    muted: '#9AA3AF',
    overlay: 'rgba(0,0,0,0.35)',
    shadow: 'rgba(0,0,0,0.08)',
};

export const dark: Tokens = {
    name: 'dark',
    bg: '#0B0B0F',
    surface: '#15151C',
    card: '#15151C',
    text: '#EDEDED',
    onBg: '#EDEDED',
    textDim: '#A3A3A3',
    iconDim: '#9BA1A6',
    border: '#262637',

    // Brand / states
    primary: '#60A5FA',
    primarySoft: '#142030',
    success: '#22C55E',
    warn: '#FBBF24',
    danger: '#F87171',

    // Inputs & utility
    inputBg: '#1E1E26',
    tint: '#142030',
    muted: '#9BA1A6',
    overlay: 'rgba(0,0,0,0.50)',
    shadow: 'rgba(0,0,0,0.50)',
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
