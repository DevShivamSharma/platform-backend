export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        'ink-2': '#111111',
        'ink-3': '#1a1a1a',
        'ink-4': '#2a2a2a',
        paper: '#fafaf7',
        'paper-2': '#f1efe9',
        mute: '#6b6b6b',
        'mute-2': '#9a9a9a',
        accent: '#ff5b1f',
        'accent-2': '#e34a14',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'Segoe UI', 'Helvetica', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      keyframes: {
        'lm-marquee-scroll': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'lm-scroll-bar': {
          '0%': { transform: 'scaleY(0)', transformOrigin: 'top' },
          '45%': { transform: 'scaleY(1)', transformOrigin: 'top' },
          '55%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
        },
      },
      animation: {
        'lm-marquee-scroll': 'lm-marquee-scroll 38s linear infinite',
        'lm-scroll-bar': 'lm-scroll-bar 1.8s ease-in-out infinite',
      },
    },
  },
};
