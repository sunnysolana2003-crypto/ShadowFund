/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./contexts/**/*.{ts,tsx,js,jsx}",
    "./services/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        shadow: {
          black: "#050505",
          dark: "#0A0A0A",
          gray: {
            900: "#111111",
            800: "#1A1A1A",
            700: "#262626",
            600: "#333333",
            500: "#666666",
            400: "#A3A3A3",
            300: "#D4D4D4",
          },
          // Keep class name `shadow-green` but map it to the orange accent.
          green: {
            DEFAULT: "#FF7A00",
            muted: "#3B1D00",
            glow: "rgba(255, 122, 0, 0.18)",
          },
          gold: {
            DEFAULT: "#C5A059",
            light: "#E5C58D",
            dark: "#8A6D3B",
          },
          error: {
            DEFAULT: "#FF3B30",
            muted: "#4D1210",
          },
          purple: {
            DEFAULT: "#9945FF",
          },
          blue: {
            DEFAULT: "#627EEA",
          },
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};

