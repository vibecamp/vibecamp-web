import { useEffect, useMemo, useState } from 'react'

export default function usePrefersDarkTheme() {
    const darkModePreference = useMemo(() => window.matchMedia('(prefers-color-scheme: dark)'), [])
    const [prefers, setPrefers] = useState(darkModePreference.matches)

    useEffect(() => {
        const handle = (e: MediaQueryListEvent) => setPrefers(e.matches)
        darkModePreference.addEventListener('change', handle)
        return () => darkModePreference.removeEventListener('change', handle)
    }, [darkModePreference])

    return prefers
}