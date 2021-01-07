module.exports = {
  purge: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        background: '#E5E5E5',
        primary: '#D65C36',
        primary2: '#3D3D46',
      },
      spacing: {
        21: '5.188rem',
      },
      backgroundColor: '#E5E5E5',
      fontFamily: {
        sans: ['Source San Pro', 'sans-serif'],
        serif: ['Alverata W01 Bold', 'serif'],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
