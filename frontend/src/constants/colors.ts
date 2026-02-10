/**
 * Color palette for Drift Star
 * A warm, elegant palette with earthy tones and bold accents
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
    brickEmber: "#BE2A0B",
    burntPeach: "#D57A5C",
    regalNavy: "#103984",

    // Semantic aliases
    background: "#FFFFFF",
    text: "#1B1B1B",
    textSecondary: "#6C5D52",
    textMuted: "#C9BDB0",
    border: "#C9BDB0",
    borderLight: "rgba(201, 189, 176, 0.4)",
    primary: "#103984",
    primaryLight: "rgba(16, 57, 132, 0.1)",
    accent: "#D57A5C",
    accentStrong: "#BE2A0B",

    // Premium UI Tokens
    glassBackground: "rgba(255, 255, 255, 0.8)",
    glassBorder: "rgba(255, 255, 255, 0.3)",
    deepShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    softShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
} as const;

export type ColorKey = keyof typeof colors;
