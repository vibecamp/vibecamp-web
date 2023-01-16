import { useCallback, useEffect, useState } from "react";
import { isClientSide } from "../utils/misc";

export default function useViewportSize() {
    const [viewportSize, setViewportSize] = useState(
        isClientSide()
            ? { width: window.innerWidth, height: window.innerHeight }
            : { width: 0, height: 0 }
    )

    const updateViewportSize = useCallback(() => {
        setViewportSize({ width: window.innerWidth, height: window.innerHeight })
    }, [])

    useEffect(() => {
        window.addEventListener('resize', updateViewportSize)
        return () => window.removeEventListener('resize', updateViewportSize)
    })

    return viewportSize
}