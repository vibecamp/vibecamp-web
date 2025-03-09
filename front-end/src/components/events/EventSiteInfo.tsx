import React from 'react'

import { Tables } from '../../../../back-end/types/db-types'
import Spacer from '../core/Spacer'

export default React.memo(({ eventSite }: { eventSite: Tables['event_site'] }) => {

    return (
        <div>
            <div style={{ fontWeight: 'bold' }}>
                Location info
            </div>

            {eventSite.description &&
                <>
                    <Spacer size={4} />

                    <div>
                        {eventSite.description}
                    </div>
                </>}

            <Spacer size={4} />

            <div>
                Type: {eventSite.structure_type}
            </div>

            {eventSite.people_cap &&
                <>
                    <Spacer size={4} />

                    <div>
                        Max capacity: {eventSite.people_cap}
                    </div>
                </>}
            {eventSite.equipment &&
                <>
                    <Spacer size={4} />

                    <div>
                        Available equipment: {eventSite.equipment}
                    </div>
                </>}
        </div>
    )
})