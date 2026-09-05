import styles from './Performance.module.css'
import React, { PropsWithChildren } from 'react'
import { Hideable } from '@/Utils/Hideable'
import { HTMLTable, Tag } from '@blueprintjs/core'
import { usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'
import { StatusBar } from '@/Components/StatusBar'
import { Button } from '@/Components/Button'

type Props = { isVisible: boolean }

export const Performance = observer(
  ({ isVisible }: PropsWithChildren<Props>) => {
    const panelStore = usePanelStore()
    const { renderData } = panelStore.performanceStore

    return (
      <Hideable isVisible={isVisible}>
        <div className={`mde-content ${styles.root}`}>
          <HTMLTable compact interactive>
            <thead>
              <tr>
                <th>Collection</th>
                <th>Method</th>
                <th>Timing</th>
                <th>Arguments</th>
                <th>Total</th>
                <th>Average</th>
                <th>Calls</th>
              </tr>
            </thead>
            <tbody>
              {renderData.map(data => (
                <tr key={data.key}>
                  <td>
                    <Tag minimal>{data.collectionName}</Tag>
                  </td>
                  <td>
                    <Tag minimal>{data.method}</Tag>
                  </td>
                  <td>
                    <Tag minimal>{data.timing}</Tag>
                  </td>
                  <td>
                    <Tag style={{ maxWidth: '50vw' }} minimal>
                      {data.args}
                    </Tag>
                  </td>
                  <td>
                    <Tag minimal>{Math.round(data.runtime)} ms</Tag>
                  </td>
                  <td>
                    <Tag minimal>{data.averageRuntime.toFixed(3)} ms</Tag>
                  </td>
                  <td>
                    <Tag minimal>{data.calls}x</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </div>

        <StatusBar>
          <div className='right-group'>
            <Button
              intent='warning'
              onClick={() => panelStore.performanceStore.clear()}
              icon='inbox'
            >
              {panelStore.performanceStore.callMap.size ?? 0}
            </Button>
          </div>
        </StatusBar>
      </Hideable>
    )
  },
)
