import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './components/App'

window.addEventListener('load', () => {
    // if ('serviceWorker' in navigator) {
    //     navigator.serviceWorker.register('/sw.js')
    // }

    const root = createRoot(document.getElementById('root') as HTMLElement)
    root.render(<App />)
})