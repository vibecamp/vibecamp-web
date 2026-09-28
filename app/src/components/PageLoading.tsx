import { t } from '@/copy/t'
import LoadingDots from './core/LoadingDots'

export default function PageLoading({ error }: { error?: boolean }) {
    return (
        <div className='page centered'>
            {error ? (
                <p className='muted'>{t('common.failedToLoad')}</p>
            ) : (
                <LoadingDots size={80} color='var(--color-accent-1)' />
            )}
        </div>
    )
}
