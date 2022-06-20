import { usePanelStore } from '@/Stores/PanelStore'
import { Hideable } from '@/Utils/Hideable'
import { observer } from 'mobx-react-lite'
import React, { FormEvent, FunctionComponent } from 'react'
import { HTMLTable, Tag } from '@blueprintjs/core'
import styled from 'styled-components'
import { sortBy } from 'lodash'
import { useInterval } from '@/Utils/Hooks/useInterval'
import { syncSubscriptions } from '@/Bridge'
import { StatusBar } from '@/Components/StatusBar'
import { Field } from '@/Components/Field'
import { TextInput } from '@/Components/TextInput'

interface Props {
 isVisible: boolean
}

const Wrapper = styled.div`
 overflow-y: auto !important;

 table,
 tbody {
  width: 100%;
  max-width: 100%;
 }

 tbody {
  font-family: monospace;
 }

 table,
 tbody,
 tr,
 td,
 td span {
  font-size: 11px !important;
 }
`

export const Subscriptions: FunctionComponent<Props> = observer(
 ({ isVisible }) => {
  useInterval(() => isVisible && syncSubscriptions(), 5000)

  const panelStore = usePanelStore()

  const subscriptions = sortBy(
   panelStore.subscriptionStore.subsWithMeta,
   'meta.init.timestamp',
  )

  return (
   <Hideable isVisible={isVisible}>
    <Wrapper className="mde-content">
     <HTMLTable condensed interactive>
      <thead>
       <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Params</th>
        <th>Active</th>
        <th>Ready</th>
        <th>Duration</th>
       </tr>
      </thead>
      <tbody>
       {subscriptions.map(subscription => {
        const duration =
         panelStore.ddpStore.getSubscriptionDuration(subscription)

        return (
         <tr
          key={subscription.id}
          onClick={() =>
           panelStore.setActiveObject(
            {
             params: subscription.params,
            },
            `${subscription.name} [${subscription.id}]`,
           )
          }
         >
          <td>
           <Tag minimal>{subscription.id}</Tag>
          </td>
          <td>
           <Tag style={{ maxWidth: '25vw' }} minimal>
            {subscription.name}
           </Tag>
          </td>
          <td>
           <Tag style={{ maxWidth: '25vw' }} minimal>
            {JSON.stringify(subscription.params)}
           </Tag>
          </td>
          <td>
           <Tag minimal intent={subscription.inactive ? 'warning' : 'success'}>
            {JSON.stringify(!subscription.inactive)}
           </Tag>
          </td>
          <td>
           <Tag minimal intent={subscription.ready ? 'success' : 'warning'}>
            {JSON.stringify(subscription.ready)}
           </Tag>
          </td>
          <td>
           <Tag minimal>{duration}</Tag>
          </td>
         </tr>
        )
       })}
      </tbody>
     </HTMLTable>
    </Wrapper>

    <StatusBar>
     <TextInput
      icon="search"
      placeholder="Search..."
      onChange={(event: FormEvent<HTMLInputElement>) =>
       panelStore.subscriptionStore.pagination.setSearch(
        event.currentTarget.value,
       )
      }
     />

     <div className="right-group">
      <Field icon="feed-subscribed">{subscriptions.length}</Field>
     </div>
    </StatusBar>
   </Hideable>
  )
 },
)
