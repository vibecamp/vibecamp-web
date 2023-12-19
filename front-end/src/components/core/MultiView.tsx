import React, { CSSProperties, ReactNode } from 'react'

import { observer } from '../../mobx/misc'

type Props<TView> = {
    views: readonly { readonly name: TView, readonly content: ReactNode }[],
    currentView: TView,
}

function MultiView<TView>({ views, currentView }: Props<TView>) {
    return (
        <div className='multi-view' style={{
            '--view-count': views.length,
            '--current-view': views.findIndex(e => e.name === currentView)
        } as CSSProperties}>
            <div className='sliding-container'>
                {views.map(({ name, content }) =>
                    <div className='slide' key={String(name)}>
                        {content}
                    </div>)}
            </div>
        </div>
    )
}

export default observer(MultiView) as typeof MultiView