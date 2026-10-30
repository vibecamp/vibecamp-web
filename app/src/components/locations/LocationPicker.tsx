'use client'

import { useState } from 'react'
import type { LocationJson } from '@/contract/route-types'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { matchesLocation } from '@/lib/locations'
import type { CommonFieldProps } from '../core/_common'
import ErrorMessage from '../core/ErrorMessage'
import Input from '../core/Input'
import RadioGroup from '../core/RadioGroup'

type Props = Omit<CommonFieldProps<string | null>, 'label'> & { currentId: string | null }

const selectable = (l: LocationJson) => l.events_allowed && l.deleted_at == null

export default function LocationPicker({
    value,
    onChange,
    onBlur,
    error,
    disabled,
    currentId,
}: Props) {
    const store = useStore()
    const [query, setQuery] = useState('')
    const categories = store.locationCategories ?? []
    const options = (store.locations ?? [])
        .filter((l) => selectable(l) || l.location_id === currentId)
        .filter((l) => matchesLocation(l, query))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    const pinned = options.filter((l) => l.pin_x != null)
    const groups = [
        ...categories.map((c) => ({
            key: c.location_category_id,
            title: c.name,
            items: pinned.filter((l) => l.location_category_id === c.location_category_id),
        })),
        {
            key: 'uncategorized',
            title: categories.length > 0 ? t('eventEditor.locationUncategorized') : undefined,
            items: pinned.filter(
                (l) => !categories.some((c) => c.location_category_id === l.location_category_id),
            ),
        },
        {
            key: 'unmapped',
            title: t('eventEditor.locationUnmapped'),
            items: options.filter((l) => l.pin_x == null),
        },
    ].filter((g) => g.items.length > 0)

    return (
        <div className='location-picker'>
            <Input
                label={t('eventEditor.locationLabel')}
                placeholder={t('eventEditor.locationSearch')}
                value={query}
                onChange={setQuery}
                disabled={disabled}
            />
            <div className='location-options'>
                {groups.map((g) => (
                    <RadioGroup
                        key={g.key}
                        label={g.title}
                        value={value ?? undefined}
                        onChange={onChange}
                        onBlur={onBlur}
                        disabled={disabled}
                        options={g.items.map((l) => ({
                            value: l.location_id,
                            label: selectable(l) ? (
                                l.name
                            ) : (
                                <span>
                                    {l.name}{' '}
                                    <span className='location-unavailable'>
                                        {t('location.unavailable')}
                                    </span>
                                </span>
                            ),
                        }))}
                    />
                ))}
                {groups.length === 0 && (
                    <p className='empty-state'>{t('eventEditor.locationNoMatches')}</p>
                )}
            </div>
            <ErrorMessage error={error} />
        </div>
    )
}
