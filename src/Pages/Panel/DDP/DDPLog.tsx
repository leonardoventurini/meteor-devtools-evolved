import React, { FunctionComponent } from 'react';
import { Icon, Tag, Tooltip } from '@blueprintjs/core';
import classnames from 'classnames';
import { usePanelStore } from '../../../Stores/PanelStore';
import { DDPLogDirection } from './DDPLogDirection';
import { DDPLogPreview } from './DDPLogPreview';
import { observer } from 'mobx-react-lite';

interface Props {
  log: DDPLog;
}

export const DDPLog: FunctionComponent<Props> = observer(({ log }) => {
  const store = usePanelStore();

  const { trace, hash } = log;

  const classes = classnames('mde-ddp__log-row', {
    'mde-ddp__log-row--new': store.newDdpLogs.includes(log.id),
  });

  return (
    <div className={classes}>
      <div className='time'>
        <small>{log.timestampPretty}</small>
      </div>
      <div className='direction'>
        <DDPLogDirection log={log} />
      </div>
      <div className='content'>
        <DDPLogPreview log={log} store={store} />
      </div>

      <div className='size'>
        <Tag minimal>{log.sizePretty}</Tag>
      </div>

      <div className='interactions'>
        <Tooltip
          content='View Stack Trace'
          hoverOpenDelay={1000}
          position='top'
        >
          <Icon
            icon='eye-open'
            onClick={() => trace && store.setActiveStackTrace(trace)}
          />
        </Tooltip>
        <Tooltip content='Star & Keep' hoverOpenDelay={1000} position='top'>
          {store.bookmarkIds.includes(log.id) ? (
            <Icon icon='star' onClick={() => store.removeBookmark(log)} />
          ) : (
            <Icon icon='star-empty' onClick={() => store.addBookmark(log)} />
          )}
        </Tooltip>
      </div>

      <div className='hash'>
        <Tooltip content='CRC32'>
          <Tag minimal>{hash}</Tag>
        </Tooltip>
      </div>
    </div>
  );
});
