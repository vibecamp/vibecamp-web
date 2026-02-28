'use client'

import dynamic from 'next/dynamic'
import React from 'react'

const ClientApp = dynamic(() => import('./ClientApp'), { ssr: false })

export default function Page() {
    return <ClientApp />
}
