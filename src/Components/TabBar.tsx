import React, {
  FunctionComponent,
  ReactElement,
  ReactNode,
  useState,
} from 'react'
import styled from 'styled-components'
import { IconName, Menu, MenuItem, PopoverNext } from '@blueprintjs/core'
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

  button.mde-tab {
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

      .bp6-icon {
        margin-bottom: 2px;
      }
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
  tabs: ITab[]
  menu?: IMenuItem[]
  onChange?: (key: string) => void
}

export const TabBar: FunctionComponent<Props> = ({ tabs, menu, onChange }) => {
  const [activeKey, setKey] = useState(tabs[0].key)

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
      <Button icon='menu' style={{ height: 28 }} />
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
    <TabBarWrapper>
      {tabs.map(tab => (
        <Button
          key={tab.key}
          onClick={() => {
            setKey(tab.key)
            if (onChange) onChange(tab.key)
            if (tab.handler) tab.handler()
          }}
          className={classnames('mde-tab', {
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
