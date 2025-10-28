import type { Config } from "tailwindcss";
import { designTokens } from "./design-tokens";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.light.primary,
        secondary: designTokens.colors.light.secondary,
        accent: designTokens.colors.light.accent,
        surface: designTokens.colors.light.surface,
      },
      fontFamily: {
        sans: designTokens.typography.fontFamily.sans,
        mono: designTokens.typography.fontFamily.mono,
      },
      fontSize: designTokens.typography.sizes,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.shadows,
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        DEFAULT: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;


