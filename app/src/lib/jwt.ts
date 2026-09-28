import type { VibeJWTPayload } from '@/contract/misc'

export function decodeJwtPayload(jwt: string): VibeJWTPayload | undefined {
    const segment = jwt.split('.')[1]
    if (segment == null || segment === '') {
        return undefined
    }
    try {
        const base64 = segment
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(segment.length / 4) * 4, '=')
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
        const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes))
        if (typeof parsed === 'object' && parsed !== null && 'account_id' in parsed) {
            return parsed as VibeJWTPayload
        }
        return undefined
    } catch {
        return undefined
    }
}
