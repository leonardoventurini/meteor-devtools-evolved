import styles from './TabBar.module.css'
import React, { FunctionComponent, ReactElement, ReactNode } from 'react'
import { IconName, Menu, MenuItem, PopoverNext } from '@blueprintjs/core'
import { Button } from './Button'
import { useBreakpoints } from '@/Utils/Hooks/useBreakpoints'
import classnames from 'classnames'

const METEOR_LOGO_PATH = '/icons/meteor-32.png'

export interface ITab {
  key: string
  content: ReactNode
  icon: IconName
  shine?: boolean
  handler?: () => void
  placement?: 'bottom'
}

export interface IMenuItem {
  key: string
  content?: ReactNode
  icon?: IconName | ReactElement
  shine?: boolean
  handler: () => void

  title?: string
}

interface Props {
  activeKey: string
  beforeMenu?: ReactNode
  tabs: ITab[]
  menu?: IMenuItem[]
  onChange?: (key: string) => void
}

export const TabBar: FunctionComponent<Props> = ({
  activeKey,
  beforeMenu,
  tabs,
  menu,
  onChange,
}) => {
  const { navigationCollapse } = useBreakpoints()

  const rightMenu = navigationCollapse ? (
    <PopoverNext
      content={
        <Menu>
          {menu?.map(item => (
            <MenuItem
              key={item.key}
              icon={item.icon}
              text={item.content}
              onClick={item.handler}
            />
          ))}
        </Menu>
      }
      placement='bottom-start'
    >
      <Button icon='menu' style={{ height: 'var(--mde-toolbar-height)' }} />
    </PopoverNext>
  ) : (
    menu?.map(item => (
      <Button
        key={item.key}
        className='menu-item'
        onClick={item.handler}
        icon={item.icon}
        shine={item.shine}
        title={item.title}
      >
        {item.content}
      </Button>
    ))
  )

  return (
    <>
      <div className={classnames(styles.topToolbar, 'mde-top-toolbar')}>
        <div className={classnames(styles.brand, 'mde-toolbar-brand')}>
          <img alt='Meteor DevTools' draggable={false} src={METEOR_LOGO_PATH} />
        </div>
        <div className={styles.rightMenu}>
          {beforeMenu}
          {rightMenu}
        </div>
      </div>

      <nav
        aria-label='Panel navigation'
        className={classnames(styles.sidebar, 'mde-sidebar')}
      >
        {tabs.map(tab => (
          <Button
            active={activeKey === tab.key}
            key={tab.key}
            onClick={() => {
              if (onChange) onChange(tab.key)
              if (tab.handler) tab.handler()
            }}
            className={classnames('mde-tab', {
              'mde-tab-bottom': tab.placement === 'bottom',
            })}
            icon={tab.icon}
            shine={tab.shine}
          >
            {tab.content}
          </Button>
        ))}
      </nav>
    </>
  )
}
