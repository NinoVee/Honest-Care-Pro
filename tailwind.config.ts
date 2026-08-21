import type { Config } from "tailwindcss";

// Design tokens — matched to the iOS app's shield logo (navy/teal),
// so the web and mobile apps read as one product.
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0B1F3A",
          light: "#132A4D",
        },
        teal: {
          DEFAULT: "#14B1A2",
          light: "#E6F7F5",
        },
        ink: "#1E2A2E",
        subtle: "#5C6B6F",
        canvas: "#F5F7F7",
        alert: {
          info: "#5768BF",
          urgent: "#D98C1A",
          critical: "#C73333",
          good: "#2F9A59",
        },
      },
      fontFamily: {
        display: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [],
} satisfies Config;
