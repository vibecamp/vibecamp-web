import { useCallback, useEffect, useState } from "react";

export default function useViewportSize() {
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

    const updateViewportSize = useCallback(() => {
        setViewportSize({ width: window.innerWidth, height: window.innerHeight })
    }, [])

    useEffect(() => {
        updateViewportSize()
        window.addEventListener('resize', updateViewportSize)
        return () => window.removeEventListener('resize', updateViewportSize)
    }, [updateViewportSize])

    return viewportSize
}