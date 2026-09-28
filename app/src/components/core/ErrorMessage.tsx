import { classNames } from '@/lib/ui'

type Props = {
    error: string | false | undefined
}

export default function ErrorMessage({ error }: Props) {
    return <div className={classNames('error-message', !!error && 'visible')}>{error}</div>
}
