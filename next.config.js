/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Workaround for LightningCSS issues on Vercel
    serverComponentsExternalPackages: ['lightningcss'],
    // Skip dependency check - we handle this in our custom install script
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
  },
  // Disable built-in CSS minification to avoid lightningcss issues
  swcMinify: true,
  // Force webpack to not use platform-specific versions of lightningcss
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fix CSS issues by explicitly setting the CSS minifier
      if (config.optimization && config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.filter(
          (minimizer) => {
            return minimizer.constructor.name !== 'CssMinimizerPlugin';
          }
        );
      }
      
      // Use empty module for lightningcss
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        'lightningcss': require.resolve('./scripts/lightningcss-stub.js')
      };
    }
    
    return config;
  },
}

module.exports = nextConfig; 