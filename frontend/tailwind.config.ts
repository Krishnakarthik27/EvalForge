import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#09090b',
        panel: '#111113',
        line: '#27272a',
        forge: '#e86a3c',
        ember: '#f2b66d',
        mist: '#a1a1aa'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(242, 182, 109, 0.12), 0 24px 60px rgba(0, 0, 0, 0.32)'
      }
    }
  },
  plugins: []
};

export default config;
