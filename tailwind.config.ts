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
        "bg-base": "#0A0A0A",
        card: "#141414",
        "card-alt": "#1a1a1a",
        "border-subtle": "#2A2A2A",
        accent: "#FFD700",
        "accent-dim": "#FFD70044",
        "live-red": "#ef4444",
        "final-green": "#22c55e",
        "upcoming-blue": "#FFD700",
        "stat-green": "#FFD700",
        "text-primary": "#FFFFFF",
        "text-secondary": "#D4D4D4",
        "text-dim": "#888888",
      },
      animation: {
        "pulse-live": "pulse-live 1.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        "pulse-live": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
