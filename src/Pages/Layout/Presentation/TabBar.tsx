import React, { FunctionComponent, useState } from 'react';
import styled from 'styled-components';
import { Icon, IconName } from '@blueprintjs/core';
import classnames from 'classnames';
import { centerItems } from '@/Styles/Mixins';

const TabBarWrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: 28px;
  width: 100%;

  background-color: #202b33;

  button.tab {
    ${centerItems};

    background: transparent;
    border: none;
    color: #eee;
    font-size: 12px;
    cursor: pointer;

    .icon {
      margin-right: 4px;
    }

    &.active {
      background-color: #394b59;
    }
  }

  .right-menu {
    display: flex;
    flex-direction: row;
    margin-left: auto;

    button.menu-item {
      ${centerItems};

      cursor: pointer;
      background: transparent;
      border: none;
      color: #eee;

      .icon {
        margin-right: 4px;
      }

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
        <button
          key={tab.key}
          onClick={() => {
            setKey(tab.key);
            onChange && onChange(tab.key);
            tab.handler && tab.handler();
          }}
          className={classnames('tab', {
            active: activeKey === tab.key,
          })}
        >
          <Icon icon={tab.icon} className='icon' iconSize={12} />
          {tab.content}
        </button>
      ))}

      <div className='right-menu'>
        {menu &&
          menu.map(item => (
            <button key={item.key} className='menu-item' onClick={item.handler}>
              <Icon icon={item.icon} className='icon' iconSize={12} />
              {item.content}
            </button>
          ))}
      </div>
    </TabBarWrapper>
  );
};
