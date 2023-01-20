import { useCallback, useEffect, useRef, useState } from "react";
import { isClientSide } from "../utils/misc";

export default function useViewportSize() {
    const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

    const updateViewportSize = useCallback(() => {
        setViewportSize({ width: window.innerWidth, height: window.innerHeight })
    }, [])

    useEffect(() => {
        updateViewportSize()
        window.addEventListener('resize', updateViewportSize)
        return () => window.removeEventListener('resize', updateViewportSize)
    }, [])

    return viewportSize
}