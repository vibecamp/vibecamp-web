/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // TODO: remove this when we move API into Next.js
    transpilePackages: ['../../back-end'],
    sassOptions: {
        silenceDeprecations: ['legacy-js-api'],
    },
}

module.exports = nextConfig
