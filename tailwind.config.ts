import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        climate: {
          navy: "#0A192F",
          deep: "#0F243A",
          ocean: "#0284C7",
          teal: "#0D9488",
          forest: "#064E3B",
          emerald: "#059669",
          sage: "#10B981",
          leaf: "#34D399",
          cyan: "#06B6D4",
          earth: "#78350F",
          sand: "#D97706",
          terracotta: "#C2410C",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
          dark: "#0F172A",
          muted: "#64748B",
        },
        risk: {
          safe: "#059669",
          low: "#16A34A",
          moderate: "#D97706",
          high: "#EA580C",
          extreme: "#DC2626",
          emergency: "#991B1B",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
        card: "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        elevated: "0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)",
        glow: "0 0 20px -3px rgba(13, 148, 136, 0.25)",
      },
    },
  },
  plugins: [],
};
export default config;
