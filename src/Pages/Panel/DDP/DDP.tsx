import React, { FunctionComponent } from 'react';
import { DDPLog } from './DDPLog';
import { Button, Classes, Icon, Popover, Tag } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { Hideable } from '../../../Utils/Hideable';
import { usePanelStore } from '../../../Stores/PanelStore';
import prettyBytes from 'pretty-bytes';
import { DDPFilterMenu } from './DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';

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
  const store = usePanelStore();

  const logs = store?.ddp
    .filter(log => {
      const msg = log?.content?.match(/"msg":"(\w+)"/);

      return !msg || !store.activeFilterBlacklist.includes(msg[1]);
    })
    .slice(-100)
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

      <DDPStatus store={store} />
    </Hideable>
  );
});
