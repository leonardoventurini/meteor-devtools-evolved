import React, { FunctionComponent, ReactElement, ReactNode } from 'react'
import styled from 'styled-components'
import { IconName, Menu, MenuItem, PopoverNext } from '@blueprintjs/core'
import { Button } from './Button'
import { lighten } from 'polished'
import { NAVBAR_HEIGHT } from '@/Styles/Constants'
import { useBreakpoints } from '@/Utils/Hooks/useBreakpoints'

const backgroundColor = '#202b33'

const TopToolbar = styled.div`
  user-select: none;
  display: flex;
  box-sizing: border-box;
  height: ${NAVBAR_HEIGHT}px;
  width: 100%;
  border-bottom: 1px solid ${lighten(0.1, backgroundColor)};
  background-color: ${backgroundColor};

  .right-menu {
    display: flex;
    flex-direction: row;
    margin-left: auto;
    gap: 0.5rem;
    min-width: 0;

    .mde-connection-selector {
      min-width: 9rem;
      max-width: 16rem;
      text-overflow: ellipsis;
      margin: 3px 0;
      padding: 0 28px 0 10px;
      border: 0;
      border-radius: 3px;
      color: inherit;
      background: ${lighten(0.05, backgroundColor)};
    }

    button.menu-item {
      &:hover {
        background-color: ${lighten(0.05, backgroundColor)};
      }

      .bp6-icon {
        margin-bottom: 2px;
      }
    }
  }
`

const Sidebar = styled.nav`
  user-select: none;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  border-right: 1px solid ${lighten(0.1, backgroundColor)};
  background-color: ${backgroundColor};
  padding: 8px 0;

  button.mde-tab {
    flex: 0 0 40px;
    width: 100%;
    height: 40px;
    padding: 0 12px;

    &.active {
      background-color: ${lighten(0.1, backgroundColor)};
    }

    &:hover:not(.active) {
      background-color: ${lighten(0.05, backgroundColor)};
    }
  }
`

export interface ITab {
  key: string
  content: ReactNode
  icon: IconName
  shine?: boolean
  handler?: () => void
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
      <Button icon='menu' style={{ height: NAVBAR_HEIGHT }} />
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
      <TopToolbar className='mde-top-toolbar'>
        <div className='right-menu'>
          {beforeMenu}
          {rightMenu}
        </div>
      </TopToolbar>

      <Sidebar aria-label='Panel navigation' className='mde-sidebar'>
        {tabs.map(tab => (
          <Button
            active={activeKey === tab.key}
            key={tab.key}
            onClick={() => {
              if (onChange) onChange(tab.key)
              if (tab.handler) tab.handler()
            }}
            className='mde-tab'
            icon={tab.icon}
            shine={tab.shine}
          >
            {tab.content}
          </Button>
        ))}
      </Sidebar>
    </>
  )
}
