import React from 'react'
import { observer } from 'mobx-react-lite'
import { QRCodeSVG } from 'qrcode.react'

type Props = {
    name: string,
    ticketType: 'adult' | 'child'
}

const TICKET_WIDTH = 750
const TICKET_HEIGHT = 300
const SHADOW_PADDING = 15
const TEAR_POINT = 610
const QR_HEIGHT = '50%'

const NAME_FONT_SIZE = 30
const TYPE_FONT_SIZE = 18

export default observer(({ name, ticketType }: Props) => {

    return (
        <div style={{ width: '100%', position: 'relative', overflow: 'hidden' }}>
            <svg viewBox={`${-1 * SHADOW_PADDING} ${-1 * SHADOW_PADDING} ${TICKET_WIDTH + SHADOW_PADDING * 2} ${TICKET_HEIGHT + SHADOW_PADDING * 2}`} style={{ width: '100%', minWidth: 500 }} xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                        {/* <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="black" floodOpacity="0.12" /> */}
                        <feDropShadow dx="0" dy="3" stdDeviation="8" floodColor="black" floodOpacity="0.24" />
                    </filter>

                    <mask id="holes">
                        <rect x={-1 * SHADOW_PADDING} y={-1 * SHADOW_PADDING} width={TICKET_WIDTH + SHADOW_PADDING * 2} height={TICKET_HEIGHT + SHADOW_PADDING * 2} fill="white" />

                        <circle cx="0" cy={TICKET_HEIGHT / 2} r="50" fill="black" />
                        <circle cx={TEAR_POINT} cy="0" r="10" fill="black" />
                        <circle cx={TEAR_POINT} cy="300" r="10" fill="black" />

                        <line x1={TEAR_POINT} y1="0" x2={TEAR_POINT} y2={TICKET_HEIGHT} stroke="black" strokeDasharray="4" />
                    </mask>

                    <pattern id="imgpattern" x="0" y="0" width="1" height="1"
                        viewBox="0 0 1024 576" preserveAspectRatio="xMidYMid slice">
                        <image width="1024" height="576" xlinkHref={ticketType === 'adult' ? '/swirl1.png' : '/swirl2.png'} />
                    </pattern>
                </defs>

                <g filter="url(#shadow)">
                    <rect x="0" y="0" width={TEAR_POINT} height={TICKET_HEIGHT} rx="1" ry="1" fill="white" mask="url(#holes)" />
                    <rect x={TEAR_POINT} y="0" width={TICKET_WIDTH - TEAR_POINT} height={TICKET_HEIGHT} rx="1" ry="1" fill="url(#imgpattern)" mask="url(#holes)" />
                </g>

                <g transform={`translate(${TICKET_WIDTH * 0.1}, ${TICKET_HEIGHT * 0.5})`}>
                    <text x={0} y={0} style={{ fontWeight: 'bold', fontSize: NAME_FONT_SIZE }} opacity="0.8">
                        {name}
                    </text>
                    <text x={0} y={NAME_FONT_SIZE} style={{ fontSize: TYPE_FONT_SIZE }} opacity="0.8">
                        {ticketType === 'adult' ? 'adult ticket' : 'child ticket'}
                    </text>
                </g>
            </svg>

            {/* TODO: When QR code is tapped, open a big bright one for easier scanning */}
            <QRCodeSVG value="https://vibe.camp" style={{ position: 'absolute', height: QR_HEIGHT, width: 'auto', top: `calc(50% - (${QR_HEIGHT} / 2))`, left: '50%', opacity: 0.8 }} />
        </div>
    )
})
