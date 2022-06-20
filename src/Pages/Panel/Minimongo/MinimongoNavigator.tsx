import {
 Button,
 Classes,
 Dialog,
 InputGroup,
 Menu,
 MenuItem,
 NonIdealState,
} from '@blueprintjs/core'
import React, { FormEvent, FunctionComponent } from 'react'
import { usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'

export const MinimongoNavigator: FunctionComponent = observer(() => {
 const { minimongoStore } = usePanelStore()

 const setActiveCollection = (collectionName: string | null) => {
  minimongoStore.setActiveCollection(collectionName)
  minimongoStore.setNavigatorVisible(false)
 }

 return (
  <Dialog
   icon="database"
   onClose={() => {
    minimongoStore.setNavigatorVisible(false)
    minimongoStore.setSearch('')
   }}
   title="Collections"
   isOpen={minimongoStore.isNavigatorVisible}
  >
   <div
    className={Classes.DIALOG_BODY}
    style={{ height: '50vh', overflowY: 'scroll' }}
   >
    <Menu>
     {minimongoStore.filteredCollectionNames.length ? (
      minimongoStore.filteredCollectionNames.map(key => (
       <MenuItem
        key={key}
        icon="database"
        text={key.concat(` (${minimongoStore.collections[key]?.length ?? 0})`)}
        active={minimongoStore.activeCollection === key}
        onClick={() => setActiveCollection(key)}
       />
      ))
     ) : (
      <div style={{ marginTop: 50, marginBottom: 50 }}>
       <NonIdealState icon="search" title="No Results" />
      </div>
     )}
    </Menu>
   </div>
   <div className={Classes.DIALOG_FOOTER}>
    <div style={{ display: 'flex' }}>
     <div style={{ flexGrow: 1, marginRight: 8 }}>
      <InputGroup
       leftIcon="search"
       placeholder="Search..."
       className={Classes.FILL}
       onChange={(event: FormEvent<HTMLInputElement>) =>
        minimongoStore.setSearch(event.currentTarget.value)
       }
      />
     </div>

     <Button
      icon="asterisk"
      onClick={() => setActiveCollection(null)}
      active={minimongoStore.activeCollection === null}
     >
      Everything
     </Button>
    </div>
   </div>
  </Dialog>
 )
})
