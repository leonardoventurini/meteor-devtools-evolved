import React, { FunctionComponent, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '../../../Stores/PanelStore';
import { Hideable } from '../../../Utils/Hideable';
import { calculatePagination } from '../../../Utils/Pagination';
import { DDPLog } from '../DDP/DDPLog';
import { Travolta } from '../../../Utils/Travolta';
import { DDPStatus } from '../DDP/DDPStatus';
import { VIEWABLE_HISTORY } from '../../../Constants';

interface Props {
  isVisible: boolean;
}

export const Starred: FunctionComponent<Props> = observer(({ isVisible }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const store = usePanelStore();

  const filterRegExp = new RegExp(
    `"msg":"(${store.activeFilterBlacklist.join('|')})"`,
  );

  const collection = store.bookmarks
    .filter(bookmark => !filterRegExp.test(bookmark.log.content))
    .filter(
      bookmark => !store.search || bookmark.log.content.includes(store.search),
    );

  const pagination = calculatePagination(
    VIEWABLE_HISTORY,
    collection.length,
    currentPage,
    setCurrentPage,
  );

  const logs = collection
    .slice(pagination.start, pagination.end)
    .map(({ log }) => (
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
      <div className='mde-ddp'>{logs?.length ? logs : <Travolta />}</div>

      <DDPStatus store={store} pagination={pagination} />
    </Hideable>
  );
});
