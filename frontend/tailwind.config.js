/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#F8FAFB',
          DEFAULT: '#80A1BA',
          dark: '#5A7A92',
        },
        secondary: '#91C4C3',
        accent: '#B4DEBD',
        dark: '#2C3E50',
        gray: {
          light: '#F8FAFB',
          text: '#7F8C8D',
          border: '#E8E8E8',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          "'Segoe UI'",
          "'Roboto'",
          "'Oxygen'",
          "'Ubuntu'",
          "'Cantarell'",
          "'Fira Sans'",
          "'Droid Sans'",
          "'Helvetica Neue'",
          'sans-serif',
        ],
        mono: [
          "'SF Mono'",
          "'Monaco'",
          "'Courier New'",
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
