import { Classes, Drawer } from '@blueprintjs/core'
import { Tooltip2 } from '@blueprintjs/popover2'
import classnames from 'classnames'
import React, { FunctionComponent } from 'react'

interface Props {
  activeStackTrace: StackTrace[] | null

  onClose(): void
}

export const DrawerStackTrace: FunctionComponent<Props> = ({
  activeStackTrace,
  onClose,
}) => (
  <Drawer
    icon='document'
    title='Stack Trace'
    isOpen={!!activeStackTrace}
    onClose={onClose}
    size='72%'
  >
    <div className={Classes.DRAWER_BODY}>
      <div className={classnames(Classes.DIALOG_BODY, 'mde-stack-trace')}>
        {activeStackTrace?.map((stack: StackTrace, index: number) => {
          const text = (
            <div>
              <em>{stack?.callee?.trim() || 'Anonymous'}</em>
            </div>
          )

          return (
            <pre key={index}>
              {stack?.url ? (
                <Tooltip2 content={stack.url.trim()}>
                  <a
                    href={stack.url.trim()}
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    {text}
                  </a>
                </Tooltip2>
              ) : (
                text
              )}
            </pre>
          )
        })}
      </div>
    </div>
  </Drawer>
)
