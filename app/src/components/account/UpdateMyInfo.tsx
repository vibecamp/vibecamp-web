'use client'

import type { AttendeeInfo } from '@/contract/misc'
import { t } from '@/copy/t'
import useForm, { fieldToProps } from '@/hooks/useForm'
import { useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import { ATTENDEE_VALIDATORS, BLANK_ATTENDEE } from '@/lib/profile'
import { DEFAULT_FORM_ERROR } from '@/lib/ui'
import Button from '../core/Button'
import ErrorMessage from '../core/ErrorMessage'
import InfoBlurb from '../core/InfoBlurb'
import Input from '../core/Input'
import RadioGroup from '../core/RadioGroup'

export default function UpdateMyInfo() {
    const store = useStore()

    const { fields, handleSubmit, submitting, wholeFormError } = useForm<AttendeeInfo>({
        initial: store.accountInfo.state.result?.primary_attendee ?? BLANK_ATTENDEE,
        validators: ATTENDEE_VALIDATORS,
        submit: async (values) => {
            const { status } = await vibefetch(store.jwt, '/account/profile', 'put', values)
            if (status !== 200) {
                return DEFAULT_FORM_ERROR
            }
            await store.accountInfo.load()
        },
    })

    const ageRangeOptions = [...(store.ageRanges ?? [])]
        .sort((a, b) => (b.start ?? 0) - (a.start ?? 0))
        .map((r) => ({ value: r.age_range, label: r.description }))

    return (
        <form onSubmit={handleSubmit} noValidate className='stack'>
            <div className='stack tight'>
                <Input
                    label={t('attendee.nameLabel')}
                    placeholder={t('attendee.namePlaceholder')}
                    {...fieldToProps(fields.name)}
                />
                <InfoBlurb>{t('attendee.nameBlurbSelf')}</InfoBlurb>
            </div>

            <div className='stack tight'>
                <Input
                    label={t('attendee.phoneLabel')}
                    placeholder={t('attendee.phonePlaceholder')}
                    type='tel'
                    {...fieldToProps(fields.phone_number)}
                />
                <InfoBlurb>{t('attendee.phoneBlurb')}</InfoBlurb>
            </div>

            <div className='stack tight'>
                <Input
                    label={t('attendee.twitterLabel')}
                    placeholder={t('attendee.twitterPlaceholder')}
                    {...fieldToProps(fields.twitter_handle)}
                />
                <InfoBlurb>{t('attendee.twitterBlurb')}</InfoBlurb>
            </div>

            <div className='stack tight'>
                <Input
                    label={t('attendee.discordLabel')}
                    placeholder={t('attendee.discordPlaceholder')}
                    {...fieldToProps(fields.discord_handle)}
                />
                <InfoBlurb>{t('attendee.discordBlurbSelf')}</InfoBlurb>
            </div>

            <RadioGroup
                label={t('attendee.ageRangeLabelSelf')}
                options={ageRangeOptions}
                {...fieldToProps(fields.age_range)}
                value={fields.age_range.value ?? undefined}
            />

            <ErrorMessage error={wholeFormError} />

            <Button isSubmit isPrimary isLoading={submitting}>
                {t('account.updateMyInfo')}
            </Button>
        </form>
    )
}
