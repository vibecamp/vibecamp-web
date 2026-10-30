'use client'

import 'ol/ol.css'
import { useRouter } from 'next/navigation'
import type { Coordinate } from 'ol/coordinate'
import { type Extent, getCenter } from 'ol/extent'
import DragPan from 'ol/interaction/DragPan'
import { defaults as defaultInteractions } from 'ol/interaction/defaults'
import { zoomByDelta } from 'ol/interaction/Interaction'
import ImageLayer from 'ol/layer/Image'
import OlMap from 'ol/Map'
import Overlay from 'ol/Overlay'
import Projection from 'ol/proj/Projection'
import ImageStatic from 'ol/source/ImageStatic'
import View from 'ol/View'
import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ImageRef, LocationJson } from '@/contract/route-types'
import { t } from '@/copy/t'
import type { Tables } from '@/db/types'
import useSettled from '@/hooks/useSettled'
import { isMapped, matchesLocation } from '@/lib/locations'
import { prefetchPage } from '@/lib/prefetch'
import { imagePath, locationPath } from '@/lib/routes'
import { classNames } from '@/lib/ui'
import Icon from '../core/Icon'
import SearchField from '../core/SearchField'
import { useNav } from '../NavStack'
import { type HeaderSearch, usePageHeader } from '../PageHeader'
import PageLoading from '../PageLoading'
import { type LabelSide, placeLabels } from './labels'
import { PIN_HEAD_Y, PIN_HEIGHT, PIN_WIDTH, pinElement } from './pin'

const MAX_SCALE = 3
const ZOOM_STEP = 0.5
const ZOOM_DURATION = 250
const FIT_DURATION = 400
const TAP_TOLERANCE = 6
const CLICK_AFTER_DRAG_MS = 500
const PIN_HIT_PADDING = 4
const LABEL_GAP = 2
const LABEL_MARGIN_FIT = 20
const LABEL_MARGIN_ZOOMED = 4
const MIN_PIN_SCALE = 0.55
const SPARSE_LABEL_ZOOM = 0.25
const SPARSE_LABEL_COUNT = 4
const FEW_PINS = 5
const ZOOMED_IN = 0.25
const UNCATEGORIZED = ''

type Props = {
    map: ImageRef
    locations: readonly LocationJson[]
    categories: readonly Tables['location_category'][]
}

type PinnedLocation = LocationJson & { pin_x: number; pin_y: number }

type Pin = {
    location: PinnedLocation
    coordinate: Coordinate
    root: HTMLElement
    element: HTMLElement
    label: HTMLElement
    z: number
    width: number
    height: number
    side: LabelSide
    visible: boolean
}

type Filters = { query: string; hidden: readonly string[] }

// zoom is measured in levels above the whole-map view, so it can be judged without measuring the screen
type ZoomUi = { zoomedIn: boolean; atMin: boolean; atMax: boolean }

const zoomUi = (zoom: number, maxZoom: number): ZoomUi => ({
    zoomedIn: zoom > ZOOMED_IN,
    atMin: zoom <= 0.001,
    atMax: zoom >= maxZoom - 0.001,
})

const extentOf = (map: ImageRef): Extent => [0, 0, map.width, map.height]

const isPinned = (l: LocationJson): l is PinnedLocation => isMapped(l) && l.deleted_at == null

// map coordinates are image pixels with y pointing up, while pins are stored as fractions from the top
const coordinateOf = (map: ImageRef, l: PinnedLocation): Coordinate => [
    l.pin_x * map.width,
    (1 - l.pin_y) * map.height,
]

const matches = (location: LocationJson, { query, hidden }: Filters) => {
    if (hidden.includes(location.location_category_id ?? UNCATEGORIZED)) return false
    return matchesLocation(location, query)
}

function showPin(pin: Pin, visible: boolean) {
    pin.visible = visible
    pin.element.classList.toggle('pin-filtered', !visible)
    pin.root.inert = !visible
}

function fitResolution(olMap: OlMap, extent: Extent) {
    const size = olMap.getSize()
    return size ? olMap.getView().getResolutionForExtent(extent, size) : undefined
}

export default function MapView({ map, locations, categories }: Props) {
    const router = useRouter()
    const { screenKey, getScreenState, setScreenState, reselected, push } = useNav()

    const containerRef = useRef<HTMLElement>(null)
    const mapRef = useRef<OlMap | null>(null)
    const pinsRef = useRef<Pin[]>([])
    const updateLabelsRef = useRef(() => {})
    const screenKeyRef = useRef(screenKey)
    const restoredKeyRef = useRef<string | undefined>(undefined)
    // derived from the view this screen will open on, so the first frame already matches the map
    const [{ zoomedIn, atMin, atMax }, setZoomUi] = useState(() => {
        const saved = screenKey ? getScreenState(screenKey)?.mapView : undefined
        return saved ? zoomUi(saved.zoom, saved.maxZoom) : zoomUi(0, Number.POSITIVE_INFINITY)
    })
    const [filtersOpen, setFiltersOpen] = useState(false)
    const [filters, setFilters] = useState<Filters>(
        () => (screenKey && getScreenState(screenKey)?.mapFilters) || { query: '', hidden: [] },
    )
    const filtersRef = useRef(filters)
    const extent = useMemo(() => extentOf(map), [map])
    const settled = useSettled()
    const [imageState, setImageState] = useState<'loading' | 'loaded' | 'failed'>('loading')
    const [fontsPlaced, setFontsPlaced] = useState(() => document.fonts.status === 'loaded')

    const mapSearch = useMemo(
        (): HeaderSearch => ({
            value: filters.query,
            onChange: (query) => setFilters((f) => ({ ...f, query })),
            placeholder: t('events.searchPlaceholder'),
            inTopBar: zoomedIn,
        }),
        [filters.query, zoomedIn],
    )
    usePageHeader({ search: mapSearch })

    const chips = useMemo(() => {
        const pinned = locations.filter(isPinned)
        const used = categories
            .filter((c) => pinned.some((l) => l.location_category_id === c.location_category_id))
            .map((c) => ({ id: c.location_category_id, name: c.name, color: c.color }))
        const uncategorized = pinned.some((l) => l.location_category_id == null)
        return used.length > 0 && uncategorized
            ? [
                  ...used,
                  {
                      id: UNCATEGORIZED,
                      name: t('eventEditor.locationUncategorized'),
                      color: undefined,
                  },
              ]
            : used
    }, [categories, locations])

    useEffect(() => {
        screenKeyRef.current = screenKey
    }, [screenKey])

    useEffect(() => {
        for (const location of locations.filter(isPinned)) {
            prefetchPage(router, locationPath(location.location_id))
        }
    }, [locations, router])

    // built before the first paint so pins, labels and the restored view are right in the first frame
    useLayoutEffect(() => {
        const el = containerRef.current
        if (!el) return
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
        const projection = new Projection({ code: 'camp-map', units: 'pixels', extent })
        // the view applies these limits on every frame of every gesture, so the map can't pass its edges
        const view = new View({
            projection,
            extent,
            showFullExtent: true,
            smoothExtentConstraint: false,
            smoothResolutionConstraint: false,
            enableRotation: false,
            // OpenLayers rounds minResolution to a power-of-two step below maxResolution, so pair them exactly
            maxResolution: 2 ** 10 / MAX_SCALE,
            minResolution: 1 / MAX_SCALE,
            center: getCenter(extent),
        })
        const imageSource = new ImageStatic({
            url: imagePath(map.image_id),
            projection,
            imageExtent: extent,
        })
        imageSource.once('imageloaderror', () => setImageState('failed'))
        const interactions = defaultInteractions({
            altShiftDragRotate: false,
            pinchRotate: false,
            shiftDragZoom: false,
            dragPan: !reduced,
            zoomDelta: ZOOM_STEP,
            zoomDuration: reduced ? 0 : ZOOM_DURATION,
        })
        if (reduced) interactions.push(new DragPan())
        const olMap = new OlMap({
            target: el,
            view,
            controls: [],
            interactions,
            moveTolerance: TAP_TOLERANCE,
            layers: [new ImageLayer({ source: imageSource })],
        })
        mapRef.current = olMap
        // fires once the image has actually been drawn, not merely downloaded
        olMap.once('rendercomplete', () =>
            setImageState((state) => (state === 'failed' ? state : 'loaded')),
        )
        view.fit(extent)

        const categoryOrder = new Map(categories.map((c) => [c.location_category_id, c.sort_order]))
        const colors = new Map(categories.map((c) => [c.location_category_id, c.color]))
        const open = (location: LocationJson) => push(locationPath(location.location_id))
        let dragged = false
        let releasedAt = 0
        el.addEventListener('pointerdown', () => {
            dragged = false
        })
        el.addEventListener('pointerup', () => {
            releasedAt = performance.now()
        })
        olMap.on('pointerdrag', () => {
            dragged = true
        })

        pinsRef.current = locations
            .filter(isPinned)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((location) => {
                const element = document.createElement('div')
                element.className = 'map-pin-marker'
                const color = location.location_category_id
                    ? colors.get(location.location_category_id)
                    : undefined
                if (color) element.style.setProperty('--pin', color)
                element.classList.add('label-hidden')
                const label = document.createElement('span')
                label.className = 'map-pin-label'
                label.textContent = location.name
                label.setAttribute('aria-hidden', 'true')
                element.append(pinElement(), label)

                const root = document.createElement('div')
                root.className = 'map-pin-icon'
                root.style.width = `${PIN_WIDTH + 2 * PIN_HIT_PADDING}px`
                root.style.height = `${PIN_HEIGHT + PIN_HIT_PADDING}px`
                root.tabIndex = 0
                root.setAttribute('role', 'link')
                root.setAttribute('aria-label', location.name)
                root.addEventListener('click', () => {
                    // a drag that starts on a pin ends with a click on it, which mustn't open it
                    if (dragged && performance.now() - releasedAt < CLICK_AFTER_DRAG_MS) return
                    open(location)
                })
                root.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        open(location)
                    }
                })
                root.append(element)

                const coordinate = coordinateOf(map, location)
                olMap.addOverlay(
                    new Overlay({
                        element: root,
                        position: coordinate,
                        positioning: 'bottom-center',
                        stopEvent: false,
                        className: 'ol-overlay-container map-pin-overlay',
                    }),
                )
                // pins lower on the map sit in front, as they would in perspective
                const z = Math.round(location.pin_y * 10_000)
                if (root.parentElement) root.parentElement.style.zIndex = String(z)
                const pin: Pin = {
                    location,
                    coordinate,
                    root,
                    element,
                    label,
                    z,
                    width: 0,
                    height: 0,
                    side: null,
                    visible: true,
                }
                showPin(pin, matches(location, filtersRef.current))
                return pin
            })

        const rank = (pin: Pin) => [
            pin.location.location_category_id
                ? (categoryOrder.get(pin.location.location_category_id) ?? Number.MAX_SAFE_INTEGER)
                : Number.MAX_SAFE_INTEGER,
            -(pin.location.capacity ?? -1),
        ]
        const compare = (a: Pin, b: Pin) => {
            const [ra, rb] = [rank(a), rank(b)]
            for (let i = 0; i < ra.length; i++) {
                const diff = (ra[i] ?? 0) - (rb[i] ?? 0)
                if (diff !== 0) return diff
            }
            return a.location.name.localeCompare(b.location.name)
        }
        // pins shrink with the map when zoomed far out so they don't bury a small map
        const pinScale = (resolution: number) =>
            Math.min(1, Math.max(MIN_PIN_SCALE, 0.45 + 0.55 / resolution))
        const zoomFraction = (resolution: number) => {
            const fit = fitResolution(olMap, extent) ?? resolution
            const max = Math.min(fit, 1 / MAX_SCALE)
            return fit > max
                ? Math.min(1, Math.max(0, Math.log(fit / resolution) / Math.log(fit / max)))
                : 1
        }
        // a label is hidden if another pin sits this close to it, so it can't be read as naming that pin
        const labelMargin = (resolution: number) =>
            LABEL_MARGIN_FIT + (LABEL_MARGIN_ZOOMED - LABEL_MARGIN_FIT) * zoomFraction(resolution)
        let shownScale = ''
        const updateLabels = () => {
            const size = olMap.getSize()
            const resolution = view.getResolution()
            if (!size || !resolution) return
            const scale = pinScale(resolution)
            if (scale.toFixed(3) !== shownScale) {
                shownScale = scale.toFixed(3)
                el.style.setProperty('--pin-scale', shownScale)
            }
            const pins = pinsRef.current.filter((p) => p.visible)
            // pins are hidden until the map first renders, so labels are measured once they can be
            for (const p of pins) {
                if (!p.width) {
                    p.width = p.label.offsetWidth
                    p.height = p.label.offsetHeight
                }
            }
            if (pins.some((p) => !p.width)) return
            for (const p of pinsRef.current) {
                if (!p.visible) {
                    p.side = null
                    p.element.classList.add('label-hidden')
                }
            }
            const points = pins.map((p) => olMap.getPixelFromCoordinate(p.coordinate))
            if (points.some((point) => point == null)) return
            const order = pins
                .map((_, i) => i)
                .sort((a, b) => compare(pins[a] as Pin, pins[b] as Pin))
            const sides = placeLabels(
                pins.map((p, i) => {
                    const [x, y] = points[i] as number[]
                    return {
                        x: x ?? 0,
                        y: y ?? 0,
                        width: p.width,
                        height: p.height,
                        preferred: p.side,
                    }
                }),
                order,
                { width: PIN_WIDTH * scale, height: PIN_HEIGHT * scale, headY: PIN_HEAD_Y * scale },
                LABEL_GAP,
                labelMargin(resolution),
                { width: size[0] ?? 0, height: size[1] ?? 0 },
            )
            // a lone label or two on a zoomed-out map reads as noise rather than orientation
            const sparse =
                pins.length > FEW_PINS &&
                zoomFraction(resolution) < SPARSE_LABEL_ZOOM &&
                sides.filter(Boolean).length <= SPARSE_LABEL_COUNT
            pins.forEach((p, i) => {
                const side = sparse ? null : (sides[i] ?? null)
                p.side = side
                p.element.classList.toggle('label-hidden', side == null)
                if (side && p.element.dataset.side !== side) p.element.dataset.side = side
            })
        }
        updateLabelsRef.current = updateLabels

        const zoomLevels = () => {
            const resolution = view.getResolution()
            const fit = fitResolution(olMap, extent)
            if (!resolution || !fit) return undefined
            return { zoom: Math.log2(fit / resolution), maxZoom: Math.log2(fit * MAX_SCALE) }
        }
        const reportZoom = () => {
            const levels = zoomLevels()
            if (!levels) return
            const next = zoomUi(levels.zoom, levels.maxZoom)
            setZoomUi((prev) =>
                prev.zoomedIn === next.zoomedIn &&
                prev.atMin === next.atMin &&
                prev.atMax === next.atMax
                    ? prev
                    : next,
            )
        }

        let disposed = false
        void document.fonts.ready.then(() => {
            if (disposed) return
            for (const pin of pinsRef.current) pin.width = 0
            updateLabels()
            // re-placing for the real font is a correction, not a change, so it shouldn't animate
            requestAnimationFrame(() => !disposed && setFontsPlaced(true))
        })

        olMap.on('postrender', () => {
            updateLabels()
            reportZoom()
        })
        olMap.on('click', (event) => {
            const target = event.originalEvent.target as Element | null
            if (target?.closest?.('.map-pin-icon')) return
            setFiltersOpen(false)
        })
        olMap.on('movestart', () => setFiltersOpen(false))
        olMap.on('moveend', () => {
            const key = screenKeyRef.current
            const center = view.getCenter()
            const resolution = view.getResolution()
            const levels = zoomLevels()
            if (!key || restoredKeyRef.current !== key || !center || !resolution || !levels) return
            setScreenState(key, {
                mapView: { x: center[0] ?? 0, y: center[1] ?? 0, resolution, ...levels },
            })
        })

        return () => {
            disposed = true
            olMap.setTarget(undefined)
            olMap.dispose()
            mapRef.current = null
            pinsRef.current = []
            restoredKeyRef.current = undefined
        }
    }, [categories, extent, locations, map, push, setScreenState])

    useLayoutEffect(() => {
        const olMap = mapRef.current
        if (!olMap || !screenKey || restoredKeyRef.current === screenKey) return
        restoredKeyRef.current = screenKey
        const view = olMap.getView()
        const saved = getScreenState(screenKey)?.mapView
        if (saved) {
            view.setResolution(saved.resolution)
            view.setCenter([saved.x, saved.y])
        } else {
            view.fit(extent)
        }
        olMap.renderSync()
    }, [extent, getScreenState, screenKey])

    useEffect(() => {
        filtersRef.current = filters
        for (const pin of pinsRef.current) showPin(pin, matches(pin.location, filters))
        updateLabelsRef.current()
        const key = screenKeyRef.current
        if (key) setScreenState(key, { mapFilters: filters })
    }, [filters, setScreenState])

    useEffect(() => {
        if (reselected > 0) {
            const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
            // biome-ignore lint/suspicious/noFocusedTests: OpenLayers View.fit, not a focused test
            mapRef.current?.getView().fit(extent, { duration: reduced ? 0 : FIT_DURATION })
        }
    }, [extent, reselected])

    const zoomBy = (delta: number) => {
        const view = mapRef.current?.getView()
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
        if (view) zoomByDelta(view, delta, undefined, reduced ? 0 : ZOOM_DURATION)
    }

    const collapsed = zoomedIn && !filtersOpen
    const filtering = chips.some((c) => filters.hidden.includes(c.id))
    const toggle = (id: string) =>
        setFilters((f) => ({
            ...f,
            hidden: f.hidden.includes(id) ? f.hidden.filter((h) => h !== id) : [...f.hidden, id],
        }))

    return (
        // pins and controls stay hidden until the map image is in, so they never float on an empty map
        <div className={classNames('map-view', imageState !== 'loaded' && 'map-loading')}>
            {imageState !== 'loaded' && (
                <div className='map-loading-cover'>
                    <PageLoading error={imageState === 'failed'} />
                </div>
            )}
            <section
                className={classNames('map-canvas', (!settled || !fontsPlaced) && 'settling')}
                ref={containerRef}
                // biome-ignore lint/a11y/noNoninteractiveTabindex: the map takes focus for arrow-key panning and +/- zoom
                tabIndex={0}
                aria-label={t('map.imageAlt')}
            />
            <div className={classNames('map-search', zoomedIn && 'away')}>
                <SearchField search={mapSearch} hidden={zoomedIn} />
            </div>
            {chips.length > 0 && (
                <div className={classNames('map-filters', collapsed && 'collapsed')}>
                    <div className='map-filters-panel' inert={collapsed}>
                        {chips.map((chip) => (
                            <button
                                key={chip.id}
                                type='button'
                                className='map-filter-chip'
                                aria-pressed={!filters.hidden.includes(chip.id)}
                                style={{ '--dot': chip.color } as CSSProperties}
                                onClick={() => toggle(chip.id)}
                            >
                                <span className='dot' />
                                {chip.name}
                            </button>
                        ))}
                    </div>
                    <button
                        type='button'
                        className='map-filters-toggle icon-button'
                        aria-label={t('events.filter')}
                        inert={!collapsed}
                        onClick={() => setFiltersOpen(true)}
                    >
                        <Icon name='filter_list' fill={filtering ? 1 : 0} />
                        {filtering && <span className='badge-dot' />}
                    </button>
                </div>
            )}
            <div className='map-zoom'>
                <button
                    type='button'
                    className='icon-button'
                    aria-label={t('map.zoomIn')}
                    disabled={atMax}
                    onClick={() => zoomBy(ZOOM_STEP)}
                >
                    <Icon name='add' />
                </button>
                <button
                    type='button'
                    className='icon-button'
                    aria-label={t('map.zoomOut')}
                    disabled={atMin}
                    onClick={() => zoomBy(-ZOOM_STEP)}
                >
                    <Icon name='remove' />
                </button>
            </div>
        </div>
    )
}
