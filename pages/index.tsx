import Head from 'next/head'

import styles from './index.module.scss'
import { NextPageWithLayout } from './_app'

const Index: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>vibecamp</title>
        <meta name="description" content="vibe.camp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.headSection}>
        <div className={styles.stars}>
          {starsData.map((style, index) =>
            <div
              className={styles.star}
              style={style}
              key={index}
            />)}
        </div>

        VIBECAMP
        <img src="/twitter.png" />
      </div>
    </>
  )
}

const starsData = new Array(50).fill(null).map(() => ({
  left: Math.floor(Math.random() * 100) + '%',
  top: Math.floor(Math.random() * 100) + '%',
  '--size': Math.floor(Math.random() * 4 + 1) + 'px',
  '--delay': Math.floor(Math.random() * 100) / 100 + 's'
}))

export default Index