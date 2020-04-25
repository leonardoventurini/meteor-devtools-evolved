import { Button, Icon, Menu, Popover } from '@blueprintjs/core';
import { PanelPage } from '@/Constants';
import { Bridge } from '@/Bridge';
import React, { FunctionComponent, useState } from 'react';
import { PanelStoreConstructor } from '@/Stores/PanelStore';

interface Props {
  log: DDPLog;
  store: PanelStoreConstructor;
}

export const DDPLogMenu: FunctionComponent<Props> = ({ store, log }) => {
  const [isBookmarked, setBookmarked] = useState(
    store.bookmarkStore.bookmarkIds.includes(log.id),
  );

  const MenuElement = (
    <Menu>
      <Menu.Item
        text='Stacktrace'
        icon='eye-open'
        onClick={() => log.trace && store.setActiveStackTrace(log.trace)}
      />
      <Menu.Item
        text='Bookmark'
        icon={isBookmarked ? 'star' : 'star-empty'}
        onClick={() =>
          store.bookmarkStore.bookmarkIds.includes(log.id)
            ? store.bookmarkStore.remove(log)
            : store.bookmarkStore.add(log)
        }
      />
      {log.parsedContent?.msg === 'method' && (
        <Menu.Item
          text='Replay'
          icon='play'
          onClick={() => {
            store.setSelectedTabId(PanelPage.DDP);

            Bridge.sendContentMessage({
              eventType: 'ddp-run-method',
              data: log.parsedContent,
            });
          }}
        />
      )}
    </Menu>
  );

  return (
    <div className='menu'>
      <Popover content={MenuElement}>
        <Button
          minimal
          onClick={() => {
            setBookmarked(store.bookmarkStore.bookmarkIds.includes(log.id));
          }}
        >
          <Icon icon='menu' />
        </Button>
      </Popover>
    </div>
  );
};
