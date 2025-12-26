/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Add all paths to your template files
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    
    // Add any other directories you use
    './layouts/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6', // blue-500
          dark: '#1d4ed8', // blue-700
          light: '#60a5fa', // blue-400
        },
        secondary: {
          DEFAULT: '#10b981', // emerald-500
          dark: '#047857', // emerald-700
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}