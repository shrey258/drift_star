/**
 * Color palette for Drift Star
 * Warm, earthy palette — rich terracotta accent on clean white
 */

export const colors = {
    // Core
    white: "#FFFFFF",
    carbonBlack: "#1B1B1B",

    // Neutrals
    paleOak: "#C9BDB0",
    ashBrown: "#6C5D52",

    // Accents
    glaucous: "#6C86BB",
    coral: "#C2553E",

    // Semantic aliases
    background: "#FFFFFF",
    text: "#1B1B1B",
    textSecondary: "#6C5D52",
    textMuted: "#C9BDB0",
    primary: "#C2553E",
    accent: "#C2553E",

    // Borders
    border: "#C9BDB0",
    borderLight: "rgba(201, 189, 176, 0.4)",
    borderSubtle: "rgba(0, 0, 0, 0.06)",
    borderPressed: "rgba(0, 0, 0, 0.1)",

    // Tinted backgrounds (for badges, pills, chips)
    primaryLight: "rgba(194, 85, 62, 0.08)",
    accentLight: "rgba(194, 85, 62, 0.12)",
    glaucousLight: "rgba(108, 134, 187, 0.12)",

    // Error states
    error: "#C53030",
    errorLight: "rgba(197, 48, 48, 0.08)",

    // Glass / overlay
    glassBackground: "rgba(255, 255, 255, 0.8)",
    glassBorder: "rgba(255, 255, 255, 0.3)",
    glassOverlay: "rgba(255, 255, 255, 0.4)",
    darkOverlay: "rgba(0, 0, 0, 0.3)",

    // Shadows
    deepShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    softShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
    pressedShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    buttonShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
    primaryShadow: "0 4px 16px rgba(194, 85, 62, 0.25)",
    elevatedShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
} as const;

export type ColorKey = keyof typeof colors;
