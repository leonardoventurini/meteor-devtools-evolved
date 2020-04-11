import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { DDPLog } from '@/Pages/Panel/DDP/DDPLog';
import { FixedSizeList } from 'react-window';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '@/Stores/PanelStore';
import { DDPStore } from '@/Stores/Panel/DDPStore';
import { BookmarkStore } from '@/Stores/Panel/BookmarkStore';

interface Props {
  source: DDPStore | BookmarkStore;
  isVisible: boolean;
}

export const DDPContainer: FunctionComponent<Props> = observer(
  ({ source, isVisible }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const store = usePanelStore();

    const [dimensions, setDimensions] = useState({
      height: 300,
      width: 300,
    });

    useEffect(() => {
      setDimensions({
        width: contentRef?.current?.clientWidth ?? 300,
        height: contentRef?.current?.clientHeight ?? 300,
      });
    }, [isVisible]);

    const Row: FunctionComponent<any> = observer(
      ({ key, data, index, style }) => {
        const item = data.items[index];
        const log = 'log' in item ? item.log : item;

        return (
          <DDPLog
            key={key}
            style={style}
            log={log}
            isNew={'newLogs' in source && source.newLogs.includes(log.id)}
            isStarred={store.bookmarkStore.bookmarkIds.includes(log.id)}
            {...log}
          />
        );
      },
    );

    return (
      <div className='mde-content mde-ddp' ref={contentRef}>
        <FixedSizeList
          height={dimensions.height}
          width={dimensions.width}
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
