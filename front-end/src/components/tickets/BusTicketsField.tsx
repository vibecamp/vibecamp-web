import React from 'react'
import { observer } from 'mobx-react-lite'
import { CommonFieldProps } from '../core/_common'
import InfoBlurb from '../core/InfoBlurb'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'
import { PURCHASE_TYPES_BY_TYPE } from '../../../../back-end/types/misc'

type Props = Pick<CommonFieldProps<typeof BUS_TICKET_OPTIONS[number]['value'] | undefined>, 'value' | 'onChange' | 'error'> & {
    showMessage?: boolean
}

export default observer(({ value, onChange, error, showMessage }: Props) => {
    return (
        <>
            <RadioGroup
                value={value}
                onChange={onChange}
                options={BUS_TICKET_OPTIONS}
                error={error}
            />

            {showMessage &&
                <>
                    <Spacer size={8} />

                    <InfoBlurb>
                        {'You\'ll have the opportunity to come back and buy these later if you\'d like to!'}
                    </InfoBlurb>
                </>}

            <Spacer size={8} />

            <InfoBlurb>
                {`Parking will be free at the event, but if you'd rather
            get to AUS airport and leave the rest to us, you can sign
            up for a bus seat for $60 round trip.`}&nbsp;
                <b>All bus tickets include a return trip to AUS from Camp
                Champions with a departure time of 3:30 pm, April 8th.</b>
            </InfoBlurb>
        </>
    )
})

const BUS_TICKET_OPTIONS = [
    ...[
        PURCHASE_TYPES_BY_TYPE.BUS_330PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_430PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_730PM_VIBECLIPSE_2024,
        PURCHASE_TYPES_BY_TYPE.BUS_830PM_VIBECLIPSE_2024
    ].map(r => ({
        value: r.purchase_type_id,
        label: `$${(r.price_in_cents / 100).toFixed(2)} per attendee - ${r.description}`
    })),
    { value: null, label: 'No Cost - I\'ll get myself to camp, thanks!' },
]
