import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    poweredByHeader: false,
    agentRules: false,
    experimental: {
        // pages render from client-side data, so their server payload is a shell that's safe to reuse
        staleTimes: { dynamic: 300, static: 1800 },
    },
    async redirects() {
        return [{ source: '/events', destination: '/schedule', permanent: true }]
    },
}

export default nextConfig
