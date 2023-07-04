import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App'

window.addEventListener('load', () => {
    const root = createRoot(document.getElementById('root') as HTMLElement)
    root.render(<App />)
})