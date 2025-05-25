import { QRCodeSVG } from 'qrcode.react'
import React, { useCallback, useState } from 'react'

import { Tables } from '../../../../back-end/types/db-types'

type Props = {
    name: string | undefined,
    description: string,
    ticketType: 'adult' | 'child' | undefined,
    ownedByAccountId: Tables['purchase']['owned_by_account_id']
}

const TICKET_WIDTH = 750
const TICKET_HEIGHT = 300
const SHADOW_PADDING = 15
const TEAR_POINT = 610
const QR_HEIGHT = '50%'

const NAME_FONT_SIZE = 30
const TYPE_FONT_SIZE = 18

export default React.memo(({ name, description, ticketType, ownedByAccountId }: Props) => {
    const [qrCodeZoom, setQrCodeZoom] = useState(false)

    const toggleQRCodeZoom = useCallback(() => setQrCodeZoom(v => !v), [])

    return (
        <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
            <svg viewBox={`${-1 * SHADOW_PADDING} ${-1 * SHADOW_PADDING} ${TICKET_WIDTH + SHADOW_PADDING * 2} ${TICKET_HEIGHT + SHADOW_PADDING * 2}`} style={{ width: '100%', minWidth: 300 }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="black" floodOpacity="0.24" />
                    </filter>

                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" floodColor="white" floodOpacity="1" />
                    </filter>

                    <mask id="holes">
                        <rect x={-1 * SHADOW_PADDING} y={-1 * SHADOW_PADDING} width={TICKET_WIDTH + SHADOW_PADDING * 2} height={TICKET_HEIGHT + SHADOW_PADDING * 2} fill="white" />

                        <circle cx="0" cy={TICKET_HEIGHT / 2} r="40" fill="black" />

                        <circle cx={TEAR_POINT} cy="0" r="10" fill="black" />
                        <circle cx={TEAR_POINT} cy="300" r="10" fill="black" />

                        <circle cx={TICKET_WIDTH} cy={TICKET_HEIGHT / 2} r="40" fill="black" />

                        <line x1={TEAR_POINT} y1="0" x2={TEAR_POINT} y2={TICKET_HEIGHT} stroke="black" strokeDasharray="6" strokeWidth={2} />
                    </mask>

                    <pattern id="logopattern" x="0" y="0" width="1" height="1"
                        viewBox={`${-1 * SHADOW_PADDING} ${-1 * SHADOW_PADDING} ${TICKET_WIDTH + SHADOW_PADDING * 2} ${TICKET_HEIGHT + SHADOW_PADDING * 2}`} preserveAspectRatio="xMidYMid slice">
                        <rect x={-1 * SHADOW_PADDING} y={-1 * SHADOW_PADDING} width={TICKET_WIDTH + SHADOW_PADDING * 2} height={TICKET_HEIGHT + SHADOW_PADDING * 2} fill="white" />
                        <image x="100" y="-100" width="500" height="500" xlinkHref='/vibecamp.png' opacity={0.1} />
                    </pattern>

                    <pattern id="swirlpattern" x="0" y="0" width="1" height="1"
                        viewBox="0 0 1024 576" preserveAspectRatio="xMidYMid slice">
                        <image width="1024" height="576" xlinkHref={ticketType === 'adult' || ticketType == null ? '/swirl1.png' : '/swirl2.png'} />
                    </pattern>
                </defs>

                <g filter="url(#shadow)">
                    <rect x="0" y="0" width={TEAR_POINT} height={TICKET_HEIGHT} rx="1" ry="1" fill="url(#logopattern)" mask="url(#holes)" />
                    <rect x={TEAR_POINT} y="0" width={TICKET_WIDTH - TEAR_POINT} height={TICKET_HEIGHT} rx="1" ry="1" fill="url(#swirlpattern)" mask="url(#holes)" />
                </g>

                {/* <g transform={`translate(${TICKET_WIDTH * 0.1}, ${TICKET_HEIGHT * 0.5})`} filter="url(#glow)">
                    <text x={0} y={0} style={{ fontWeight: 'bold', fontSize: NAME_FONT_SIZE }} opacity={FOREGROUND_OPACITY}>
                        {name}
                    </text>
                    <text x={0} y={NAME_FONT_SIZE} style={{ fontSize: TYPE_FONT_SIZE }} opacity={FOREGROUND_OPACITY}>
                        {ticketType == null ? '' : ticketType === 'adult' ? 'adult ticket' : 'child ticket'}
                    </text>
                </g> */}
            </svg>

            <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', display: 'flex', justifyContent: 'flex-start', alignItems: 'center', paddingLeft: 40, color: 'black' }}>
                {description}
            </div>

            <div onClick={toggleQRCodeZoom} style={qrCodeZoom ? QR_CODE_CONTAINER_ZOOMED_STYLE : QR_CODE_CONTAINER_STYLE}>
                <QRCodeSVG
                    value={`${ownedByAccountId}`}
                    style={{ width: '100%', height: '100%', maxWidth: '80vw', maxHeight: '80vh' }}
                />
            </div>
        </div>
    )
})

const QR_CODE_CONTAINER_STYLE = {
    position: 'absolute',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: QR_HEIGHT,
    width: 'auto',
    top: `calc(50% - (${QR_HEIGHT} / 2))`,
    left: '50%',
    cursor: 'pointer'
} as const

const QR_CODE_CONTAINER_ZOOMED_STYLE = {
    ...QR_CODE_CONTAINER_STYLE,
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'white',
    zIndex: 1000
} as const
