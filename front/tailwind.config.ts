import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        lol: {
          gold: "#C8AA6E",
          "gold-light": "#F0E6D2",
          "gold-dark": "#785A28",
          "gold-brass": "#C89B3C",
          blue: "#0AC8B9",
          "blue-dark": "#0397AB",
          navy: "#0A1428",
          "navy-dark": "#091428",
          "navy-black": "#010A13",
          metal: "#1E2328",
          "metal-light": "#3C3C41",
          red: "#E84057",
          purple: "#A055FF",
        },
      },
      boxShadow: {
        "glow-gold": "0 0 15px rgba(200, 170, 110, 0.4)",
        "glow-gold-lg": "0 0 25px rgba(200, 170, 110, 0.6)",
        "glow-blue": "0 0 20px rgba(10, 200, 185, 0.4)",
        "glow-blue-lg": "0 0 30px rgba(10, 200, 185, 0.6)",
        "glow-red": "0 0 20px rgba(232, 64, 87, 0.4)",
      },
      backgroundImage: {
        "hextech-gradient": "linear-gradient(135deg, #091428 0%, #0A1428 50%, #010A13 100%)",
        "gold-border-gradient": "linear-gradient(90deg, #785A28 0%, #C8AA6E 50%, #785A28 100%)",
      },
      fontFamily: {
        beaufort: ["var(--font-beaufort)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
