/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // --- AÑADE ESTO PARA CONTROLAR EL TAMAÑO ---
      fontSize: {
        'xs': ['12px', '16px'],
        'sm': ['14px', '20px'],
        'base': ['16px', '24px'],
        'lg': ['18px', '28px'],
        'xl': ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['30px', '36px'],
      },
      // ------------------------------------------
      fontFamily: {
        custom: ["PlayChickens", "sans-serif"],
        super: ["SuperFeel", "sans-serif"],
        sla: ["Slaberlin", "sans-serif"],
        slabold: ["SlaberlinBold", "sans-serif"],
      },
    },
  },
  plugins: [],
};