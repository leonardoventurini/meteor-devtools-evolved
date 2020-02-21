import React, { FunctionComponent, useState } from 'react';
import { DDPLog } from './DDPLog';
import { Classes, Icon } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import { DDPStatus } from './DDPStatus';

const VIEWABLE_HISTORY = 100;

const Empty: FunctionComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <span className={Classes.TEXT_MUTED}>
      No logs yet... <Icon icon='comment' />
    </span>
  </div>
);

const calculatePagination = (
  collectionLength: number,
  currentPage: number,
  setCurrentPage: (page: number) => void,
): Pagination => {
  const lastIndex = collectionLength - 1;
  const start = lastIndex - currentPage * VIEWABLE_HISTORY;
  const end = start + VIEWABLE_HISTORY + 1;
  const pages = Math.ceil(collectionLength / VIEWABLE_HISTORY);

  const hasOnePage = pages === 1;
  const hasNextPage = currentPage < pages;
  const hasPreviousPage = currentPage > 1;

  return {
    lastIndex,
    start: start >= 0 ? start : 0,
    end: end <= collectionLength ? end : collectionLength,
    pages,
    hasOnePage,
    hasNextPage,
    hasPreviousPage,
    currentPage,
    setCurrentPage,
    next() {
      if (hasNextPage) {
        setCurrentPage(currentPage + 1);
      }
    },
    prev() {
      if (hasPreviousPage) {
        setCurrentPage(currentPage - 1);
      }
    },
  };
};

interface Props {
  isVisible: boolean;
}

export const DDP: FunctionComponent<Props> = observer(({ isVisible }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const store = usePanelStore();

  const pagination = calculatePagination(
    store.ddp.length,
    currentPage,
    setCurrentPage,
  );

  const logs = store?.ddp
    .filter(log => {
      const msg = log?.content?.match(/"msg":"(\w+)"/);

      return !msg || !store.activeFilterBlacklist.includes(msg[1]);
    })
    .slice(pagination.start, pagination.end)
    .map(log => (
      <DDPLog
        key={log.id}
        store={store}
        log={log}
        isNew={store.newDdpLogs.includes(log.id)}
        isStarred={store.bookmarkIds.includes(log.id)}
      />
    ));

  return (
    <Hideable isVisible={isVisible}>
      <div className='mde-ddp'>{logs?.length ? logs : <Empty />}</div>

      <DDPStatus store={store} pagination={pagination} />
    </Hideable>
  );
});
