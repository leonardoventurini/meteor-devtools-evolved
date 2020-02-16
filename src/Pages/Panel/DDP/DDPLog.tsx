import React, { FunctionComponent } from 'react';
import moment from 'moment';
import { Icon, Tag } from '@blueprintjs/core';
import classnames from 'classnames';
import { usePanelStore } from '../../../Stores/PanelStore';
import { memoize } from 'lodash';
import { DDPLogDirection } from './DDPLogDirection';
import { DDPLogPreview } from './DDPLogPreview';
import { observer } from 'mobx-react-lite';
import prettyBytes from 'pretty-bytes';

interface Props {
  log: DDPLog;
}

export const DDPLog: FunctionComponent<Props> = observer(({ log }) => {
  const store = usePanelStore();

  const { content, timestamp, trace, hash } = log;

  const time = (timestamp?: number) =>
    timestamp ? moment(timestamp).format('HH:mm:ss.SSS') : 'Unknown';

  const classes = classnames('mde-ddp__log-row', {
    'mde-ddp__log-row--new': timestamp && store.newDdpLogs.includes(timestamp),
  });

  const size = memoize((content: string) =>
    prettyBytes(new Blob([content]).size),
  );

  return (
    <div className={classes}>
      <div className='time'>
        <small>{time(timestamp)}</small>
      </div>
      <div className='direction'>
        <DDPLogDirection log={log} />
      </div>
      <div className='content'>
        <DDPLogPreview log={log} store={store} />
      </div>
      <div className='interactions'>
        <Icon
          icon='eye-open'
          onClick={() => trace && store.setActiveStackTrace(trace)}
        />
        {timestamp && store.bookmarkIds.includes(timestamp) ? (
          <Icon icon='star' onClick={() => store.removeBookmark(log)} />
        ) : (
          <Icon icon='star-empty' onClick={() => store.addBookmark(log)} />
        )}
      </div>
      <div className='size'>
        <Tag minimal>{size(content)}</Tag>
      </div>
      <div className='hash'>
        <Tag minimal>{hash?.slice(0, 6)}</Tag>
      </div>
    </div>
  );
});
