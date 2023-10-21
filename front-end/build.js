/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */

const fs = require('fs').promises
const crypto = require('crypto')
const esbuild = require('esbuild')

const watch = process.argv.includes('--watch')
const minify = process.argv.includes('--minify');

(async function() {
    let dotEnvEntries
    try {
        const contents = (await fs.readFile('.env')).toString('utf-8')
        dotEnvEntries = contents.split('\n')
            .filter(line => !line.trim().startsWith('#'))
            .map(line => line.split('='))
    } catch {
        dotEnvEntries = []
    }
    const env = Object.fromEntries(
        dotEnvEntries.concat(Object.entries(process.env))
            .map(([key, value]) => [key, JSON.stringify(value)])
    )

    const appBundleOutput = 'out/app.js'
    
    const appOptions = {
        entryPoints: ['src/index.tsx'],
        outfile: appBundleOutput,
        bundle: true,
        minify,
        define: env
    }

    const serviceWorkerOptions = {
        entryPoints: ['src/sw.ts'],
        outfile: 'out/sw.js',
        bundle: true,
        minify
    }

    if (watch) {
        Promise.all([
            esbuild.context(appOptions).then(ctx => ctx.watch()),
            esbuild.context(serviceWorkerOptions).then(ctx => ctx.watch())
        ])
    } else {
        await esbuild.build(appOptions)

        const bundleContents = await fs.readFile(appBundleOutput)
        const bundleHash = crypto.createHash('md5').update(bundleContents).digest('hex')

        await esbuild.build({
            ...serviceWorkerOptions,
            define: {
                BUNDLE_HASH: JSON.stringify(bundleHash)
            }
        })
    }
})()