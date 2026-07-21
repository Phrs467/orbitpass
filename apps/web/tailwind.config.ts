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
        orbit: {
          dark: "#030712",
          "dark-light": "#0B1221",
          blue: "#00E5FF",
          purple: "#9D00FF",
          text: "#FFFFFF",
          "text-muted": "#94A3B8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
