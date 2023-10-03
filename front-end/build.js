/* eslint-env node */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs').promises
// eslint-disable-next-line @typescript-eslint/no-var-requires
const esbuild = require('esbuild')

const watch = process.argv.includes('--watch')
const minify = process.argv.includes('--minify');

(async function() {
    let dotEnvEntries
    try {
        const contents = (await fs.readFile('.env')).toString('utf-8')
        dotEnvEntries = contents.split('\n').map(line => line.split('='))
    } catch {
        dotEnvEntries = []
    }
    const define = Object.fromEntries(
        dotEnvEntries.concat(Object.entries(process.env))
            .map(([key, value]) => [key, JSON.stringify(value)])
    )
    
    const appOptions = {
        entryPoints: ['src/index.tsx'],
        outfile: 'out/app.js',
        bundle: true,
        minify,
        define
    }

    const serviceWorkerOptions = {
        entryPoints: ['src/sw.ts'],
        outfile: 'out/sw.js',
        bundle: true,
        minify,
        define
    }

    if (watch) {
        Promise.all([
            esbuild.context(appOptions).then(ctx => ctx.watch()),
            esbuild.context(serviceWorkerOptions).then(ctx => ctx.watch())
        ])
    } else {
        Promise.all([
            esbuild.build(appOptions),
            esbuild.build(serviceWorkerOptions)
        ])
    }
})()