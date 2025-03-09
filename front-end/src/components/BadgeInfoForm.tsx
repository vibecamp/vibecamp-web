import React, { FC } from 'react'

import { Tables } from '../../../back-end/types/db-types'
import useBooleanState from '../hooks/useBooleanState'
import useForm, { fieldToProps } from '../hooks/useForm'
import { useStore } from '../hooks/useStore'
import { vibefetch } from '../vibefetch'
import Button from './core/Button'
import Checkbox from './core/Checkbox'
import Col from './core/Col'
import InfoBlurb from './core/InfoBlurb'
import Input from './core/Input'
import Modal from './core/Modal'
import Spacer from './core/Spacer'

type Props = {
    festival_id: Tables['festival']['festival_id']
    attendee_id: Tables['attendee']['attendee_id']
    onSubmitted: () => void
}

export const BadgeInfoForm: FC<Props> = React.memo(({ festival_id, attendee_id, onSubmitted }) => {
    const store = useStore()

    const accountInfo = store.accountInfo.state.result
    const existingBadgesForAttendee = accountInfo?.badges.filter(b => b.attendee_id === attendee_id)
    const existingBadge = existingBadgesForAttendee?.find(b => b.festival_id === festival_id) ?? existingBadgesForAttendee?.[0]
    const attendeeInfo = accountInfo?.attendees.find(a => a.attendee_id === attendee_id)

    const { fields, handleSubmit, submitting } = useForm<Omit<Tables['badge_info'], 'badge_info_id' | 'attendee_id' | 'festival_id'>>({
        initial: existingBadge ?? {
            badge_name: attendeeInfo?.name || '',
            badge_username: attendeeInfo?.twitter_handle || attendeeInfo?.discord_handle || '',
            badge_location: null,
            badge_bio: null,
            badge_picture_url: null,
            badge_picture_image_id: null,
            attended_vc_1: null,
            attended_vc_2: null
        },
        validators: {
            badge_name: val => {
                if (val === '') {
                    return 'Please enter a name'
                }

                if (val.length > 20) {
                    return 'Please limit to 20 characters so it fits on the badge'
                }
            },
            badge_username: val => {
                if (val?.startsWith('@')) {
                    return 'No need for the @ at the front'
                }

                if (val && val.length > 20) {
                    return 'Please limit to 20 characters so it fits on the badge'
                }
            },
            badge_location: val => {
                if (val && val.length > 20) {
                    return 'Please limit to 20 characters so it fits on the badge'
                }
            },
            badge_bio: val => {
                if (val && val.length > 160) {
                    return 'Please limit to 160 characters so it fits on the badge'
                }
            },
            badge_picture_url: val => {
                if (val && !/^https?:\/\//.test(val)) {
                    return 'Invalid URL'
                }
            }
        },
        submit: async (values) => {
            await vibefetch(store.jwt, '/account/update-badge-info', 'put', {
                ...values,
                attendee_id,
                festival_id
            })
            await store.accountInfo.load()
            onSubmitted()
        }
    })

    const possibleTwitterHandle =
        store.accountInfo.state.result?.attendees.find(a => a.attendee_id === attendee_id)?.twitter_handle ||
        fields.badge_username.value

    const { state: pictureHelpIsOpen, setTrue: openPictureHelp, setFalse: closePictureHelp } = useBooleanState(false)

    return (
        <Col padding={20} pageLevel>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
                <div>
                    This is the info that will be printed on your physical badge for all to see!
                    We&apos;ve prepopulated it with stuff we already know about you, but you can
                    change it to whatever you want to show.
                </div>

                <Spacer size={32} />

                <Input
                    label='Name'
                    placeholder='brooke'
                    {...fieldToProps(fields.badge_name)}
                />

                <Spacer size={8} />

                <InfoBlurb>
                    The name people recognize you by. Typically it would be your twitter
                    display name or your real name, but it can be whatever you want.
                </InfoBlurb>

                <Spacer size={32} />

                <Input
                    label='Username (optional)'
                    placeholder='gtpbrooke'
                    {...fieldToProps(fields.badge_username)}
                />

                <Spacer size={8} />

                <InfoBlurb>
                    The name people can use to find and follow you. You might choose to
                    use your twitter or bluesky handle, or maybe even your website domain
                    or email address.
                </InfoBlurb>

                <Spacer size={32} />

                <Input
                    label='Profile picture URL'
                    placeholder='https://pbs.twimg.com/profile_images/1782955833292402688/z_iNKZZF_400x400.jpg'
                    {...fieldToProps(fields.badge_picture_url)}
                />

                <Spacer size={8} />

                <InfoBlurb>
                    Your picture for your badge.

                    Right now we ask people to link us to an image hosted elsewhere. That elsewhere can be
                    twitter!
                </InfoBlurb>

                <Spacer size={12} />

                <Button onClick={openPictureHelp}>
                    How do I get my twitter profile picture?
                </Button>

                <Modal side='right' isOpen={pictureHelpIsOpen} onClose={closePictureHelp}>
                    {() =>
                        <Col padding={20} pageLevel >
                            <ol style={{ margin: '1em', fontSize: 18 }}>
                                <li>
                                    Navigate to your&nbsp;
                                    {possibleTwitterHandle
                                        ? <a href={`https://x.com/${possibleTwitterHandle}/photo`} target='_blank' rel="noreferrer">profile picture</a>
                                        : 'profile picture'}
                                </li>
                                <li>
                                    Right-click it and copy the image URL
                                </li>
                            </ol>

                            <img src='/profile_pic_guidance_1.png' style={{ maxWidth: '100%', borderRadius: 10 }} />

                            <Spacer size={16} />

                            <img src='/profile_pic_guidance_2.png' style={{ maxWidth: '100%', borderRadius: 10 }} />
                        </Col>}
                </Modal>

                {fields.badge_picture_url.value &&
                    <>
                        <Spacer size={8} />
                        <img src={fields.badge_picture_url.value} style={{ maxWidth: 200, alignSelf: 'center', borderRadius: '50%' }} />
                    </>}

                <Spacer size={32} />

                <Input
                    label='Location (optional)'
                    placeholder='San Francisco'
                    {...fieldToProps(fields.badge_location)}
                />

                <Spacer size={8} />

                <InfoBlurb>
                    Where you live! Can be your city, country, region, planet, multiverse
                    dimension, etc.
                </InfoBlurb>

                <Spacer size={32} />

                <Input
                    label='Badge bio (optional)'
                    placeholder={'I\'m a super cool person, what can I say?'}
                    {...fieldToProps(fields.badge_bio)}
                    multiline
                />

                <Spacer size={8} />

                <InfoBlurb>
                    A blurb about you. You might copy and paste your twitter bio, or
                    write something specific to vibecamp.
                </InfoBlurb>

                <Spacer size={32} />

                <Checkbox {...fieldToProps(fields.attended_vc_1)}>
                    I was at Vibecamp 1 (optional)
                </Checkbox>

                <Spacer size={8} />

                <Checkbox {...fieldToProps(fields.attended_vc_2)}>
                    I was at Vibecamp 2 (optional)
                </Checkbox>

                <Spacer size={8} />

                <InfoBlurb>
                    We&apos;ll indicate this so other attendees can know if they might have met you there.
                </InfoBlurb>

                <Spacer size={48} />

                <Button isSubmit isPrimary isLoading={submitting} >
                    Save
                </Button>

                <Spacer size={32} />
            </form>
        </Col>
    )
})