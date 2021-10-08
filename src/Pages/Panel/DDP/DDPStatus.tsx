import { Spinner, Tag, Tooltip } from '@blueprintjs/core'
import { isNumber } from 'lodash'
import { observer } from 'mobx-react-lite'
import React, { FormEvent, FunctionComponent } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'
import { StatusBar } from '@/Components/StatusBar'
import { DDPFilterMenu } from '@/Pages/Panel/DDP/DDPFilterMenu'
import { Position } from '@blueprintjs/core/lib/esm/common/position'
import { TextInput } from '@/Components/TextInput'
import { PopoverButton } from '@/Components/PopoverButton'
import { Button } from '@/Components/Button'
import prettyBytes from 'pretty-bytes'
import { Field } from '@/Components/Field'
import { StringUtils } from '@/Utils/StringUtils'

export const DDPStatus: FunctionComponent = observer(() => {
  const store = usePanelStore()
  const { ddpStore } = store

  const activeFilters = store.settingStore.activeFilters
  const setFilter = store.settingStore.setFilter.bind(store.settingStore)
  const collectionLength = ddpStore.collection.length
  const { inboundBytes, outboundBytes, isLoading, pagination } = ddpStore

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
        {isLoading && (
          <Field>
            <Spinner size={12} intent='warning' />
          </Field>
        )}

        {store.gitCommitHash ? (
          <Tooltip
            content='Git Commit Hash'
            hoverOpenDelay={800}
            position='top'
          >
            <Tag
              minimal
              interactive
              onClick={() => {
                StringUtils.toClipboard(store.gitCommitHash as string)
              }}
              style={{ marginRight: 4 }}
            >
              {store.gitCommitHash.slice(0, 8)}
            </Tag>
          </Tooltip>
        ) : null}

        {!!inboundBytes && (
          <Field icon='cloud-download'>{prettyBytes(inboundBytes)}</Field>
        )}

        {!!outboundBytes && (
          <Field icon='cloud-upload'>{prettyBytes(outboundBytes)}</Field>
        )}

        {isNumber(collectionLength) && (
          <Button
            intent='warning'
            onClick={() => ddpStore.clearLogs()}
            icon='inbox'
          >
            {collectionLength}
          </Button>
        )}
      </div>
    </StatusBar>
  )
})
