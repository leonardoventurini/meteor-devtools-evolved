import { ObjectTreerinator } from '@/Utils/ObjectTreerinator'
import { Classes, Drawer } from '@blueprintjs/core'
import React, { FunctionComponent } from 'react'

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
    </Drawer>
  )
}
