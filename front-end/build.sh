#!/bin/bash

mkdir -p out/

cp public/* out/

npx sass src/index.scss out/app.css
npx esbuild src/index.tsx --outfile=out/app.js --bundle --minify
