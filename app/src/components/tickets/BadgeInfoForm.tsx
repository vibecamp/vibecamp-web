'use client'

import { t } from '@/copy/t'
import useBooleanState from '@/hooks/useBooleanState'
import useForm, { fieldToProps } from '@/hooks/useForm'
import { useStore } from '@/hooks/useStore'
import type { Badge } from '@/lib/cart'
import { vibefetch } from '@/lib/fetch'
import { DEFAULT_FORM_ERROR, fillNodes } from '@/lib/ui'
import Button from '../core/Button'
import ErrorMessage from '../core/ErrorMessage'
import InfoBlurb from '../core/InfoBlurb'
import Input from '../core/Input'
import Modal from '../core/Modal'

const LIMIT_20 = 20
const LIMIT_160 = 160

export default function BadgeInfoForm({ ticket_id }: { ticket_id: string }) {
    const store = useStore()

    const existingBadge = store.accountInfo.state.result?.owned_tickets.find(
        (ticket) => ticket.purchase_id === ticket_id,
    )?.badge

    const { fields, handleSubmit, submitting, wholeFormError } = useForm<Badge>({
        initial: {
            badge_name: existingBadge?.badge_name ?? '',
            badge_username: existingBadge?.badge_username ?? null,
            badge_location: existingBadge?.badge_location ?? null,
            badge_bio: existingBadge?.badge_bio ?? null,
            badge_picture_url: existingBadge?.badge_picture_url ?? null,
            badge_picture_image_id: null,
        },
        validators: {
            badge_name: (val) => {
                if (val === '') {
                    return t('validation.nameRequired')
                }
                if (val.length > LIMIT_20) {
                    return t('badge.limit20')
                }
            },
            badge_username: (val) => {
                if (val?.startsWith('@')) {
                    return t('badge.noAtSign')
                }
                if (val && val.length > LIMIT_20) {
                    return t('badge.limit20')
                }
            },
            badge_location: (val) => {
                if (val && val.length > LIMIT_20) {
                    return t('badge.limit20')
                }
            },
            badge_bio: (val) => {
                if (val && val.length > LIMIT_160) {
                    return t('badge.limit160')
                }
            },
            badge_picture_url: (val) => {
                if (val && !/^https?:\/\//.test(val)) {
                    return t('badge.invalidUrl')
                }
            },
        },
        submit: async (values) => {
            const { status } = await vibefetch(store.jwt, '/ticket/badge', 'put', {
                ticket_id,
                badge: values,
            })
            if (status !== 200) {
                return DEFAULT_FORM_ERROR
            }
            await store.accountInfo.load()
        },
    })

    const possibleTwitterHandle = fields.badge_username.value
    const profilePictureUrl = possibleTwitterHandle
        ? `https://x.com/${possibleTwitterHandle}/photo`
        : undefined

    const {
        state: pictureHelpIsOpen,
        setTrue: openPictureHelp,
        setFalse: closePictureHelp,
    } = useBooleanState(false)

    return (
        <div className='page narrow'>
            <form onSubmit={handleSubmit} noValidate className='stack'>
                <div className='stack tight'>
                    <Input
                        label={t('badge.nameLabel')}
                        placeholder={t('badge.namePlaceholder')}
                        {...fieldToProps(fields.badge_name)}
                    />
                    <InfoBlurb>{t('badge.nameBlurb')}</InfoBlurb>
                </div>

                <div className='stack tight'>
                    <Input
                        label={t('badge.usernameLabel')}
                        placeholder={t('badge.usernamePlaceholder')}
                        {...fieldToProps(fields.badge_username)}
                    />
                    <InfoBlurb>{t('badge.usernameBlurb')}</InfoBlurb>
                </div>

                <div className='stack tight'>
                    <Input
                        label={t('badge.pictureUrlLabel')}
                        placeholder={t('badge.pictureUrlPlaceholder')}
                        type='url'
                        {...fieldToProps(fields.badge_picture_url)}
                    />
                    <InfoBlurb>{t('badge.pictureUrlBlurb')}</InfoBlurb>
                    <Button onClick={openPictureHelp}>{t('badge.pictureHelpButton')}</Button>
                    {fields.badge_picture_url.value && (
                        // biome-ignore lint/performance/noImgElement: a user-supplied URL on any host, which next/image cannot optimise without a remotePatterns allow-list
                        <img
                            className='picture-preview'
                            src={fields.badge_picture_url.value}
                            alt=''
                        />
                    )}
                </div>

                <Modal
                    isOpen={pictureHelpIsOpen}
                    onClose={closePictureHelp}
                    title={t('badge.pictureHelpButton')}
                >
                    {() => (
                        <div className='stack picture-help'>
                            <ol>
                                <li>
                                    {fillNodes(t('badge.pictureHelpStep1'), {
                                        profilePictureLink:
                                            profilePictureUrl != null ? (
                                                <a
                                                    href={profilePictureUrl}
                                                    target='_blank'
                                                    rel='noreferrer'
                                                >
                                                    {t('badge.pictureHelpProfilePictureLinkText')}
                                                </a>
                                            ) : (
                                                t('badge.pictureHelpProfilePictureLinkText')
                                            ),
                                    })}
                                </li>
                                <li>{t('badge.pictureHelpStep2')}</li>
                            </ol>
                            {/* biome-ignore lint/performance/noImgElement: static guidance screenshot sized by CSS */}
                            <img src='/profile_pic_guidance_1.png' alt='' />
                            {/* biome-ignore lint/performance/noImgElement: static guidance screenshot sized by CSS */}
                            <img src='/profile_pic_guidance_2.png' alt='' />
                        </div>
                    )}
                </Modal>

                <div className='stack tight'>
                    <Input
                        label={t('badge.locationLabel')}
                        placeholder={t('badge.locationPlaceholder')}
                        {...fieldToProps(fields.badge_location)}
                    />
                    <InfoBlurb>{t('badge.locationBlurb')}</InfoBlurb>
                </div>

                <div className='stack tight'>
                    <Input
                        label={t('badge.bioLabel')}
                        placeholder={t('badge.bioPlaceholder')}
                        {...fieldToProps(fields.badge_bio)}
                        multiline
                    />
                    <InfoBlurb>{t('badge.bioBlurb')}</InfoBlurb>
                </div>

                <ErrorMessage error={wholeFormError} />

                <Button isSubmit isPrimary isLoading={submitting}>
                    {t('common.save')}
                </Button>
            </form>
        </div>
    )
}
