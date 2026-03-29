import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#004D98',
          red: '#A50044',
        },
        severity: {
          ok: '#1FCC7A',
          warn: '#FFB020',
          danger: '#FF3B5C',
          info: '#3B9EFF',
          fingerprint: '#FF5FA8',
        },
        surface: {
          DEFAULT: '#141820',
          2: '#1C2030',
          3: '#242840',
        },
        border: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          2: 'rgba(255,255,255,0.10)',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
