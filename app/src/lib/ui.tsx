import { Fragment, type ReactNode } from 'react'
import { t } from '@/copy/t'

export const DEFAULT_FORM_ERROR = t('common.defaultFormError')

export function doNothing() {}

const URL_REGEX =
    /(?:http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/gim

export function urlsToLinks(str: string): ReactNode[] {
    const segments: ReactNode[] = []
    let lastIndex = 0
    for (const match of str.matchAll(URL_REGEX)) {
        const url = match[0]
        segments.push(str.substring(lastIndex, match.index))
        segments.push(
            <a href={url} target='_blank' rel='noreferrer' key={match.index}>
                {url}
            </a>,
        )
        lastIndex = match.index + url.length
    }
    segments.push(str.substring(lastIndex))
    return segments
}

export function classNames(...names: Array<string | false | null | undefined>): string {
    return names.filter((name): name is string => typeof name === 'string' && name !== '').join(' ')
}

export function fillNodes(template: string, values: Record<string, ReactNode>): ReactNode[] {
    const nodes: ReactNode[] = []
    let lastIndex = 0
    for (const match of template.matchAll(/\{(\w+)\}/g)) {
        const key = match[1] ?? ''
        if (!(key in values)) {
            continue
        }
        nodes.push(template.slice(lastIndex, match.index))
        nodes.push(<Fragment key={match.index}>{values[key]}</Fragment>)
        lastIndex = match.index + match[0].length
    }
    nodes.push(template.slice(lastIndex))
    return nodes
}
