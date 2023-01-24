/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  publicRuntimeConfig: {
    BACK_END_ORIGIN: process.env.BACK_END_ORIGIN ?? 'http://localhost:10000'
  },
}

module.exports = nextConfig
