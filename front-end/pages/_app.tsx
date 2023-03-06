import './globals.scss'
import { AppProps } from 'next/app'
import { NextPage } from 'next'
import React, { FC, ReactElement, ReactNode, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { identityFn, isClientSide } from '../utils/misc'
import { JWTUserInfo } from '../../common/data'
import { getJwtPayload } from '../api/auth'

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function App({ Component, pageProps }: AppPropsWithLayout) {
  const getLayout = Component.getLayout ?? identityFn;

  return <>
    <MainThemeProvider>
      <MobileNavOpenContextProvider>
        <UserInfoContextProvider>
          {getLayout(<Component {...pageProps} />)}
        </UserInfoContextProvider>
      </MobileNavOpenContextProvider>
    </MainThemeProvider>
  </>
}

export type NextPageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
  getLayout?: GetLayoutFn
}

export type GetLayoutFn = (content: ReactElement) => ReactNode

const MainThemeProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  useBodyClass('main-theme', router.pathname !== '/admin');

  return <>{children}</>
}

export const MobileNavOpenContext = React.createContext({ isOpen: false, setIsOpen: (isOpen: boolean) => { } })

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
    if (condition) {
      document.body.classList.add(className)
    } else {
      document.body.classList.remove(className)
    }
  }, [className, condition])
}

export const UserInfoContext = React.createContext<{ userInfo: JWTUserInfo | undefined, updateUserInfo: () => void }>({ userInfo: undefined, updateUserInfo: () => { } })

const UserInfoContextProvider: FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<JWTUserInfo | undefined>(undefined)

  const updateUserInfo = useCallback(() => {
    setUserInfo(getJwtPayload())
  }, [])

  useEffect(() => {
    updateUserInfo()
  }, [updateUserInfo])

  return (
    <UserInfoContext.Provider value={{ userInfo, updateUserInfo }}>
      {children}
    </UserInfoContext.Provider>
  )
}