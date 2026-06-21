export type ThemeColor = "purple" | "blue" | "green" | "orange" | "pink" | "red";

export const ACCENT_COLORS: Record<ThemeColor, { primary: string; primaryLight: string }> = {
  purple: { primary: "#8B5CF6", primaryLight: "#A78BFA" },
  blue: { primary: "#3B82F6", primaryLight: "#60A5FA" },
  green: { primary: "#10B981", primaryLight: "#34D399" },
  orange: { primary: "#F97316", primaryLight: "#FB923C" },
  pink: { primary: "#EC4899", primaryLight: "#F472B6" },
  red: { primary: "#EF4444", primaryLight: "#F87171" },
};

export const VIP_GOLD = "#F59E0B";
export const VIP_SILVER = "#9CA3AF";
export const VIP_DIAMOND = "#67E8F9";

function buildColors(accentColor: ThemeColor, isDark: boolean) {
  const accent = ACCENT_COLORS[accentColor];
  if (isDark) {
    return {
      background: "#0A0A14",
      card: "#13131F",
      cardElevated: "#1C1C2E",
      border: "#2A2A3E",
      input: "#1C1C2E",
      foreground: "#F0F0FF",
      mutedForeground: "#8888AA",
      muted: "#1C1C2E",
      primary: accent.primary,
      primaryForeground: "#FFFFFF",
      primaryLight: accent.primaryLight,
      secondary: "#1C1C2E",
      secondaryForeground: "#AAAACC",
      accent: accent.primary,
      accentForeground: "#FFFFFF",
      destructive: "#EF4444",
      destructiveForeground: "#FFFFFF",
      text: "#F0F0FF",
      textSecondary: "#8888AA",
      tint: accent.primary,
      gold: VIP_GOLD,
      silver: VIP_SILVER,
      diamond: VIP_DIAMOND,
      online: "#22C55E",
      tabBar: "#0D0D1A",
      headerBg: "#0D0D1A",
      shadow: "rgba(0,0,0,0.6)",
      overlay: "rgba(0,0,0,0.7)",
    };
  }
  return {
    background: "#F5F5FF",
    card: "#FFFFFF",
    cardElevated: "#FFFFFF",
    border: "#E5E5F0",
    input: "#EEEEFC",
    foreground: "#0A0A14",
    mutedForeground: "#6B7280",
    muted: "#F3F4F6",
    primary: accent.primary,
    primaryForeground: "#FFFFFF",
    primaryLight: accent.primaryLight,
    secondary: "#F3F4F6",
    secondaryForeground: "#374151",
    accent: accent.primary,
    accentForeground: "#FFFFFF",
    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
    text: "#0A0A14",
    textSecondary: "#6B7280",
    tint: accent.primary,
    gold: VIP_GOLD,
    silver: VIP_SILVER,
    diamond: VIP_DIAMOND,
    online: "#22C55E",
    tabBar: "#FFFFFF",
    headerBg: "#FFFFFF",
    shadow: "rgba(0,0,0,0.1)",
    overlay: "rgba(0,0,0,0.5)",
  };
}

export default buildColors;
