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
        primary: {
          DEFAULT: "#0EA5E9", // Sky Blue
          light: "#38BDF8",
          dark: "#0284C7",
        },
        navy: {
          DEFAULT: "#0F172A", // Dark Navy
          light: "#1E293B",
          dark: "#101828",
        },
        cvirms: {
          primary: "#0EA5E9",
          primaryDark: "#0284C7",
          bg: "#F7F8FA",
          charcoal: "#101828",
          navy: "#0F172A",
          subtext: "#667085",
          border: "#EAECF0",
          badgeBg: "#E0F2FE",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      borderRadius: {
        "16": "16px",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        floatBot: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "scale-in": "scaleIn 0.4s ease-out forwards",
        "float-bot": "floatBot 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
