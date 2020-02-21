import React, { CSSProperties, FunctionComponent } from 'react';
import { DDPLog } from './DDPLog';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';

interface Props {
  index: number;
  style: CSSProperties;
  data: {
    items: DDPLog[];
  };
}

export const DDPRow = (
  store: PanelStoreConstructor,
): FunctionComponent<Props> => ({ data, index, style }) => {
  const log = data.items[data.items.length - index - 1];

  return (
    <DDPLog
      key={log.id}
      store={store}
      log={log}
      isNew={store.newDdpLogs.includes(log.id)}
      isStarred={store.bookmarkIds.includes(log.id)}
      style={style}
    />
  );
};
