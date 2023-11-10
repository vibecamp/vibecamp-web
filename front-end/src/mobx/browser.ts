import { observable } from 'mobx'

export const windowSize = (() => {
    const size = observable({ width: window.innerWidth, height: window.innerHeight })

    window.addEventListener('resize', () => {
        size.width = window.innerWidth
        size.height = window.innerHeight
    })

    return size
})()
