// Warm minimal theme for Korean Hanja study app
export const colors = {
  background: "#F7F3EE",
  accent: "#C97A3A",
  accentSoft: "#E6A878",
  card: "#FFFFFF",
  textPrimary: "#2D2824",
  textSecondary: "#7A726A",
  textMuted: "#A8A096",
  success: "#5C8065",
  error: "#B3504B",
  border: "#E8E2D9",
  highlight: "#F0E8DD",
  chip: "#EDE4D6",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 9999,
};

export const shadows = {
  card: {
    shadowColor: "#2D2824",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  float: {
    shadowColor: "#C97A3A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 6,
  },
};

export const type = {
  hanjaDisplay: { fontSize: 96, fontWeight: "300" as const, lineHeight: 112 },
  hanjaLarge: { fontSize: 64, fontWeight: "300" as const, lineHeight: 76 },
  hanjaMedium: { fontSize: 44, fontWeight: "300" as const, lineHeight: 54 },
  h1: { fontSize: 32, fontWeight: "700" as const, lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: "600" as const, lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: "600" as const, lineHeight: 28 },
  bodyLarge: { fontSize: 18, fontWeight: "400" as const, lineHeight: 28 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: "500" as const, lineHeight: 20 },
  overline: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 1.2,
    textTransform: "uppercase" as const,
  },
};

export const LEVELS = ["8급", "7급", "6급", "5급", "4급", "3급"] as const;
export type Level = (typeof LEVELS)[number];
