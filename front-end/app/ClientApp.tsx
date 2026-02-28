'use client'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import React from 'react'

import App from '../src/components/App'

dayjs.extend(utc)

export default function ClientApp() {
    return <App />
}
