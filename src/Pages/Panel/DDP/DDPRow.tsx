import React, { CSSProperties, FunctionComponent } from 'react';
import { DDPLog } from './DDPLog';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';

interface Props {
  key: string;
  index: number;
  style: CSSProperties;
  newDdpLogs: string[];
  bookmarkIds: (string | undefined)[];
}

export const DDPRow = (
  store: PanelStoreConstructor,
): FunctionComponent<Props> => ({
  key,
  index,
  style,
  newDdpLogs,
  bookmarkIds,
}) => {
  const log = store.ddp[index];

  return (
    <DDPLog
      key={key}
      store={store}
      log={log}
      isNew={Boolean(newDdpLogs?.includes(log.id))}
      isStarred={Boolean(bookmarkIds?.includes(log.id))}
      style={style}
    />
  );
};
