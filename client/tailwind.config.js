/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: "#0a0a0c",
          800: "#111115",
          700: "#161619",
          600: "#1c1c22",
          500: "#24242c",
          400: "#2e2e38",
        },
        accent: {
          DEFAULT: "#6c63ff",
          hover: "#7b73ff",
          glow: "rgba(108, 99, 255, 0.15)",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
