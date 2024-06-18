import { useCallback, useState } from 'react'

import { useWindowEvent } from './utils'

export default function useWindowSize() {
    const [size, setSize] = useState(getSize())
    const updateSize = useCallback(() => setSize(getSize()), [])

    useWindowEvent('resize', updateSize)

    return size
}

const getSize = () => ({ width: window.innerWidth, height: window.innerHeight })
