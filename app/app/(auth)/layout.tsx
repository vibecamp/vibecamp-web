import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
    return <main className='page-scroll'>{children}</main>
}
