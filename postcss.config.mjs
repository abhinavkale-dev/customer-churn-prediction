export default {
  plugins: {
    // The new Tailwind v4 PostCSS plugin
    "@tailwindcss/postcss": {
      // Completely disable LightningCSS features
      lightningcss: false,
      // Use compatibility mode
      compatibility: true
    },
    // Auto-prefix CSS for legacy browser support
    "autoprefixer": {},
  },
};