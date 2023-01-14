import './globals.scss'
import { AppProps } from 'next/app'
import { NextPage } from 'next'
import { ReactElement, ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? ((page) => page)
  const router = useRouter()

  useEffect(() => {
    if (router.pathname !== '/admin') {
      document.body.classList.add('main-theme')
    } else {
      document.body.classList.remove('main-theme')
    }
  })

  return <>
    {getLayout(<Component {...pageProps} />)}
  </>
}

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: GetLayoutFn
}

export type GetLayoutFn = (content: ReactElement) => ReactNode
