/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
    experimental: {
    serverActions: true,
    serverActionsBodySizeLimit: '50mb',  // Increase limit to 50MB or suitable size
  },

}

export default nextConfig
