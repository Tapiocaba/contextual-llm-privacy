import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        text: '#0a0c09',
        background: '#f6f8f5',
        primary: '#7ccd49',
        secondary: '#b8c9ad',
        accent: '#9eb88d',
      },
    },
  },
  plugins: [],
} satisfies Config
