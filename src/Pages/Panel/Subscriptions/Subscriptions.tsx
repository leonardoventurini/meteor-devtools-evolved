import styles from './Subscriptions.module.css'
import { PanelPage } from '@/Constants'
import { parseParameters } from '@/Playground/Values'
import { usePanelStore } from '@/Stores/PanelStore'
import { Hideable } from '@/Utils/Hideable'
import { observer } from 'mobx-react-lite'
import React, { FormEvent, FunctionComponent } from 'react'
import { HTMLTable, Tag } from '@blueprintjs/core'
import { sortBy } from 'lodash'
import { useInterval } from '@/Utils/Hooks/useInterval'
import { syncSubscriptions } from '@/Bridge'
import { StatusBar } from '@/Components/StatusBar'
import { Field } from '@/Components/Field'
import { TextInput } from '@/Components/TextInput'
import { SUBSCRIPTION_COLUMNS } from './SubscriptionLayout'

export { SUBSCRIPTION_COLUMNS } from './SubscriptionLayout'

interface Props {
  isVisible: boolean
}

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
        <div className={`mde-content ${styles.root}`}>
          <HTMLTable compact interactive>
            <colgroup>
              {SUBSCRIPTION_COLUMNS.map(column => (
                <col key={column.key} style={{ width: column.width }} />
              ))}
            </colgroup>
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
                      <Tag minimal title={subscription.name}>
                        {subscription.name}
                      </Tag>
                      <button
                        type='button'
                        aria-label={`Probe ${subscription.name}`}
                        onClick={event => {
                          event.stopPropagation()
                          panelStore.setSelectedTabId(PanelPage.PLAYGROUND)
                          void panelStore.playgroundStore.attempt(() => {
                            if (!subscription.playgroundParameters)
                              throw new Error(
                                subscription.playgroundParametersError ??
                                  'Encoded EJSON parameters are unavailable for this subscription. Refresh subscriptions or compose the request explicitly.',
                              )
                            panelStore.playgroundStore.openDraft(
                              {
                                kind: 'subscription',
                                name: subscription.name,
                                parameters: parseParameters(
                                  JSON.stringify(
                                    subscription.playgroundParameters,
                                  ),
                                ),
                              },
                              panelStore.activeConnectionId,
                              panelStore.playgroundStore.pageEpoch,
                            )
                            panelStore.setSelectedTabId(PanelPage.PLAYGROUND)
                          })
                        }}
                      >
                        Probe
                      </button>
                    </td>
                    <td>
                      <Tag minimal title={JSON.stringify(subscription.params)}>
                        {JSON.stringify(subscription.params)}
                      </Tag>
                    </td>
                    <td>
                      <Tag
                        minimal
                        intent={subscription.inactive ? 'warning' : 'success'}
                      >
                        {JSON.stringify(!subscription.inactive)}
                      </Tag>
                    </td>
                    <td>
                      <Tag
                        minimal
                        intent={subscription.ready ? 'success' : 'warning'}
                      >
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
        </div>

        <StatusBar>
          <TextInput
            icon='search'
            placeholder='Search...'
            onChange={(event: FormEvent<HTMLInputElement>) =>
              panelStore.subscriptionStore.pagination.setSearch(
                event.currentTarget.value,
              )
            }
          />

          <div className='right-group'>
            <Field icon='feed-subscribed'>{subscriptions.length}</Field>
          </div>
        </StatusBar>
      </Hideable>
    )
  },
)
