import React, { FunctionComponent, useState } from 'react'
import styled from 'styled-components'
import { IconName, Menu, MenuItem, Popover, Position } from '@blueprintjs/core'
import classnames from 'classnames'
import { Button } from './Button'
import { lighten } from 'polished'
import { NAVBAR_HEIGHT } from '@/Styles/Constants'
import { useBreakpoints } from '@/Utils/Hooks/useBreakpoints'

const backgroundColor = '#202b33'

const TabBarWrapper = styled.div`
  user-select: none;
  display: flex;
  box-sizing: border-box;
  flex-direction: row;
  height: ${NAVBAR_HEIGHT}px;
  width: 100%;
  border-bottom: 1px solid ${lighten(0.1, backgroundColor)};

  background-color: ${backgroundColor};

  button.tab {
    &.active {
      background-color: ${lighten(0.1, backgroundColor)};
    }

    &:hover:not(.active) {
      background-color: ${lighten(0.05, backgroundColor)};
    }
  }

  .right-menu {
    display: flex;
    flex-direction: row;
    margin-left: auto;

    button.menu-item {
      &:hover {
        background-color: ${lighten(0.05, backgroundColor)};
      }
    }
  }
`

export interface ITab {
  key: string
  content: JSX.Element | string
  icon: IconName
  shine?: boolean
  handler?: () => void
}

export interface IMenuItem {
  key: string
  content?: JSX.Element | string
  icon: IconName | JSX.Element
  shine?: boolean
  handler: () => void
}

interface Props {
  tabs: ITab[]
  menu?: IMenuItem[]
  onChange?: (key: string) => void
}

export const TabBar: FunctionComponent<Props> = ({ tabs, menu, onChange }) => {
  const [activeKey, setKey] = useState(tabs[0].key)

  const { sm } = useBreakpoints()

  const rightMenu = sm ? (
    <Popover
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
      position={Position.BOTTOM_LEFT}
    >
      <Button icon='menu' style={{ height: 28 }} />
    </Popover>
  ) : (
    menu?.map(item => (
      <Button
        key={item.key}
        className='menu-item'
        onClick={item.handler}
        icon={item.icon}
        shine={item.shine}
      >
        {item.content}
      </Button>
    ))
  )

  return (
    <TabBarWrapper>
      {tabs.map(tab => (
        <Button
          key={tab.key}
          onClick={() => {
            setKey(tab.key)
            onChange && onChange(tab.key)
            tab.handler && tab.handler()
          }}
          className={classnames('tab', {
            active: activeKey === tab.key,
          })}
          icon={tab.icon}
          shine={tab.shine}
        >
          {tab.content}
        </Button>
      ))}

      <div className='right-menu'>{rightMenu}</div>
    </TabBarWrapper>
  )
}
