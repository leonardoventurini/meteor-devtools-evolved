import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
import { FixedSizeList } from 'react-window';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '@/Stores/PanelStore';
import { MinimongoRow } from '@/Pages/Panel/Minimongo/MinimongoRow';
import { useResize } from '@/Utils/ResizeHook';

interface Props {
  isVisible: boolean;
}

export const MinimongoContainer: FunctionComponent<Props> = observer(
  ({ isVisible }) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const store = usePanelStore();

    const {
      activeCollectionDocuments,
      activeCollection,
    } = store.minimongoStore;

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

    useResize(() => {
      setDimensions({
        width: contentRef?.current?.clientWidth ?? 300,
        height: contentRef?.current?.clientHeight ?? 300,
      });
    });

    const Row: FunctionComponent<any> = observer(({ data, index, style }) => {
      const { collectionName, color, document } = data.items[index];

      return (
        <MinimongoRow
          style={style}
          key={document._id}
          document={document}
          panelStore={store}
          collectionName={collectionName}
          color={color}
          isAllVisible={!activeCollection}
        />
      );
    });

    return (
      <div className='minimongo-container' ref={contentRef}>
        <FixedSizeList
          height={dimensions.height}
          width={dimensions.width}
          itemCount={activeCollectionDocuments.filtered.length}
          itemSize={30}
          itemData={{ items: activeCollectionDocuments.filtered }}
        >
          {Row}
        </FixedSizeList>
      </div>
    );
  },
);
