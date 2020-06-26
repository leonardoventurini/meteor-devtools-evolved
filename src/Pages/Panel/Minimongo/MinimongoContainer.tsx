import React, { CSSProperties, FunctionComponent, useRef } from 'react';
import { areEqual, FixedSizeList } from 'react-window';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '@/Stores/PanelStore';
import { MinimongoRow } from '@/Pages/Panel/Minimongo/MinimongoRow';
import { useDimensions } from '@/Utils/Hooks/useDimensions';

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

    const { width, height } = useDimensions(contentRef, [isVisible]);

    interface IRow {
      data: { items: IDocumentWrapper[] };
      index: number;
      style: CSSProperties;
    }

    const Row: FunctionComponent<any> = React.memo(
      ({ data, index, style }: IRow) => {
        const item = data.items![index];

        return (
          <MinimongoRow
            style={style}
            key={item.document._id}
            item={item}
            onClick={() => store.setActiveObject(document)}
            onCollectionClick={() =>
              store.minimongoStore.setActiveCollection(item.collectionName)
            }
            isAllVisible={!activeCollection}
          />
        );
      },
      areEqual,
    );

    return (
      <div className='container' ref={contentRef}>
        <FixedSizeList
          height={height}
          width={width}
          itemCount={activeCollectionDocuments.filtered.length}
          itemSize={28}
          itemData={{ items: activeCollectionDocuments.filtered }}
        >
          {Row}
        </FixedSizeList>
      </div>
    );
  },
);
