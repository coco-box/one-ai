const { fontFamily } = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'one-',
  darkMode: ["class"],
  content: ["./src/**/*.{html,js,jsx,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'on-primary': 'var(--text-on-primary-bg)',

        'primary': 'var(--bg-primary)',
        'primary-hover': 'var(--bg-primary-hover)',
        'primary-active': 'var(--bg-primary-active)',
        'primary-disabled': 'var(--bg-primary-disabled)',

        'danger': 'var(--bg-danger)',
        'danger-hover': 'var(--bg-danger-hover)',
        'danger-active': 'var(--bg-danger-active)',
        'danger-disabled': 'var(--bg-danger-disabled)',
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans],
      },
    },
  },
  plugins: [],
};
