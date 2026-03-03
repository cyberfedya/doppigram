/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0a0a10',
          panel: '#13131c',
          chat: '#0f0f18',
          card: '#16161f',
          input: '#1a1a2c',
          hover: '#18182a',
          active: '#1a2240',
          border: '#1e1e2c',
          divider: '#23232f',
        },
        accent: {
          DEFAULT: '#4a6cf7',
          hover: '#5b7cff',
          glow: 'rgba(74,108,247,0.35)',
        },
        purple: {
          grad: '#6c3de5',
        },
        tx: {
          primary: '#f0f0f8',
          secondary: '#8888b0',
          muted: '#5a5a88',
          dim: '#38385a',
          ghost: '#28283e',
        },
        online: '#3db87a',
        danger: '#e05252',
      },
      borderRadius: {
        panel: '20px',
        modal: '20px',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
