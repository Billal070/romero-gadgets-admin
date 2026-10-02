/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#F0F4FA',
          100: '#DCE5F2',
          200: '#B9CCE4',
          300: '#8AA6CC',
          400: '#5B7FB3',
          500: '#3A5F94',
          600: '#2A4A7A',
          700: '#1E3A66',
          800: '#142B52',
          900: '#0A1F44',
          950: '#061430'
        },
        brand: {
          50: '#EFF5FF',
          100: '#DBE7FE',
          200: '#BFD4FE',
          300: '#93B4F8',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
          800: '#1E3A8A',
          900: '#172554'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(10, 31, 68, 0.06), 0 1px 2px -1px rgba(10, 31, 68, 0.06)',
        'card-hover': '0 8px 24px -6px rgba(10, 31, 68, 0.12)',
        modal: '0 20px 60px -15px rgba(10, 31, 68, 0.25)'
      }
    }
  },
  plugins: []
}
