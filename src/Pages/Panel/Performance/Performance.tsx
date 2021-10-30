import React, { PropsWithChildren } from 'react'
import { Hideable } from '@/Utils/Hideable'
import { HTMLTable, Tag } from '@blueprintjs/core'
import { usePanelStore } from '@/Stores/PanelStore'
import { observer } from 'mobx-react-lite'
import styled from 'styled-components'

type Props = { isVisible: boolean }

const Wrapper = styled.div`
  overflow-y: auto !important;

  table,
  tbody {
    width: 100%;
    max-width: 100%;
  }
`

export const Performance = observer(
  ({ isVisible }: PropsWithChildren<Props>) => {
    const panelStore = usePanelStore()
    const { renderData } = panelStore.performanceStore

    return (
      <Hideable isVisible={isVisible}>
        <Wrapper className='mde-content'>
          <HTMLTable condensed interactive>
            <thead>
              <tr>
                <th>Collection</th>
                <th>Method</th>
                <th>Arguments</th>
                <th>Total Time</th>
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
                    <Tag style={{ maxWidth: '50vw' }} minimal>
                      {data.args}
                    </Tag>
                  </td>
                  <td>
                    <Tag minimal>{data.runtime.toFixed(3)}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </HTMLTable>
        </Wrapper>
      </Hideable>
    )
  },
)
