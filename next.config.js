/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Workaround for LightningCSS issues on Vercel
    serverComponentsExternalPackages: ['lightningcss'],
  },
  // Force webpack to not use platform-specific versions of lightningcss
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fix CSS issues by explicitly setting the CSS minifier
      config.optimization.minimizer = config.optimization.minimizer.filter(
        (minimizer) => {
          return minimizer.constructor.name !== 'CssMinimizerPlugin';
        }
      );
    }
    
    return config;
  },
}

module.exports = nextConfig; 