import { observer } from 'mobx-react-lite'
import React, { FormEvent, FunctionComponent } from 'react'

import { usePanelStore } from '@/Stores/PanelStore'
import { StatusBar } from '@/Components/StatusBar'
import { DDPFilterMenu } from '@/Pages/Panel/DDP/DDPFilterMenu'
import { Position } from '@blueprintjs/core/lib/esm/common/position'
import { TextInput } from '@/Components/TextInput'
import { PopoverButton } from '@/Components/PopoverButton'
import { Field } from '@/Components/Field'
import { exists } from '@/Utils'

export const BookmarksStatus: FunctionComponent = observer(() => {
  const store = usePanelStore()
  const { bookmarkStore } = store

  const activeFilters = store.settingStore.activeFilters
  const setFilter = store.settingStore.setFilter.bind(store.settingStore)
  const collectionLength = bookmarkStore.collection.length
  const { pagination } = bookmarkStore

  return (
    <StatusBar>
      <div className='left-group'>
        <PopoverButton
          icon='filter'
          height={28}
          content={
            <DDPFilterMenu
              setFilter={setFilter}
              activeFilters={activeFilters}
            />
          }
          position={Position.RIGHT_TOP}
        >
          Filter
        </PopoverButton>

        <TextInput
          icon='search'
          placeholder='Search...'
          onChange={(event: FormEvent<HTMLInputElement>) =>
            pagination.setSearch(event.currentTarget.value)
          }
        />

        <Field icon='eye-open'>{pagination.length}</Field>
      </div>

      <div className='right-group'>
        {exists(collectionLength) && (
          <Field intent='warning' icon='inbox'>
            {collectionLength}
          </Field>
        )}
      </div>
    </StatusBar>
  )
})
