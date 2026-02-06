import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "fire-red": "#ef4444",
        "fire-orange": "#f97316",
        "fire-yellow": "#eab308",
      },
    },
  },
  plugins: [],
};
export default config;
