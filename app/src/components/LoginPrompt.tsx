'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { createContext, type ReactNode, useCallback, useContext, useState } from 'react'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { DEFAULT_PATH, loginPath, SIGNUP_PATH, withNext } from '@/lib/routes'
import ButtonLink from './core/ButtonLink'
import Modal from './core/Modal'

const LoginPromptContext = createContext<(next?: string) => void>(() => {})

export function LoginPromptProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const search = useSearchParams().toString()
    const [next, setNext] = useState<string | null>(null)

    const prompt = useCallback(
        (target?: string) =>
            setNext(target ?? (search === '' ? pathname : `${pathname}?${search}`)),
        [pathname, search],
    )

    const destination = next ?? DEFAULT_PATH

    return (
        <LoginPromptContext.Provider value={prompt}>
            {children}
            <Modal
                isOpen={next != null}
                onClose={() => setNext(null)}
                title={t('guest.loginPromptTitle')}
            >
                {() => (
                    <div className='stack'>
                        <ButtonLink href={loginPath(destination)} isPrimary className='block'>
                            {t('login.submit')}
                        </ButtonLink>
                        <ButtonLink href={withNext(SIGNUP_PATH, destination)} className='block'>
                            {t('login.createAccount')}
                        </ButtonLink>
                    </div>
                )}
            </Modal>
        </LoginPromptContext.Provider>
    )
}

export function useMembersOnly() {
    const { loggedIn } = useStore()
    const promptLogin = useContext(LoginPromptContext)
    return useCallback(
        (next?: string) => {
            if (loggedIn) return false
            promptLogin(next)
            return true
        },
        [loggedIn, promptLogin],
    )
}
