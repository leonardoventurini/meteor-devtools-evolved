import React, { FunctionComponent, useRef } from 'react';
import { DDPLog } from '@/Pages/Panel/DDP/DDPLog';
import { areEqual, FixedSizeList } from 'react-window';
import { observer } from 'mobx-react-lite';
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

    const { width, height } = useDimensions(contentRef, [isVisible]);

    const Row: FunctionComponent<any> = React.memo(({ data, index, style }) => {
      const item = (data as any).items[index];
      const log = 'log' in item ? item.log : item;

      return <DDPLog key={log.id} style={style} log={log} {...log} />;
    }, areEqual);

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
