// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // ensure these are always generated
    'bg-background',
    'text-foreground',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border:   'hsl(var(--border))',
        input:    'hsl(var(--input))',
        ring:     'hsl(var(--ring))',
        background:'hsl(var(--background))',
        foreground:'hsl(var(--foreground))',
        primary: {
          DEFAULT:  'hsl(var(--primary))',
          foreground:'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:  'hsl(var(--secondary))',
          foreground:'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:  'hsl(var(--destructive))',
          foreground:'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:  'hsl(var(--muted))',
          foreground:'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:  'hsl(var(--accent))',
          foreground:'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT:  'hsl(var(--popover))',
          foreground:'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT:  'hsl(var(--card))',
          foreground:'hsl(var(--card-foreground))',
        },
        // sidebar & brand
        'sidebar-background':         'hsl(var(--sidebar-background))',
        'sidebar-foreground':         'hsl(var(--sidebar-foreground))',
        'sidebar-primary':            'hsl(var(--sidebar-primary))',
        'sidebar-primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
        'sidebar-accent':             'hsl(var(--sidebar-accent))',
        'sidebar-accent-foreground':  'hsl(var(--sidebar-accent-foreground))',
        'sidebar-border':             'hsl(var(--sidebar-border))',
        'sidebar-ring':               'hsl(var(--sidebar-ring))',
        'brand-purple':               'hsl(var(--brand-purple))',
        'brand-light-purple':         'hsl(var(--brand-light-purple))',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        lg:      'var(--radius)',
        md:      'calc(var(--radius) - 2px)',
        sm:      'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};