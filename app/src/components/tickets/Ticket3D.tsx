'use client'

import { useEffect, useRef, useState } from 'react'
import type { WebGLRenderer } from 'three'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { classNames } from '@/lib/ui'
import type { OwnedTicket } from '@/server/tickets'
import Button from '../core/Button'
import Icon from '../core/Icon'
import { useToast } from '../Toast'
import type { TicketFaces, TicketScene } from './ticket-scene'

const exported = new Map<string, File | null>()

type Props = { ticket: OwnedTicket }

export default function Ticket3D({ ticket }: Props) {
    const toast = useToast()
    const holder = useStore().accountInfo.state.result?.primary_attendee?.name || null
    const key = `${ticket.purchase_id}:${holder ?? ''}`
    const stageRef = useRef<HTMLDivElement>(null)
    const facesRef = useRef<TicketFaces | null>(null)
    const [failed, setFailed] = useState(false)
    const [ready, setReady] = useState(false)
    const [videoSupported, setVideoSupported] = useState<boolean>()
    const [video, setVideo] = useState<File | null | undefined>(() => exported.get(key))

    // biome-ignore lint/correctness/useExhaustiveDependencies: the scene is built once per mounted ticket
    useEffect(() => {
        const stage = stageRef.current
        if (!stage) return
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
        let renderer: WebGLRenderer | null = null
        let scene: TicketScene | null = null
        let disposed = false
        let dirty = true
        let last = performance.now()
        const motion = { turn: 0, velocity: 0, dragging: false, x: 0, at: 0 }

        const resize = () => {
            const { width, height } = stage.getBoundingClientRect()
            if (!renderer || !scene || !width || !height) return
            renderer.setSize(width, height, false)
            scene.resize(width, height)
            dirty = true
        }
        const observer = new ResizeObserver(resize)
        observer.observe(stage)

        function frame(now: number) {
            if (!renderer || !scene) return
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            if (!motion.dragging) {
                if (Math.abs(motion.velocity) > 0.4) {
                    motion.turn += motion.velocity * dt
                    motion.velocity *= Math.exp(-2.5 * dt)
                } else {
                    motion.velocity = 0
                    const target = Math.round(motion.turn / Math.PI) * Math.PI
                    const step = (target - motion.turn) * (1 - Math.exp(-6 * dt))
                    motion.turn += step
                    if (Math.abs(step) > 1e-4) dirty = true
                }
            }
            if (reduced && !dirty && motion.velocity === 0 && !motion.dragging) return
            const seconds = now / 1000
            const sway = reduced ? 0 : 1
            scene.apply({
                turn: motion.turn + sway * 0.22 * Math.sin(seconds * 0.7),
                tilt: sway * 0.06 * Math.sin(seconds * 0.9),
                lift: sway * 0.05 * Math.sin(seconds * 1.3),
                time: reduced ? 1.1 : seconds,
                sweep: reduced ? 0.3 : 0.5 + 0.5 * Math.sin(seconds * 0.5),
            })
            renderer.render(scene.scene, scene.camera)
            dirty = false
        }

        const onDown = (event: PointerEvent) => {
            motion.dragging = true
            motion.velocity = 0
            motion.x = event.clientX
            motion.at = event.timeStamp
            stage.setPointerCapture(event.pointerId)
        }
        const onMove = (event: PointerEvent) => {
            if (!motion.dragging) return
            const delta = (event.clientX - motion.x) * 0.012
            const seconds = (event.timeStamp - motion.at) / 1000
            motion.turn += delta
            if (seconds > 0) motion.velocity = delta / seconds
            motion.x = event.clientX
            motion.at = event.timeStamp
            dirty = true
        }
        const onUp = () => {
            motion.dragging = false
        }
        stage.addEventListener('pointerdown', onDown)
        stage.addEventListener('pointermove', onMove)
        stage.addEventListener('pointerup', onUp)
        stage.addEventListener('pointercancel', onUp)

        import('./ticket-scene')
            .then((m) => m.prepareTicket({ ...ticket, holder }))
            .then((prepared) => {
                if (disposed) return
                renderer = prepared.renderer
                scene = prepared.scene
                facesRef.current = prepared.faces
                const canvas = renderer.domElement
                canvas.setAttribute('role', 'img')
                canvas.setAttribute(
                    'aria-label',
                    fill(t('tickets.stageLabel'), {
                        name: ticket.name,
                        festival: ticket.festival_name,
                    }),
                )
                stage.prepend(canvas)
                resize()
                last = performance.now()
                setReady(true)
                renderer.setAnimationLoop(frame)
            })
            .catch(() => setFailed(true))

        return () => {
            disposed = true
            observer.disconnect()
            stage.removeEventListener('pointerdown', onDown)
            stage.removeEventListener('pointermove', onMove)
            stage.removeEventListener('pointerup', onUp)
            stage.removeEventListener('pointercancel', onUp)
            renderer?.setAnimationLoop(null)
            renderer?.domElement.remove()
        }
    }, [])

    useEffect(() => {
        let cancelled = false
        void import('./ticket-scene')
            .then((m) => m.canSaveVideo())
            .catch(() => false)
            .then((supported) => {
                if (!cancelled) setVideoSupported(supported)
            })
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        const faces = facesRef.current
        if (!ready || !faces || !videoSupported || exported.get(key) !== undefined) return
        const controller = new AbortController()
        const name = `${ticket.festival_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ticket`
        const keep = (file: File | null) => {
            exported.set(key, file)
            setVideo(file)
        }
        void (async () => {
            // keeps the export's GPU work out of the ticket's entrance
            await new Promise((resolve) => setTimeout(resolve, 1000))
            try {
                controller.signal.throwIfAborted()
                const { exportTicket } = await import('./ticket-scene')
                keep(await exportTicket(faces, name, controller.signal))
            } catch {
                if (!controller.signal.aborted) keep(null)
            }
        })()
        return () => controller.abort()
    }, [ready, videoSupported, ticket.festival_name, key])

    async function share() {
        if (!video) return
        if (matchMedia('(pointer: coarse)').matches && navigator.canShare?.({ files: [video] })) {
            try {
                await navigator.share({ files: [video] })
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError')) {
                    toast(t('tickets.exportFailed'))
                }
            }
            return
        }
        const url = URL.createObjectURL(video)
        Object.assign(document.createElement('a'), { href: url, download: video.name }).click()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
    }

    if (failed) return null

    return (
        <>
            <div ref={stageRef} className={classNames('ticket-stage', ready && 'ready')} />
            {videoSupported !== false && video !== null && (
                <div className='button-row'>
                    {video ? (
                        <Button onClick={() => void share()}>
                            <Icon name='share' />
                            {t('tickets.share')}
                        </Button>
                    ) : (
                        <span className='button button-skeleton' aria-hidden>
                            <Icon name='share' />
                            {t('tickets.share')}
                        </span>
                    )}
                </div>
            )}
        </>
    )
}
