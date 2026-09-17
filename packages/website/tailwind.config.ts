import type { Config } from 'tailwindcss';
import rotkiTheme from '@rotki/ui-library/theme';

export default {
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/modules/**/*.{vue,js,ts}',
    './app/pages/**/*.vue',
  ],
  darkMode: 'class',
  plugins: [rotkiTheme],
  theme: {
    container: { center: true },
  },
} satisfies Config;
