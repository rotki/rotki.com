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
        shade10: '#B6B6D1',
        shade11: '#404040',
        shade12: '#E36039',
        primary: '#D65C36',
        primary2: '#3D3D46',
      },
      backgroundImage: () => ({
        'rotki-pattern': "url('/img/background.svg')",
        'rotki-logo': "url('/img/rotki.svg')",
        'crypto-pattern': "url('/img/crypto.svg')",
      }),
      fontFamily: {
        sans: ['Source San Pro', 'sans-serif'],
        serif: ['Alverata W01 Bold', 'serif'],
        regular: ['Alverata W01 Regular', 'serif'],
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
