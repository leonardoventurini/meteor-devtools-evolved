import React, { FunctionComponent, useRef } from 'react';
import { DDPLog } from '@/Pages/Panel/DDP/DDPLog';
import { FixedSizeList } from 'react-window';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '@/Stores/PanelStore';
import { DDPStore } from '@/Stores/Panel/DDPStore';
import { BookmarkStore } from '@/Stores/Panel/BookmarkStore';
import { useDimensions } from '@/Utils/Hooks/Dimensions';

interface Props {
  source: DDPStore | BookmarkStore;
  isVisible: boolean;
}

export const DDPContainer: FunctionComponent<Props> = observer(
  ({ source, isVisible }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const store = usePanelStore();

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
          {...log}
        />
      );
    });

    return (
      <div className='mde-content mde-ddp' ref={contentRef}>
        <FixedSizeList
          height={height}
          width={width}
          itemCount={source.filtered.length}
          itemSize={30}
          itemData={{ items: source.filtered }}
        >
          {Row}
        </FixedSizeList>
      </div>
    );
  },
);
