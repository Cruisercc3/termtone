/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // tsc --noEmit is clean, so type errors should fail the build
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
