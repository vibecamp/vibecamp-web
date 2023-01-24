const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true,
  },
  publicRuntimeConfig: {
    BACK_END_ORIGIN: process.env.BACK_END_ORIGIN ?? 'http://127.0.0.1:10000'
  },
}

module.exports = nextConfig
