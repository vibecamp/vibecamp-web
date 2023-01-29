import './globals.scss'
import { AppProps } from 'next/app'
import { NextPage } from 'next'
import React, { FC, ReactElement, ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { identityFn, isClientSide } from '../utils/misc'

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? identityFn;

  return <>
    <MainThemeProvider>
      <MobileNavOpenContextProvider>
        {getLayout(<Component {...pageProps} />)}
      </MobileNavOpenContextProvider>
    </MainThemeProvider>
  </>
}

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: GetLayoutFn
}

export type GetLayoutFn = (content: ReactElement) => ReactNode

export const MobileNavOpenContext = React.createContext({ isOpen: false, setIsOpen: (isOpen: boolean) => { } })

const MainThemeProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  useBodyClass('main-theme', router.pathname !== '/admin');

  return <>{children}</>
}

const MobileNavOpenContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  useBodyClass('no-scroll', isOpen)

  return (
    <MobileNavOpenContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </MobileNavOpenContext.Provider>
  )
}

function useBodyClass(className: string, condition: boolean) {
  useEffect(() => {
    if (isClientSide()) {
      try {
        if (condition) {
          document.body.classList.add(className)
        } else {
          document.body.classList.remove(className)
        }
      } catch (e) {
        console.log(e)
      }
    }
  }, [className, condition])
}
