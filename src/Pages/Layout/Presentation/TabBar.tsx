import React, { FunctionComponent, useState } from 'react';
import styled from 'styled-components';
import { IconName } from '@blueprintjs/core';
import classnames from 'classnames';
import { Button } from './Button';

const TabBarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 28px;
  width: 100%;

  background-color: #202b33;

  button.tab {
    &.active {
      background-color: #394b59;
    }
  }

  .right-menu {
    display: flex;
    flex-direction: row;
    margin-left: auto;

    button.menu-item {
      &:hover {
        background-color: #394b59;
      }
    }
  }
`;

export interface ITab {
  key: string;
  content: JSX.Element | string;
  icon: IconName;
  handler?: () => void;
}

export interface IMenuItem {
  key: string;
  content: JSX.Element | string;
  icon: IconName;
  handler: () => void;
}

interface Props {
  tabs: ITab[];
  menu?: IMenuItem[];
  onChange?: (key: string) => void;
}

export const TabBar: FunctionComponent<Props> = ({ tabs, menu, onChange }) => {
  const [activeKey, setKey] = useState(tabs[0].key);

  return (
    <TabBarWrapper>
      {tabs.map(tab => (
        <Button
          key={tab.key}
          onClick={() => {
            setKey(tab.key);
            onChange && onChange(tab.key);
            tab.handler && tab.handler();
          }}
          className={classnames('tab', {
            active: activeKey === tab.key,
          })}
          icon={tab.icon}
        >
          {tab.content}
        </Button>
      ))}

      <div className='right-menu'>
        {menu &&
          menu.map(item => (
            <Button
              key={item.key}
              className='menu-item'
              onClick={item.handler}
              icon={item.icon}
            >
              {item.content}
            </Button>
          ))}
      </div>
    </TabBarWrapper>
  );
};
