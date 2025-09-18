import type { Config } from 'tailwindcss';
import rotkiTheme from '@rotki/ui-library/theme';

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  mode: 'jit',
  plugins: [
    rotkiTheme, // This provides all the rui- colors and utilities
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
      },
    },
    fontFamily: {
      mono: ['Roboto Mono'],
    },
  },
} satisfies Config;
