import {
  Button,
  Callout,
  Classes,
  Drawer,
  FormGroup,
  InputGroup,
  TextArea,
} from '@blueprintjs/core'
import classnames from 'classnames'
import { observer } from 'mobx-react-lite'
import React, { FormEvent, FunctionComponent, useEffect, useState } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'
import type { MinimongoQueryInput } from '@/Utils/MinimongoQuery'

export const MinimongoQueryDrawer: FunctionComponent = observer(() => {
  const { minimongoStore } = usePanelStore()
  const [input, setInput] = useState<MinimongoQueryInput>(
    minimongoStore.queryInput,
  )

  useEffect(() => {
    if (minimongoStore.isQueryVisible) {
      setInput(minimongoStore.queryInput)
    }
  }, [minimongoStore.isQueryVisible, minimongoStore.queryInput])

  const setField = (field: keyof MinimongoQueryInput, value: string) => {
    setInput(current => ({ ...current, [field]: value }))
  }

  const close = () => minimongoStore.setQueryVisible(false)

  const apply = (event: FormEvent) => {
    event.preventDefault()
    minimongoStore.applyQuery(input)

    if (!minimongoStore.queryError) close()
  }

  return (
    <Drawer
      icon='filter'
      isOpen={minimongoStore.isQueryVisible}
      onClose={close}
      position='right'
      size='50%'
      title='Query captured Minimongo documents'
    >
      <form className='flex h-full flex-col' onSubmit={apply}>
        <div className={Classes.DRAWER_BODY}>
          <div
            className={classnames(Classes.DIALOG_BODY, 'flex flex-col gap-4')}
          >
            <Callout intent='primary'>
              Queries run against the captured snapshot. Compass-style object
              syntax is supported. Field operators: $eq, $ne, $gt, $gte, $lt,
              $lte, $in, $nin, and $exists. Logical operators: $and and $or.
              Arbitrary JavaScript is never evaluated.
            </Callout>

            {minimongoStore.queryError && (
              <Callout intent='danger' title='Invalid query'>
                {minimongoStore.queryError}
              </Callout>
            )}

            <FormGroup label='Selector' labelFor='minimongo-query-selector'>
              <TextArea
                fill
                id='minimongo-query-selector'
                onChange={event => setField('selector', event.target.value)}
                placeholder='{ name: { $ne: null } }'
                rows={6}
                value={input.selector}
              />
            </FormGroup>
            <FormGroup label='Sort' labelFor='minimongo-query-sort'>
              <InputGroup
                id='minimongo-query-sort'
                onChange={event => setField('sort', event.target.value)}
                value={input.sort}
              />
            </FormGroup>
            <FormGroup label='Projection' labelFor='minimongo-query-projection'>
              <InputGroup
                id='minimongo-query-projection'
                onChange={event => setField('projection', event.target.value)}
                value={input.projection}
              />
            </FormGroup>
            <FormGroup label='Limit' labelFor='minimongo-query-limit'>
              <InputGroup
                id='minimongo-query-limit'
                inputMode='numeric'
                onChange={event => setField('limit', event.target.value)}
                value={input.limit}
              />
            </FormGroup>
          </div>
        </div>
        <div className={Classes.DRAWER_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button onClick={close}>Cancel</Button>
            <Button intent='primary' type='submit'>
              Apply query
            </Button>
          </div>
        </div>
      </form>
    </Drawer>
  )
})
