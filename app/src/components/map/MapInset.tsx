'use client'

import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { LocationJson } from '@/contract/route-types'
import { useStore } from '@/hooks/useStore'
import { imagePath } from '@/lib/routes'
import FadeInImage from '../core/FadeInImage'
import PinIcon from './PinIcon'

type Props = { location: LocationJson; href?: string }

export default function MapInset({ location, href }: Props) {
    const { map, locationCategories } = useStore()
    if (!map || location.pin_x == null || location.pin_y == null || location.deleted_at) return null

    const color = locationCategories?.find(
        (c) => c.location_category_id === location.location_category_id,
    )?.color
    const style = { '--x': location.pin_x, '--y': location.pin_y } as CSSProperties
    const body = (
        <>
            <FadeInImage
                src={imagePath(map.image_id)}
                width={map.width}
                height={map.height}
                alt=''
            />
            <PinIcon color={color} />
        </>
    )

    return href ? (
        <Link className='map-inset' href={href} prefetch aria-label={location.name} style={style}>
            {body}
        </Link>
    ) : (
        <div className='map-inset' style={style} aria-hidden>
            {body}
        </div>
    )
}
