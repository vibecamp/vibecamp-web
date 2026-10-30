'use client'

import { classNames } from '@/lib/ui'
import type { HeaderSearch } from '../PageHeader'
import Icon from './Icon'

type Props = { search: HeaderSearch; className?: string; hidden?: boolean }

export default function SearchField({ search, className, hidden }: Props) {
    return (
        <div className={classNames('search-field', className)} inert={hidden}>
            <Icon name='search' />
            <input
                type='search'
                aria-label={search.placeholder}
                placeholder={search.placeholder}
                value={search.value}
                onChange={(e) => search.onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') search.onChange('')
                }}
            />
            {search.value && (
                // a pointer shortcut like the browser's own clear button; keyboards clear with Escape
                <button
                    type='button'
                    className='icon-button search-clear'
                    tabIndex={-1}
                    aria-hidden
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => search.onChange('')}
                >
                    <Icon name='close' />
                </button>
            )}
            {search.filter && (
                <button
                    type='button'
                    className={classNames('icon-button', search.filter.active && 'active')}
                    aria-label={search.filter.label}
                    onClick={search.filter.onClick}
                >
                    <Icon name='filter_list' fill={search.filter.active ? 1 : 0} />
                    {search.filter.active && <span className='badge-dot' />}
                </button>
            )}
        </div>
    )
}
