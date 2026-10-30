import type { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types'
import type { useRouter } from 'next/navigation'

// a full prefetch caches the whole page, so tapping through to it never waits on the server
export const prefetchPage = (router: ReturnType<typeof useRouter>, href: string) =>
    router.prefetch(href, { kind: 'full' as unknown as PrefetchKind })
