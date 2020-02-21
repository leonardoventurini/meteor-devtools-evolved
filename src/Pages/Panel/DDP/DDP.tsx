import React, { FunctionComponent, useState } from 'react';
import { DDPLog } from './DDPLog';
import { Classes, Icon } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import { DDPStatus } from './DDPStatus';
import { calculatePagination } from '../../../Utils/Pagination';

const VIEWABLE_HISTORY = 48;

const Empty: FunctionComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <span className={Classes.TEXT_MUTED}>
      No logs yet... <Icon icon='comment' />
    </span>
  </div>
);

interface Props {
  isVisible: boolean;
}

export const DDP: FunctionComponent<Props> = observer(({ isVisible }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const store = usePanelStore();

  const filterRegExp = new RegExp(
    `"msg":"(${store.activeFilterBlacklist.join('|')})"`,
  );

  const collection = store.ddp.filter(log => !filterRegExp.test(log.content));

  const pagination = calculatePagination(
    VIEWABLE_HISTORY,
    collection.length,
    currentPage,
    setCurrentPage,
  );

  const logs = collection
    .slice(pagination.start, pagination.end)
    .map(log => (
      <DDPLog
        key={log.id}
        store={store}
        log={log}
        isNew={store.newDdpLogs.includes(log.id)}
        isStarred={store.bookmarkIds.includes(log.id)}
        {...log}
      />
    ));

  return (
    <Hideable isVisible={isVisible}>
      <div className='mde-ddp'>{logs?.length ? logs : <Empty />}</div>

      <DDPStatus store={store} pagination={pagination} />
    </Hideable>
  );
});
