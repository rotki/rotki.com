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
        background: '#F9FAFB',
        shade1: '#edf0f3',
        shade2: '#E6E6E6',
        shade5: '#BFBFBF',
        shade8: '#808080',
        shade7: '#7E7E91',
        shade11: '#404040',
        shade12: '#E36039',
        primary: '#D65C36',
        primary2: '#3D3D46',
      },
      spacing: {
        21: '5.188rem',
        37: '9.064rem',
        101: '31.25rem',
      },
      backgroundImage: () => ({
        'rotki-pattern': "url('/img/background.svg')",
        'rotki-logo': "url('/img/rotki.svg')",
      }),
      fontFamily: {
        sans: ['Source San Pro', 'sans-serif'],
        serif: ['Alverata W01 Bold', 'serif'],
        regular: ['Alverata W01 Regular', 'serif'],
      },
      fontSize: {
        '5.5xl': '3.25rem',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
