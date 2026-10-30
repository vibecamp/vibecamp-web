export const PIN_WIDTH = 24
export const PIN_HEIGHT = 32
export const PIN_HEAD_Y = 12
export const PIN_PATH =
    'M12 .75C5.79.75.75 5.7.75 11.82c0 4.63 3.13 10.13 10.33 19.08a1.18 1.18 0 0 0 1.84 0c7.2-8.95 10.33-14.45 10.33-19.08C23.25 5.7 18.21.75 12 .75Z'
export const PIN_DOT_RADIUS = 4.25

const SVG = 'http://www.w3.org/2000/svg'

export function pinElement(): SVGSVGElement {
    const svg = document.createElementNS(SVG, 'svg')
    svg.setAttribute('class', 'map-pin')
    svg.setAttribute('viewBox', `0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`)
    svg.setAttribute('aria-hidden', 'true')
    const path = document.createElementNS(SVG, 'path')
    path.setAttribute('d', PIN_PATH)
    const dot = document.createElementNS(SVG, 'circle')
    dot.setAttribute('cx', String(PIN_WIDTH / 2))
    dot.setAttribute('cy', String(PIN_HEAD_Y))
    dot.setAttribute('r', String(PIN_DOT_RADIUS))
    svg.append(path, dot)
    return svg
}
