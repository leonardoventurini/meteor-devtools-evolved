import React, { FunctionComponent, useRef } from 'react';
import { DDPLog } from '@/Pages/Panel/DDP/DDPLog';
import { FixedSizeList } from 'react-window';
import { observer } from 'mobx-react-lite';
import { DDPStore } from '@/Stores/Panel/DDPStore';
import { BookmarkStore } from '@/Stores/Panel/BookmarkStore';
import { useDimensions } from '@/Utils/Hooks/useDimensions';
import { usePanelStore } from '@/Stores/PanelStore';

interface Props {
  source: DDPStore | BookmarkStore;
  isVisible: boolean;
}

export const DDPContainer: FunctionComponent<Props> = observer(
  ({ source, isVisible }) => {
    const store = usePanelStore();
    const contentRef = useRef<HTMLDivElement>(null);

    const { width, height } = useDimensions(contentRef, [isVisible]);

    const Row: FunctionComponent<any> = observer(({ data, index, style }) => {
      const item = (data as any).items[index];
      const log = 'log' in item ? item.log : item;

      return (
        <DDPLog
          key={log.id}
          style={style}
          log={log}
          isNew={'newLogs' in source && source.newLogs.includes(log.id)}
          isStarred={store.bookmarkStore.bookmarkIds.includes(log.id)}
        />
      );
    });

    const list = (
      <FixedSizeList
        height={height}
        width={width}
        itemCount={source.filtered.length}
        itemSize={28}
        itemData={{ items: source.filtered }}
      >
        {Row}
      </FixedSizeList>
    );

    return (
      <div className='mde-content mde-ddp' ref={contentRef}>
        {source.filtered.length ? list : null}
      </div>
    );
  },
);
