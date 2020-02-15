import React, { FunctionComponent } from 'react';
import moment from 'moment';
import { Icon, Tag } from '@blueprintjs/core';
import classnames from 'classnames';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';
import { flow } from 'lodash/fp';
import { memoize } from 'lodash';
import { inject, observer } from 'mobx-react';
import { DDPLogDirection } from './DDPLogDirection';
import { DDPLogPreview } from './DDPLogPreview';

interface Props {
  store: PanelStoreConstructor;
  log: DDPLog;
}

export const DDPLog: FunctionComponent<Props> = flow(
  observer,
  inject('panelStore'),
)(({ store, log }) => {
  const { content, timestamp, hash } = log;

  const time = (timestamp?: number) =>
    timestamp ? moment(timestamp).format('HH:mm:ss.SSS') : 'Unknown';

  const classes = classnames('mde-ddp__log-row', {
    'mde-ddp__log-row--new': timestamp && store.newDdpLogs.includes(timestamp),
  });

  const size = memoize((content: string) => new Blob([content]).size);

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
        <Icon icon='eye-open' />
        <Icon icon='star-empty' />
      </div>
      <div className='size'>
        <Tag minimal>{size(content)} B</Tag>
      </div>
      <div className='hash'>
        <Tag minimal>{hash?.slice(0, 6)}</Tag>
      </div>
    </div>
  );
});
