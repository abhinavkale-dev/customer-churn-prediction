/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    swcMinify: true,
  },
  webpack: (config, { isServer }) => {
    // Force disable the use of lightningcss in Next.js
    if (!isServer) {
      config.experiments = {
        ...config.experiments,
        css: false,
      };
    }
    return config;
  }
};

module.exports = nextConfig; 