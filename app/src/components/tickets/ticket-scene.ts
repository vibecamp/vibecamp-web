import {
    AdditiveBlending,
    BackSide,
    BufferAttribute,
    BufferGeometry,
    CanvasTexture,
    Color,
    DirectionalLight,
    ExtrudeGeometry,
    Mesh,
    MeshBasicMaterial,
    MeshPhysicalMaterial,
    NeutralToneMapping,
    NoColorSpace,
    Path,
    PerspectiveCamera,
    PlaneGeometry,
    PMREMGenerator,
    Points,
    PointsMaterial,
    Scene,
    Shape,
    SphereGeometry,
    SRGBColorSpace,
    Texture,
    WebGLRenderer,
} from 'three'
import { t } from '@/copy/t'
import { formatDateRange } from '@/lib/dates'

const W = 1.6
const H = 2.8
const STUB = 0.62
const NOTCH = 0.09
const CORNER = 0.12
const FACE_W = 640
const FACE_H = 1120
const PERF_Y = FACE_H * (1 - STUB / H)
const NOTCH_PX = (NOTCH / W) * FACE_W
const CORNER_PX = (CORNER / W) * FACE_W
const INK = '#1b171a'
const CREAM = '#fff6dc'
const SPECK = '#fff8e8'
const TAU = Math.PI * 2

const LOOP_SECONDS = 3
const GLINT_SECONDS = 7
const VIDEO_SECONDS = 4.5
const FPS = 30
const VIDEO_SIZE = { width: 1080, height: 1350 }
const STARS = 6
const INSET = 28
const HOLE_SPACING = 22
const HOLE_RADIUS = 5.6
const WORD_Y = PERF_Y * 0.27
const FRAME = { y: INSET, height: PERF_Y - 2 * INSET }
const SKY = { x: 80, y: WORD_Y + 80, width: FACE_W - 160, height: 230 }

export type TicketInfo = {
    purchase_id: string
    holder: string | null
    festival_name: string
    start_date: string
    end_date: string
    secret: { position: number; word: string } | null
}

export type TicketFaces = {
    color: HTMLCanvasElement
    data: HTMLCanvasElement
    glow: HTMLCanvasElement
    foil: HTMLCanvasElement
    swirl: HTMLImageElement
}

export type TicketPose = {
    turn: number
    tilt: number
    lift: number
    time: number
    sweep: number
}

const loopPose = (progress: number): TicketPose => ({
    turn: -0.18 + 0.24 * Math.sin(TAU * progress),
    tilt: 0.05 * Math.sin(TAU * progress + 1),
    lift: 0.04 * Math.sin(2 * TAU * progress),
    time: progress * LOOP_SECONDS,
    sweep: 0.5 + 0.5 * Math.sin(TAU * progress),
})

function canvas(width: number, height: number) {
    return Object.assign(document.createElement('canvas'), { width, height })
}

function context(target: HTMLCanvasElement) {
    const g = target.getContext('2d')
    if (!g) throw new Error('2D canvas unavailable')
    return g
}

async function loadImage(src: string) {
    const image = new Image()
    image.src = src
    await image.decode()
    return image
}

function random(seed: string) {
    let a = Number.parseInt(seed.replaceAll('-', '').slice(0, 8), 16) || 1
    return () => {
        a = (a + 0x6d2b79f5) | 0
        let x = Math.imul(a ^ (a >>> 15), 1 | a)
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296
    }
}

function inkOnly(image: HTMLImageElement) {
    const out = canvas(image.naturalWidth, image.naturalHeight)
    const g = context(out)
    g.drawImage(image, 0, 0)
    const pixels = g.getImageData(0, 0, out.width, out.height)
    const d = pixels.data
    for (let i = 0; i < d.length; i += 4) {
        const dark = (d[i + 3] ?? 0) > 128 && (d[i] ?? 0) + (d[i + 1] ?? 0) + (d[i + 2] ?? 0) < 240
        d[i] = 27
        d[i + 1] = 23
        d[i + 2] = 26
        d[i + 3] = dark ? 255 : 0
    }
    g.putImageData(pixels, 0, 0)
    return out
}

function wrap(g: CanvasRenderingContext2D, text: string, width: number, maxLines: number) {
    const lines: string[] = []
    let line = ''
    for (const word of text.split(/\s+/)) {
        const next = line ? `${line} ${word}` : word
        if (!line || g.measureText(next).width <= width) line = next
        else {
            lines.push(line)
            line = word
        }
    }
    lines.push(line)
    return lines.slice(0, maxLines)
}

function concave(
    g: CanvasRenderingContext2D,
    top: number,
    bottom: number,
    topRadius: number,
    bottomRadius: number,
) {
    const corner = (
        cx: number,
        cy: number,
        sx: number,
        sy: number,
        radius: number,
        fromTop: boolean,
    ) => {
        const r = radius + INSET
        const a = Math.asin(INSET / r)
        const b = Math.acos(INSET / r)
        for (let i = 0; i <= 14; i++) {
            const t = fromTop ? a + ((b - a) * i) / 14 : b - ((b - a) * i) / 14
            g.lineTo(cx + sx * r * Math.cos(t), cy + sy * r * Math.sin(t))
        }
    }
    g.beginPath()
    corner(0, top, 1, 1, topRadius, false)
    corner(FACE_W, top, -1, 1, topRadius, true)
    corner(FACE_W, bottom, -1, -1, bottomRadius, false)
    corner(0, bottom, 1, -1, bottomRadius, true)
    g.closePath()
}

const mainPath = (g: CanvasRenderingContext2D) => concave(g, 0, PERF_Y, CORNER_PX, NOTCH_PX)
const stubPath = (g: CanvasRenderingContext2D) => concave(g, PERF_Y, FACE_H, NOTCH_PX, CORNER_PX)

function disc(g: CanvasRenderingContext2D, x: number, y: number, radius: number) {
    g.beginPath()
    g.arc(x, y, radius, 0, TAU)
    g.fill()
}

function rays(
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    length: (i: number) => number,
    width: number,
) {
    g.lineWidth = width
    g.lineCap = 'round'
    g.beginPath()
    for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (i * TAU) / 8
        g.moveTo(x, y)
        g.lineTo(x + Math.cos(a) * length(i), y + Math.sin(a) * length(i))
    }
    g.stroke()
}

function night(g: CanvasRenderingContext2D, top: number, bottom: number) {
    const gradient = g.createLinearGradient(0, top, 0, bottom)
    gradient.addColorStop(0, '#1c1546')
    gradient.addColorStop(1, '#30235f')
    return gradient
}

function inkCentered(g: CanvasRenderingContext2D, text: string, baseline: number) {
    const maxWidth = FACE_W - 100
    g.textAlign = 'left'
    const m = g.measureText(text)
    const squeeze = Math.min(1, maxWidth / m.width)
    g.fillText(
        text,
        FACE_W / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) * squeeze) / 2,
        baseline,
        maxWidth,
    )
}

function treeEdges(position: number): [number, number][] {
    const code = [3, 2, 1, 0].map((power) => Math.floor(position / STARS ** power) % STARS)
    const degree = Array.from(
        { length: STARS },
        (_, star) => 1 + code.filter((c) => c === star).length,
    )
    const edges: [number, number][] = []
    for (const parent of code) {
        const leaf = degree.indexOf(1)
        edges.push([leaf, parent])
        degree[leaf] = 0
        degree[parent] = (degree[parent] ?? 0) - 1
    }
    const [a = 0, b = 0] = degree.flatMap((d, star) => (d === 1 ? [star] : []))
    edges.push([a, b])
    return edges
}

type Point = [number, number]

const turn = (a: Point, b: Point, c: Point) =>
    (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])

function distanceToSegment([x, y]: Point, [ax, ay]: Point, [bx, by]: Point) {
    const along = Math.max(
        0,
        Math.min(
            1,
            ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2),
        ),
    )
    return Math.hypot(x - (ax + along * (bx - ax)), y - (ay + along * (by - ay)))
}

function clutter(stars: readonly Point[], edges: readonly [number, number][]) {
    const at = (i: number) => stars[i] as Point
    let score = 0
    edges.forEach(([a, b], i) => {
        for (const [c, d] of edges.slice(i + 1)) {
            const shared = [a, b].find((star) => star === c || star === d)
            if (shared === undefined) {
                const [p, q, r, t] = [at(a), at(b), at(c), at(d)]
                if (turn(p, q, r) * turn(p, q, t) < 0 && turn(r, t, p) * turn(r, t, q) < 0)
                    score += 10
                continue
            }
            const [o, u, v] = [at(shared), at(a === shared ? b : a), at(c === shared ? d : c)]
            const angle = Math.abs(
                Math.atan2(u[1] - o[1], u[0] - o[0]) - Math.atan2(v[1] - o[1], v[0] - o[0]),
            )
            if (Math.min(angle, TAU - angle) < 0.15) score += 4
        }
        stars.forEach((star, k) => {
            if (k !== a && k !== b && distanceToSegment(star, at(a), at(b)) < 14) score += 4
        })
    })
    return score
}

function constellation(info: TicketInfo) {
    const rng = random(info.purchase_id)
    const edges = treeEdges(info.secret?.position ?? Math.floor(rng() * STARS ** 4))
    const gap = SKY.width / (STARS + 1.5)
    let best: Point[] = []
    let lowest = Number.POSITIVE_INFINITY
    for (let attempt = 0; attempt < 160 && lowest > 0; attempt++) {
        const spare = SKY.width - 40 - gap * (STARS - 1)
        const offsets = Array.from({ length: STARS }, () => rng() * spare).sort((a, b) => a - b)
        const stars = offsets.map(
            (offset, i): Point => [
                SKY.x + 20 + offset + i * gap,
                SKY.y + 16 + rng() * (SKY.height - 32),
            ],
        )
        const score = clutter(stars, edges)
        if (score < lowest) {
            lowest = score
            best = stars
        }
    }
    const xs = best.map(([x]) => x)
    const ys = best.map(([, y]) => y)
    const dx = SKY.x + SKY.width / 2 - (Math.min(...xs) + Math.max(...xs)) / 2
    const dy = SKY.y + SKY.height / 2 - (Math.min(...ys) + Math.max(...ys)) / 2
    return { stars: best.map(([x, y]): Point => [x + dx, y + dy]), edges, rng }
}

function drawStars(g: CanvasRenderingContext2D, stars: readonly Point[]) {
    for (const [x, y] of stars) {
        const halo = g.createRadialGradient(x, y, 0, x, y, 30)
        halo.addColorStop(0, 'rgba(255, 246, 220, 0.85)')
        halo.addColorStop(1, 'rgba(255, 246, 220, 0)')
        g.fillStyle = halo
        g.fillRect(x - 30, y - 30, 60, 60)
        g.fillStyle = '#ffffff'
        g.strokeStyle = '#ffffff'
        rays(g, x, y, (i) => (i % 2 ? 14 : 23), 4.6)
        disc(g, x, y, 6.5)
    }
}

function drawSky(info: TicketInfo, scale: number, withBackground: boolean): HTMLCanvasElement {
    const sky = canvas(FACE_W * 2 * scale, FACE_H * scale)
    const g = context(sky)
    g.scale(scale, scale)

    if (withBackground) {
        g.fillStyle = night(g, PERF_Y, FACE_H)
        stubPath(g)
        g.fill()
    }
    const stubRng = random(info.purchase_id.slice(9))
    g.fillStyle = SPECK
    for (let i = 0; i < 40; i++) {
        g.globalAlpha = 0.25 + stubRng() * 0.6
        disc(
            g,
            INSET + 20 + stubRng() * (FACE_W - 2 * INSET - 40),
            PERF_Y + INSET + 14 + stubRng() * (FACE_H - PERF_Y - 2 * INSET - 28),
            0.5 + stubRng() ** 3 * 1.6,
        )
    }
    g.globalAlpha = withBackground ? 1 : 0.55
    g.fillStyle = CREAM
    const admit = t('tickets.admitOne')
    let size = 64
    for (; size > 20; size -= 2) {
        g.font = `700 ${size}px Roboto`
        g.letterSpacing = '8px'
        if (g.measureText(admit).width <= FACE_W - 2 * INSET - 110) break
    }
    const m = g.measureText(admit)
    inkCentered(
        g,
        admit,
        PERF_Y +
            (FACE_H - PERF_Y) / 2 +
            (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2,
    )
    g.globalAlpha = 1

    g.translate(FACE_W, 0)
    const { stars, edges, rng } = constellation(info)
    g.fillStyle = SPECK
    g.strokeStyle = SPECK
    for (let i = 0; i < 110; i++) {
        const big = rng() < 0.12
        const x = 14 + rng() * (FACE_W - 28)
        const y = 10 + rng() ** 1.6 * (PERF_Y * 0.95)
        const r = big ? 4 + rng() * 2 : 1.5 + rng() ** 2 * 2.5
        if (Math.abs(x - FACE_W / 2) < 150 && y > WORD_Y - 75 && y < WORD_Y + 25) continue
        g.globalAlpha = big ? 1 : 0.45 + r / 8
        if (big) rays(g, x, y, (k) => (k % 2 ? r : r * 1.9), 2.2)
        else disc(g, x, y, r * 0.8)
    }
    g.globalAlpha = 0.6
    g.strokeStyle = '#f3ecff'
    g.lineWidth = 2.4
    g.lineCap = 'round'
    g.beginPath()
    for (const [a, b] of edges) {
        g.moveTo(...(stars[a] as Point))
        g.lineTo(...(stars[b] as Point))
    }
    g.stroke()
    g.globalAlpha = 1
    drawStars(g, stars)
    if (info.secret) {
        g.fillStyle = CREAM
        g.font = '500 58px Roboto'
        g.letterSpacing = '2px'
        inkCentered(g, info.secret.word, WORD_Y)
    }
    return sky
}

function drawFrontInk(logo: HTMLImageElement, info: TicketInfo) {
    const ink = canvas(FACE_W, FACE_H)
    const g = context(ink)
    g.fillStyle = INK
    g.strokeStyle = INK
    g.lineCap = 'round'
    g.lineJoin = 'round'

    g.lineWidth = 3
    mainPath(g)
    g.stroke()

    const text = (font: string, spacing: string, value: string, gap: number) => {
        g.font = font
        g.letterSpacing = spacing
        const m = g.measureText(value)
        return {
            font,
            spacing,
            value,
            gap,
            ascent: m.actualBoundingBoxAscent,
            height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
        }
    }
    const lines = [
        text('700 70px Roboto', '4px', info.festival_name.toUpperCase(), 54),
        text('500 34px Roboto', '0.5px', formatDateRange(info.start_date, info.end_date), 20),
    ]
    const logoSize = 300
    const block = logoSize + lines.reduce((sum, line) => sum + line.gap + line.height, 0)
    let y = info.holder
        ? FRAME.y + (FRAME.height - block) * 0.3
        : FRAME.y + (FRAME.height - block) / 2 - FRAME.height * 0.03

    g.drawImage(inkOnly(logo), (FACE_W - logoSize) / 2, y, logoSize, logoSize)
    y += logoSize
    const draw = (line: ReturnType<typeof text>) => {
        y += line.gap
        g.font = line.font
        g.letterSpacing = line.spacing
        inkCentered(g, line.value, y + line.ascent)
        y += line.height
    }
    lines.forEach(draw)

    const foil = canvas(FACE_W, FACE_H)
    if (info.holder) {
        const holder = info.holder
        let size = 88
        for (; size > 40; size -= 2) {
            g.font = `700 ${size}px Roboto`
            g.letterSpacing = '1px'
            if (g.measureText(holder).width <= FACE_W - 140) break
        }
        const font = `700 ${size}px Roboto`
        g.font = font
        const names = wrap(g, holder, FACE_W - 140, 2).map((line, i) =>
            text(font, '1px', line, i === 0 ? 0 : 12),
        )
        const height = names.reduce((sum, line) => sum + line.gap + line.height, 0)
        y += (FRAME.y + FRAME.height - y - height) / 2
        const f = context(foil)
        const obsidian = f.createLinearGradient(0, y, 0, y + height)
        obsidian.addColorStop(0, '#26272d')
        obsidian.addColorStop(0.55, '#0d0d10')
        obsidian.addColorStop(1, '#1c1d22')
        f.fillStyle = obsidian
        for (const line of names) {
            y += line.gap
            f.font = line.font
            f.letterSpacing = line.spacing
            inkCentered(f, line.value, y + line.ascent)
            y += line.height
        }
    }
    return { ink, foil }
}

export async function drawTicketFaces(info: TicketInfo): Promise<TicketFaces> {
    const [logo, swirl] = await Promise.all([
        loadImage('/vibecamp.png'),
        loadImage('/swirl2.png'),
        ...['300', '500', '700'].map((weight) => document.fonts.load(`${weight} 32px Roboto`)),
    ])
    const faces = {
        color: canvas(FACE_W * 2, FACE_H),
        data: canvas(FACE_W * 2, FACE_H),
        glow: canvas(FACE_W, FACE_H / 2),
        foil: canvas(FACE_W, FACE_H / 2),
        swirl,
    }
    const { ink, foil } = drawFrontInk(logo, info)

    const color = context(faces.color)
    color.drawImage(swirl, 0, 0, FACE_W, FACE_H)
    color.globalCompositeOperation = 'overlay'
    color.globalAlpha = 0.5
    color.translate(FACE_W, FACE_H)
    color.rotate(Math.PI)
    color.drawImage(swirl, 0, 0, FACE_W, FACE_H)
    color.setTransform(1, 0, 0, 1, 0, 0)
    color.globalCompositeOperation = 'source-over'
    color.globalAlpha = 0.06
    color.fillStyle = '#ffffff'
    color.fillRect(0, 0, FACE_W, FACE_H)
    color.globalAlpha = 1
    color.drawImage(ink, 0, 0)
    color.drawImage(foil, 0, 0)
    color.fillStyle = night(color, 0, FACE_H)
    color.fillRect(FACE_W, 0, FACE_W, FACE_H)
    color.drawImage(drawSky(info, 1, true), 0, 0)

    const data = context(faces.data)
    data.fillStyle = 'rgb(255, 80, 110)'
    data.fillRect(0, 0, FACE_W, FACE_H)
    const matte = canvas(FACE_W, FACE_H)
    const m = context(matte)
    m.fillStyle = 'rgb(0, 230, 0)'
    m.fillRect(0, 0, FACE_W, FACE_H)
    m.globalCompositeOperation = 'destination-in'
    m.drawImage(ink, 0, 0)
    data.drawImage(matte, 0, 0)
    const metal = canvas(FACE_W, FACE_H)
    const g = context(metal)
    g.fillStyle = 'rgb(70, 30, 0)'
    g.fillRect(0, 0, FACE_W, FACE_H)
    g.globalCompositeOperation = 'destination-in'
    g.drawImage(foil, 0, 0)
    data.drawImage(metal, 0, 0)
    data.fillStyle = 'rgb(90, 60, 0)'
    stubPath(data)
    data.fill()
    data.fillStyle = 'rgb(150, 90, 80)'
    data.fillRect(FACE_W, 0, FACE_W, FACE_H)

    const glow = context(faces.glow)
    glow.fillStyle = '#000000'
    glow.fillRect(0, 0, faces.glow.width, faces.glow.height)
    glow.drawImage(drawSky(info, 0.5, false), 0, 0)
    context(faces.foil).drawImage(foil, 0, 0, FACE_W / 2, FACE_H / 2)

    return faces
}

function ticketGeometry() {
    const shape = new Shape()
    const [x0, x1, y0, y1, r] = [-W / 2, W / 2, -H / 2, H / 2, CORNER]
    const perf = y0 + STUB
    shape.moveTo(x0 + r, y0)
    shape.lineTo(x1 - r, y0)
    shape.absarc(x1, y0, r, Math.PI, Math.PI / 2, true)
    shape.lineTo(x1, perf - NOTCH)
    shape.absarc(x1, perf, NOTCH, -Math.PI / 2, Math.PI / 2, true)
    shape.lineTo(x1, y1 - r)
    shape.absarc(x1, y1, r, -Math.PI / 2, -Math.PI, true)
    shape.lineTo(x0 + r, y1)
    shape.absarc(x0, y1, r, 0, -Math.PI / 2, true)
    shape.lineTo(x0, perf + NOTCH)
    shape.absarc(x0, perf, NOTCH, Math.PI / 2, -Math.PI / 2, true)
    shape.lineTo(x0, y0 + r)
    shape.absarc(x0, y0, r, Math.PI / 2, 0, true)
    const count = Math.floor((FACE_W - 2 * (NOTCH_PX + 16)) / HOLE_SPACING) + 1
    const first = (FACE_W - (count - 1) * HOLE_SPACING) / 2
    for (let i = 0; i < count; i++) {
        const hole = new Path()
        hole.absarc(
            ((first + i * HOLE_SPACING) / FACE_W) * W - W / 2,
            perf,
            (HOLE_RADIUS / FACE_W) * W,
            0,
            TAU,
            true,
        )
        shape.holes.push(hole)
    }

    const geometry = new ExtrudeGeometry(shape, {
        depth: 0.024,
        bevelEnabled: true,
        // a wider bevel would close the tear holes
        bevelThickness: 0.008,
        bevelSize: 0.005,
        bevelSegments: 3,
        curveSegments: 14,
    })
    geometry.center()
    const position = geometry.getAttribute('position')
    const uv = geometry.getAttribute('uv')
    const lids = geometry.groups.find((group) => group.materialIndex === 0)
    if (lids) {
        for (let i = lids.start; i < lids.start + lids.count; i++) {
            const u = (position.getX(i) + W / 2) / W
            uv.setXY(i, position.getZ(i) > 0 ? u / 2 : 1 - u / 2, (position.getY(i) + H / 2) / H)
        }
        uv.needsUpdate = true
    }
    return geometry
}

function duskTexture() {
    const sky = canvas(4, 512)
    const g = context(sky)
    const gradient = g.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#150f33')
    gradient.addColorStop(0.55, '#3a2a6e')
    gradient.addColorStop(0.82, '#c77a8a')
    gradient.addColorStop(1, '#f2b48c')
    g.fillStyle = gradient
    g.fillRect(0, 0, 4, 512)
    const texture = new CanvasTexture(sky)
    texture.colorSpace = SRGBColorSpace
    return texture
}

function pearlTexture() {
    const sky = canvas(4, 256)
    const g = context(sky)
    const gradient = g.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0, '#d9ceff')
    gradient.addColorStop(0.5, '#fff0e6')
    gradient.addColorStop(1, '#bfe6ff')
    g.fillStyle = gradient
    g.fillRect(0, 0, 4, 256)
    const texture = new CanvasTexture(sky)
    texture.colorSpace = SRGBColorSpace
    return texture
}

function environmentScene() {
    const scene = new Scene()
    const dome = new Mesh(
        new SphereGeometry(20, 32, 16),
        new MeshBasicMaterial({ side: BackSide, map: pearlTexture() }),
    )
    scene.add(dome)
    const panels: [string, number, [number, number, number], [number, number]][] = [
        ['#ffffff', 2.5, [0, 2, 10], [8, 6]],
        ['#ff9ad5', 3, [8, 0, 4], [3, 10]],
        ['#7fe7ff', 3, [-8, 0, 4], [3, 10]],
        ['#ffd59a', 2, [0, 8, 2], [10, 2]],
    ]
    for (const [hex, strength, at, [width, height]] of panels) {
        const light = new Mesh(
            new PlaneGeometry(width, height),
            new MeshBasicMaterial({ color: new Color(hex).multiplyScalar(strength) }),
        )
        light.position.set(...at)
        light.lookAt(0, 0, 0)
        scene.add(light)
    }
    return scene
}

function fireflySprite() {
    const sprite = canvas(64, 64)
    const g = context(sprite)
    const glow = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    glow.addColorStop(0, 'rgba(255, 255, 255, 1)')
    glow.addColorStop(0.25, 'rgba(255, 255, 255, 0.55)')
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
    g.fillStyle = glow
    g.fillRect(0, 0, 64, 64)
    return new CanvasTexture(sprite)
}

function createFireflies(count = 32) {
    const rng = random('f1ae5eed')
    const flies = Array.from({ length: count }, () => ({
        x: (rng() * 2 - 1) * 2.4,
        y: (rng() * 2 - 1) * 2.2,
        z: -2 + rng() * 1.6,
        ax: 0.12 + rng() * 0.25,
        ay: 0.12 + rng() * 0.25,
        k: 1 + Math.floor(rng() * 2),
        m: 1 + Math.floor(rng() * 3),
        p: rng() * TAU,
        q: rng() * TAU,
    }))
    const positions = new BufferAttribute(new Float32Array(count * 3), 3)
    const colors = new BufferAttribute(new Float32Array(count * 3), 3)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', positions)
    geometry.setAttribute('color', colors)
    const sprite = fireflySprite()
    const material = new PointsMaterial({
        size: 0.3,
        map: sprite,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexColors: true,
    })
    const points = new Points(geometry, material)

    function update(time: number) {
        const w = (TAU / LOOP_SECONDS) * time
        flies.forEach((f, i) => {
            positions.setXYZ(
                i,
                f.x + f.ax * Math.sin(f.k * w + f.p),
                f.y + f.ay * Math.cos(f.k * w + f.q),
                f.z,
            )
            const brightness = 0.25 + 0.9 * (0.5 + 0.5 * Math.sin(f.m * w + f.q)) ** 2
            colors.setXYZ(i, brightness, brightness * 0.82, brightness * 0.32)
        })
        positions.needsUpdate = true
        colors.needsUpdate = true
    }

    return {
        points,
        update,
        dispose() {
            geometry.dispose()
            material.dispose()
            sprite.dispose()
        },
    }
}

function faceTexture(source: HTMLCanvasElement, srgb: boolean, anisotropy: number) {
    const texture = new CanvasTexture(source)
    texture.colorSpace = srgb ? SRGBColorSpace : NoColorSpace
    texture.anisotropy = anisotropy
    return texture
}

export function createTicketScene(renderer: WebGLRenderer, faces: TicketFaces) {
    renderer.toneMapping = NeutralToneMapping

    const scene = new Scene()
    const camera = new PerspectiveCamera(30, 1, 0.1, 50)
    const background = duskTexture()
    scene.background = background

    const pmrem = new PMREMGenerator(renderer)
    const envScene = environmentScene()
    const environment = pmrem.fromScene(envScene, 0.02)
    scene.environment = environment.texture

    const anisotropy = renderer.capabilities.getMaxAnisotropy()
    const color = faceTexture(faces.color, true, anisotropy)
    const data = faceTexture(faces.data, false, anisotropy)
    const glow = faceTexture(faces.glow, true, 1)
    const foil = faceTexture(faces.foil, false, 1)
    const foilTime = { value: 0 }
    const swirl = new Texture(faces.swirl)
    swirl.needsUpdate = true

    const face = new MeshPhysicalMaterial({
        map: color,
        roughness: 1,
        roughnessMap: data,
        metalness: 1,
        metalnessMap: data,
        iridescence: 1,
        iridescenceMap: data,
        iridescenceIOR: 1.35,
        iridescenceThicknessMap: swirl,
        iridescenceThicknessRange: [200, 1100],
        clearcoat: 1,
        clearcoatMap: data,
        clearcoatRoughness: 0.12,
        emissive: new Color('#fff6dc'),
        emissiveMap: glow,
        emissiveIntensity: 1.1,
    })
    face.onBeforeCompile = (shader) => {
        shader.uniforms.foilMap = { value: foil }
        shader.uniforms.foilTime = foilTime
        shader.fragmentShader =
            `uniform sampler2D foilMap;\nuniform float foilTime;\n${shader.fragmentShader}`.replace(
                '#include <emissivemap_fragment>',
                `#include <emissivemap_fragment>
            float glint = vEmissiveMapUv.x * 2.0 + vEmissiveMapUv.y * 0.6 - (mod(foilTime, ${GLINT_SECONDS.toFixed(1)}) * 1.07 - 0.6);
            totalEmissiveRadiance += vec3(0.9, 0.93, 1.0) * texture2D(foilMap, vEmissiveMapUv).a * exp(-glint * glint * 220.0) * 0.6;`,
            )
    }
    const edge = new MeshPhysicalMaterial({
        color: '#f3eefb',
        roughness: 0.25,
        metalness: 0.7,
        iridescence: 1,
        iridescenceThicknessRange: [200, 600],
        clearcoat: 1,
    })
    const geometry = ticketGeometry()
    const ticket = new Mesh(geometry, [face, edge])
    scene.add(ticket)

    const fireflies = createFireflies()
    scene.add(fireflies.points)

    const shimmer = new DirectionalLight('#fff4e0', 2.2)
    scene.add(shimmer)

    return {
        scene,
        camera,
        apply(pose: TicketPose) {
            ticket.rotation.set(pose.tilt, pose.turn, 0)
            ticket.position.y = pose.lift
            fireflies.update(pose.time)
            foilTime.value = pose.time
            shimmer.position.set(-5 + 10 * pose.sweep, 3, 4)
        },
        resize(width: number, height: number) {
            camera.aspect = width / height
            const halfHeight = Math.max(H / 2 / 0.86, W / 2 / 0.8 / camera.aspect)
            camera.position.set(0, 0, halfHeight / Math.tan((camera.fov * Math.PI) / 360))
            camera.updateProjectionMatrix()
        },
        dispose() {
            geometry.dispose()
            face.dispose()
            edge.dispose()
            for (const texture of [color, data, glow, foil, swirl, background]) texture.dispose()
            fireflies.dispose()
            environment.dispose()
            pmrem.dispose()
            envScene.traverse((object) => {
                if (object instanceof Mesh && object.material instanceof MeshBasicMaterial) {
                    object.geometry.dispose()
                    object.material.map?.dispose()
                    object.material.dispose()
                }
            })
        },
    }
}

export type TicketScene = ReturnType<typeof createTicketScene>

export type PreparedTicket = { renderer: WebGLRenderer; scene: TicketScene; faces: TicketFaces }

let prepared: { id: string; ticket: Promise<PreparedTicket> } | null = null

const ticketKey = (info: TicketInfo) => `${info.purchase_id}:${info.holder ?? ''}`

export function prepareTicket(info: TicketInfo): Promise<PreparedTicket> {
    if (prepared?.id === ticketKey(info)) return prepared.ticket
    void prepared?.ticket.then(
        ({ renderer, scene }) => {
            scene.dispose()
            renderer.dispose()
            renderer.forceContextLoss()
        },
        () => {},
    )
    const ticket = (async () => {
        const faces = await drawTicketFaces(info)
        const renderer = new WebGLRenderer({ antialias: window.devicePixelRatio < 2 })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        const scene = createTicketScene(renderer, faces)
        await renderer.compileAsync(scene.scene, scene.camera)
        renderer.render(scene.scene, scene.camera)
        return { renderer, scene, faces }
    })()
    const entry = { id: ticketKey(info), ticket }
    const forget = () => {
        if (prepared === entry) prepared = null
    }
    prepared = entry
    ticket.then(({ renderer }) => {
        renderer.domElement.addEventListener('webglcontextlost', forget)
    }, forget)
    return ticket
}

export async function canSaveVideo() {
    const { canEncodeVideo } = await import('mediabunny')
    return canEncodeVideo('avc', VIDEO_SIZE)
}

export async function exportTicket(faces: TicketFaces, name: string, signal: AbortSignal) {
    const { width, height } = VIDEO_SIZE
    const target = canvas(width, height)
    const renderer = new WebGLRenderer({
        canvas: target,
        antialias: true,
        preserveDrawingBuffer: true,
    })
    renderer.setPixelRatio(1)
    renderer.setSize(width, height, false)
    const ticket = createTicketScene(renderer, faces)
    ticket.resize(width, height)
    try {
        const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH } = await import(
            'mediabunny'
        )
        const output = new Output({
            format: new Mp4OutputFormat({ fastStart: 'in-memory' }),
            target: new BufferTarget(),
        })
        const source = new CanvasSource(target, { codec: 'avc', quality: QUALITY_HIGH })
        output.addVideoTrack(source, { frameRate: FPS })
        await output.start()
        const frames = VIDEO_SECONDS * FPS
        for (let i = 0; i < frames; i++) {
            ticket.apply(loopPose(i / frames))
            renderer.render(ticket.scene, ticket.camera)
            await source.add(i / FPS, 1 / FPS)
            await new Promise((resolve) => requestAnimationFrame(resolve))
            signal.throwIfAborted()
        }
        await output.finalize()
        const buffer = output.target.buffer
        if (!buffer) throw new Error('Could not encode the video')
        return new File([buffer], `${name}.mp4`, { type: 'video/mp4' })
    } finally {
        ticket.dispose()
        renderer.dispose()
        renderer.forceContextLoss()
    }
}
