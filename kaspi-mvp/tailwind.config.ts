import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        cream: "#fafbfc",
        clay: "#ffb8a0",
        moss: "#4caf50",
        sand: "#e6e9ef",
        lavender: "#8b7fe8",
        lilac: "#ede9ff",
        peach: "#ffb8a0",
        mint: "#4caf50",
        cloud: "#f8f9fa",
        slate: "#6b7280",
      },
      boxShadow: {
        card: "0 2px 8px rgba(15, 23, 42, 0.08)",
        float: "0 18px 40px rgba(139, 127, 232, 0.12)",
      },
      borderRadius: {
        xl2: "1.25rem",
        panel: "1rem",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 350ms ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
