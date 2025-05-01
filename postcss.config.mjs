export default {
  plugins: {
    // The new Tailwind v4 PostCSS plugin
    "@tailwindcss/postcss": {
      // Disable Lightning CSS features that cause issues on Vercel
      lightningcss: {
        // Use more compatible settings
        drafts: {
          customMedia: false,
        },
        include: "page"
      }
    },
    // Auto-prefix CSS for legacy browser support
    "autoprefixer": {},
  },
};