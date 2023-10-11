import React, { CSSProperties, ReactNode } from 'react'
import { observer } from 'mobx-react-lite'

type Props<TView extends string> = {
    views: readonly { readonly name: TView, readonly content: ReactNode }[],
    currentView: TView,
}

function MultiView<TView extends string>({views, currentView}: Props<TView>) {
    return (
        <div className='multi-view' style={{
            '--view-count': views.length,
            '--current-view': views.findIndex(e => e.name === currentView)
        } as CSSProperties}>
            <div className='sliding-container'>
                {views.map(({ name, content }) =>
                    <div className='slide' key={name}>
                        {content}
                    </div>)}
            </div>
        </div>
    )
}

export default observer(MultiView) as typeof MultiView