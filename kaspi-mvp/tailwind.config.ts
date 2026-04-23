import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1e1b18",
        cream: "#f4efe6",
        clay: "#dc8758",
        moss: "#355244",
        sand: "#d8c8ad",
      },
      boxShadow: {
        card: "0 20px 45px rgba(30, 27, 24, 0.15)",
      },
      borderRadius: {
        xl2: "1.25rem",
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
