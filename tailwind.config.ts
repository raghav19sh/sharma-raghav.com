import type { Config } from "tailwindcss";

// Tokens ported 1:1 from the current prototype's CSS custom properties
// (App.jsx `CSS` string) — do not introduce new colors without updating
// both this file and the CSS variables in globals.css. Values already
// passed a WCAG AA contrast audit in the prototype; re-audit if changed.

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        text: {
          1: "var(--text-1)",
          2: "var(--text-2)",
        },
        border: {
          DEFAULT: "var(--border)",
          strong: "var(--border-strong)",
        },
        lavender: {
          DEFAULT: "var(--lavender)",
          hover: "var(--lavender-hover)",
          tint: "var(--lavender-tint)",
          text: "var(--lavender-text)",
        },
        "on-lavender": "var(--on-lavender)",
        burgundy: {
          DEFAULT: "var(--burgundy)",
          accent: "var(--burgundy-accent)",
        },
        "on-accent": "var(--on-accent)",
        status: {
          green: "var(--green)",
          "green-tint": "var(--green-tint)",
          "green-text": "var(--green-text)",
          amber: "var(--amber)",
          "amber-tint": "var(--amber-tint)",
          "amber-text": "var(--amber-text)",
          red: "var(--red)",
          "red-tint": "var(--red-tint)",
          "red-text": "var(--red-text)",
        },
      },
      borderRadius: {
        btn: "12px",
        card: "16px",
        panel: "20px",
        dialog: "24px",
        float: "28px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "SF Pro Display", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "Menlo", "monospace"],
      },
      transitionDuration: {
        fast: "120ms",
        normal: "220ms",
        large: "400ms",
      },
      spacing: {
        // 8-point scale per the design system doc
        18: "72px",
      },
    },
  },
  plugins: [],
};

export default config;
