'use client'

import { useSearchParams } from 'next/navigation'
import { safeNextPath } from '@/lib/routes'

export default function useNextPath(): string {
    return safeNextPath(useSearchParams().get('next'))
}
