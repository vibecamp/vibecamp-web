import React, { useCallback, useRef, useState } from 'react'
import { ReactZoomPanPinchRef, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch'

import Button from './core/Button'
import Icon from './core/Icon'

const MAP_IMAGE_URL = '/ramblewood-map.png'
const MAP_FILENAME = 'ramblewood-map.png'

const downloadMapImage = async () => {
    const response = await fetch(MAP_IMAGE_URL)
    const blob = await response.blob()

    if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
        const file = new File([blob], MAP_FILENAME, { type: blob.type || 'image/png' })
        await navigator.share({ files: [file], title: 'Ramblewood site map' })
    } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = MAP_FILENAME
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }
}

const MIN_SCALE = 1
const MAX_SCALE = 6
const SLIDER_STEPS = 100

const scaleToSlider = (scale: number) => {
    const ratio = Math.log(scale / MIN_SCALE) / Math.log(MAX_SCALE / MIN_SCALE)
    return Math.round(ratio * SLIDER_STEPS)
}

const sliderToScale = (slider: number) =>
    MIN_SCALE * Math.pow(MAX_SCALE / MIN_SCALE, slider / SLIDER_STEPS)

export default React.memo(() => {
    const transformRef = useRef<ReactZoomPanPinchRef | null>(null)
    const [sliderValue, setSliderValue] = useState(0)

    const handleTransform = useCallback((_ref: ReactZoomPanPinchRef, state: { scale: number }) => {
        setSliderValue(scaleToSlider(state.scale))
    }, [])

    const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const next = Number(e.target.value)
        setSliderValue(next)
        const targetScale = sliderToScale(next)
        const instance = transformRef.current
        if (instance) {
            const { positionX, positionY } = instance.state
            instance.setTransform(positionX, positionY, targetScale, 0)
        }
    }, [])

    const handleZoomIn = useCallback(() => {
        transformRef.current?.zoomIn()
    }, [])

    const handleZoomOut = useCallback(() => {
        transformRef.current?.zoomOut()
    }, [])

    const handleDownload = useCallback(() => {
        void downloadMapImage()
    }, [])

    return (
        <div className='map-view'>
            <TransformWrapper
                ref={transformRef}
                initialScale={1}
                minScale={MIN_SCALE}
                maxScale={MAX_SCALE}
                centerOnInit
                limitToBounds
                doubleClick={{ mode: 'reset' }}
                wheel={{ step: 0.1 }}
                onTransform={handleTransform}
            >
                <TransformComponent
                    wrapperStyle={{ width: '100%', height: '100%' }}
                    contentStyle={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <img
                        src='/ramblewood-map.png'
                        alt='Ramblewood site map'
                        draggable={false}
                        className='map-image'
                    />
                </TransformComponent>
            </TransformWrapper>

            <div className='map-zoom-control'>
                <button type='button' className='map-zoom-btn' onClick={handleZoomIn} aria-label='Zoom in'>
                    <Icon name='add' />
                </button>
                <input
                    type='range'
                    min={0}
                    max={SLIDER_STEPS}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    className='map-zoom-slider'
                    aria-label='Zoom level'
                />
                <button type='button' className='map-zoom-btn' onClick={handleZoomOut} aria-label='Zoom out'>
                    <Icon name='remove' />
                </button>
            </div>

            <Button
                onClick={handleDownload}
                isCompact
                className='map-download-btn'
            >
                <Icon name='file_download' style={{ marginRight: 6 }} />
                Download
            </Button>
        </div>
    )
})
