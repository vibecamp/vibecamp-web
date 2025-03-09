import React from 'react'

import InfoBlurb from '../core/InfoBlurb'
import Spacer from '../core/Spacer'

export default React.memo(() => {
    const inviteCodes = [] // Store.accountInfo.state.result?.inviteCodes

    // if (inviteCodes == null || inviteCodes.length === 0) {
    //     return null
    // }

    return (
        <>
            <h2>
                Your invite codes
            </h2>

            <Spacer size={8} />

            <InfoBlurb>
                You can give these to other people you know and
                trust to allow them to buy tickets
            </InfoBlurb>

            <Spacer size={16} />

            {/* {inviteCodes.map(({ code, used_by }, index) =>
                <React.Fragment key={index}>
                    {index > 0 && <Spacer size={8} />}

                    <InviteCode code={code} usedBy={used_by} />
                </React.Fragment>)} */}
        </>
    )
})