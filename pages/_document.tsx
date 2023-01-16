import { Html, Head, Main, NextScript } from 'next/document'
import { CSSProperties } from 'react'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
        />
      </Head>
      <body className='main-theme'>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
