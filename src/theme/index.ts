export const palette = {
  background: "#0F141A",
  surface: "#1A232C",
  surfaceAlt: "#243240",
  card: "#192028",
  text: "#F4F6F8",
  textMuted: "#A9B6C2",
  accent: "#F0B429",
  accentStrong: "#FF8C1A",
  success: "#34C759",
  danger: "#FF5C5C",
  border: "#32414D",
  chip: "#314454",
  overlay: "rgba(15, 20, 26, 0.72)",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 36,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export const typography = {
  display: 28,
  title: 22,
  heading: 18,
  body: 16,
  bodySmall: 14,
  caption: 12,
  button: 17,
} as const;

export const controlHeights = {
  regular: 56,
  production: 68,
} as const;
