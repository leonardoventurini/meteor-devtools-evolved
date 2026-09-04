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
import React, { FormEvent, FunctionComponent } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'

const MINIMONGO_QUERY_FORM_ID = 'minimongo-query-form'

export const MinimongoQueryDrawer: FunctionComponent = observer(() => {
  const { minimongoStore } = usePanelStore()

  const close = () => minimongoStore.setQueryVisible(false)

  const apply = (event: FormEvent) => {
    event.preventDefault()
    minimongoStore.applyQuery(minimongoStore.queryDraftInput)

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
      <form
        className={Classes.DRAWER_BODY}
        id={MINIMONGO_QUERY_FORM_ID}
        onSubmit={apply}
      >
        <div className={classnames(Classes.DIALOG_BODY, 'flex flex-col gap-4')}>
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
              onChange={event =>
                minimongoStore.setQueryDraftField(
                  'selector',
                  event.target.value,
                )
              }
              placeholder='{ name: { $ne: null } }'
              rows={6}
              value={minimongoStore.queryDraftInput.selector}
            />
          </FormGroup>
          <FormGroup label='Sort' labelFor='minimongo-query-sort'>
            <InputGroup
              id='minimongo-query-sort'
              onChange={event =>
                minimongoStore.setQueryDraftField('sort', event.target.value)
              }
              value={minimongoStore.queryDraftInput.sort}
            />
          </FormGroup>
          <FormGroup label='Projection' labelFor='minimongo-query-projection'>
            <InputGroup
              id='minimongo-query-projection'
              onChange={event =>
                minimongoStore.setQueryDraftField(
                  'projection',
                  event.target.value,
                )
              }
              value={minimongoStore.queryDraftInput.projection}
            />
          </FormGroup>
          <FormGroup label='Limit' labelFor='minimongo-query-limit'>
            <InputGroup
              id='minimongo-query-limit'
              inputMode='numeric'
              onChange={event =>
                minimongoStore.setQueryDraftField('limit', event.target.value)
              }
              value={minimongoStore.queryDraftInput.limit}
            />
          </FormGroup>
        </div>
      </form>
      <div className={Classes.DRAWER_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button onClick={close}>Cancel</Button>
          <Button form={MINIMONGO_QUERY_FORM_ID} intent='primary' type='submit'>
            Apply query
          </Button>
        </div>
      </div>
    </Drawer>
  )
})
