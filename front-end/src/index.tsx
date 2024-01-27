import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './components/App'

dayjs.extend(utc)

window.addEventListener('load', () => {
    // if ('serviceWorker' in navigator) {
    //     navigator.serviceWorker.register('/sw.js')
    // }

    const root = createRoot(document.getElementById('root') as HTMLElement)
    root.render(<App />)
})