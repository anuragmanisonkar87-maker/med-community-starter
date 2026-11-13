import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutral green brand palette (swap for your own brand tokens).
        brand: {
          50: "#e8f5ee", 100: "#c8e8d6", 500: "#009356", 600: "#007a47", 700: "#015f38", ink: "#0c1a14",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      maxWidth: { content: "1200px" },
    },
  },
  plugins: [],
};
export default config;
