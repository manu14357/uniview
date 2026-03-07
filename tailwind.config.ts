import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', './demo/**/*.{html,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'uv-primary': 'var(--uv-primary)',
        'uv-secondary': 'var(--uv-secondary)',
        'uv-bg': 'var(--uv-bg)',
        'uv-surface': 'var(--uv-surface)',
        'uv-text': 'var(--uv-text)',
        'uv-text-secondary': 'var(--uv-text-secondary)',
        'uv-border': 'var(--uv-border)',
        'uv-accent': 'var(--uv-accent)',
      },
      width: {
        sidebar: '280px',
      },
      spacing: {
        toolbar: '48px',
      },
    },
  },
  plugins: [],
};

export default config;
