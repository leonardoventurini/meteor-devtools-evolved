import { ObjectTreerinator } from '@/Utils/ObjectTreerinator'
import { Button, Classes, Drawer } from '@blueprintjs/core'
import React, { FunctionComponent } from 'react'
import { StringUtils } from '@/Utils/StringUtils'
import { Popover2 } from '@blueprintjs/popover2'

interface Props {
  title: string | null
  viewableObject: ViewableObject
  onClose(): void
}

export const DrawerJSON: FunctionComponent<Props> = ({
  title,
  viewableObject,
  onClose,
}) => {
  return (
    <Drawer
      icon='document'
      title={title ?? 'JSON'}
      isOpen={!!viewableObject}
      onClose={onClose}
      size='72%'
    >
      <div className={Classes.DRAWER_BODY}>
        <div className={Classes.DIALOG_BODY}>
          {!!viewableObject && <ObjectTreerinator object={viewableObject} />}
        </div>
      </div>
      <div className={Classes.DRAWER_FOOTER}>
        <Popover2
          position='top'
          content={<div style={{ padding: '0.5rem' }}>Copied</div>}
        >
          <Button
            onClick={() =>
              StringUtils.toClipboard(JSON.stringify(viewableObject, null, 2))
            }
            icon='clipboard'
            minimal
          >
            Copy
          </Button>
        </Popover2>
      </div>
    </Drawer>
  )
}
