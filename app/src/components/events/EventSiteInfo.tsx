import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import type { Tables } from '@/db/types'

export default function EventSiteInfo({ eventSite }: { eventSite: Tables['event_site'] }) {
    return (
        <div className='site-info'>
            <b>{t('eventEditor.siteInfoHeading')}</b>
            {eventSite.description && <div>{eventSite.description}</div>}
            <div>
                {fill(t('eventEditor.siteType'), { structureType: eventSite.structure_type })}
            </div>
            {eventSite.people_cap && (
                <div>
                    {fill(t('eventEditor.siteMaxCapacity'), { peopleCap: eventSite.people_cap })}
                </div>
            )}
            {eventSite.equipment && (
                <div>
                    {fill(t('eventEditor.siteEquipment'), { equipment: eventSite.equipment })}
                </div>
            )}
        </div>
    )
}
