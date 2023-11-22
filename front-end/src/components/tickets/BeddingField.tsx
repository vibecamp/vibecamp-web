import React from 'react'
import { observer } from 'mobx-react-lite'
import { CommonFieldProps } from '../core/_common'
import { useComputed } from '../../mobx/hooks'
import { PURCHASE_TYPES_BY_TYPE } from '../../../../back-end/types/misc'
import Checkbox from '../core/Checkbox'
import InfoBlurb from '../core/InfoBlurb'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'

type Props = Pick<CommonFieldProps<boolean | undefined>, 'value' | 'onChange' | 'error'> & {
    needsPillow: boolean,
    onNeedsPillowChange: CommonFieldProps<boolean>['onChange'],
    attendeeCount: number
    showMessage?: boolean,
}

export default observer(({ value, onChange, error, showMessage, needsPillow, onNeedsPillowChange, attendeeCount }: Props) => {
    const options = useComputed(() => [
        {
            value: true,
            label: `Yes, I would like to purchase ${attendeeCount === 1 ? 'a sleeping bag' : `${attendeeCount} sleeping bags`} ($${PURCHASE_TYPES_BY_TYPE.SLEEPING_BAG_VIBECLIPSE_2024.price_in_cents / 100} each)`
        },
        {
            value: false,
            label: `No, ${attendeeCount === 1 ? 'I' : 'we'} will be bringing ${attendeeCount === 1 ? 'my' : 'our'} own bedding`
        },
    ])

    return (
        <>
            <RadioGroup
                value={value}
                onChange={onChange}
                options={options}
                error={error}
            />

            <Spacer size={16} />

            <Checkbox value={needsPillow} onChange={onNeedsPillowChange}>
                    I would like {attendeeCount === 1 ? 'a pillow' : `${attendeeCount} pillows`} (${PURCHASE_TYPES_BY_TYPE.PILLOW_WITH_CASE_VIBECLIPSE_2024.price_in_cents / 100} each)
            </Checkbox>

            {showMessage &&
                <>
                    <Spacer size={16} />

                    <InfoBlurb>
                        {'You\'ll have the opportunity to come back and buy these later if you\'d like to!'}
                    </InfoBlurb>
                </>}

            <Spacer size={16} />

            <InfoBlurb>
                {`Camp Champions will have small (slightly smaller than 
                    twin), bare mattresses within the cabins. We recommend 
                    you pack along whatever bedding you'd be most 
                    comfortable with, but if for whatever reason you are 
                    unable to provide your own, we'll be offering 3-season 
                    sleeping bags for purchase. If you buy one and would prefer 
                    to donate it instead, we'll be making a donation run at the 
                    end of the event.`}
            </InfoBlurb>

        </>
    )
})