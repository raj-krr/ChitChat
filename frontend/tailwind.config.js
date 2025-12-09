/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {

        mytheme: {
          "primary": "#2563EB",
          "secondary": "#3B82F6",
          "accent": "#1E40AF",

          "base-100": "#F8FAFC",
          "neutral": "#0F172A",

          "success": "#22C55E",
          "warning": "#F5900B",
          "error": "#EF4444",
        },
    
    extend: {},
  },
  plugins: [require("daisyui")],
};
