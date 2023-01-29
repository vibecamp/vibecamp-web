import React, { FC } from 'react'
import { usePromiseLazy } from '../../hooks/usePromise'
import Button from '../common/Button'
import Spacer from '../common/Spacer'

type Props = {
    onSave: () => Promise<void>,
    onCancel: () => void,
}

const SaveOrDiscard: FC<Props> = React.memo(({ onSave, onCancel }) => {
    const [handleSaveClick, saveState] = usePromiseLazy(onSave)

    return (
        <div>
            <Button appearance="primary" onClick={handleSaveClick} loading={saveState.kind === 'loading'}>
                Save Changes
            </Button>

            <Spacer size={1} />

            <Button appearance="secondary" onClick={onCancel} disabled={saveState.kind === 'loading'}>
                Discard Changes
            </Button>

            <Spacer size={1} />

            {saveState.kind === 'error' &&
                <span style={{ color: 'red' }}>
                    Encountered an error, failed to save changes. Please try again.
                </span>}
        </div>
    )
})

export default SaveOrDiscard