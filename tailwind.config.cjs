module.exports = {
  mode: 'jit',
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
  ],
  theme: {
    container: {
      center: true,
    },
  },
  plugins: [require('@rotki/ui-library/theme')],
};
