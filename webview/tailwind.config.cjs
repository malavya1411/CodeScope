module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map Tailwind colors to CSS variables injected by the extension
        bg: {
          primary: 'var(--cs-bg-primary)',
          secondary: 'var(--cs-bg-secondary)',
          tertiary: 'var(--cs-bg-tertiary)',
          hover: 'var(--cs-bg-hover)',
          selected: 'var(--cs-bg-selected)',
        },
        fg: {
          primary: 'var(--cs-fg-primary)',
          secondary: 'var(--cs-fg-secondary)',
          muted: 'var(--cs-fg-muted)',
        },
        accent: {
          DEFAULT: 'var(--cs-accent)',
          hover: 'var(--cs-accent-hover)',
          fg: 'var(--cs-accent-fg)',
        },
        border: {
          DEFAULT: 'var(--cs-border)',
          light: 'var(--cs-border-light)',
        },
        status: {
          success: 'var(--cs-success)',
          warning: 'var(--cs-warning)',
          error: 'var(--cs-error)',
          info: 'var(--cs-info)',
        },
        risk: {
          low: 'var(--cs-risk-low)',
          medium: 'var(--cs-risk-medium)',
          high: 'var(--cs-risk-high)',
          critical: 'var(--cs-risk-critical)',
        }
      },
      fontFamily: {
        sans: ['var(--cs-font-ui)'],
        mono: ['var(--cs-font-mono)'],
      },
      fontSize: {
        base: ['var(--cs-font-size)', '1.5'],
      }
    },
  },
  plugins: [],
}
