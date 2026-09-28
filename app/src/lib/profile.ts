import type { AttendeeInfo } from '@/contract/misc'
import { t } from '@/copy/t'
import type { UseFormInit } from '@/hooks/useForm'

const PHONE_REGEX = /^ ?\(? ?[0-9]{3} ?\)? ?[0-9]{3} ?-? ?[0-9]{4} ?$/

export const ATTENDEE_VALIDATORS: UseFormInit<AttendeeInfo>['validators'] = {
    name: (val) => {
        if (val === '') return t('validation.nameRequired')
    },
    twitter_handle: (val) => {
        if (val?.startsWith('@')) return t('validation.twitterNoAtSign')
    },
    phone_number: (val) => {
        if (val && !PHONE_REGEX.test(val)) return t('validation.phoneInvalid')
    },
    age_range: (val) => {
        if (val == null) return t('validation.ageRangeRequired')
    },
}

export const BLANK_ATTENDEE: AttendeeInfo = {
    name: '',
    phone_number: null,
    twitter_handle: null,
    discord_handle: null,
    age_range: null,
}
