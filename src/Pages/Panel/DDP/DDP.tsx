import React, { FunctionComponent } from 'react';
import { usePanelStore } from '../../../Stores/PanelStore';
import { DDPLog } from './DDPLog';
import { Button, Classes, Icon, Tag } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';

const Empty: FunctionComponent = () => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <span className={Classes.TEXT_MUTED}>
      No logs yet... <Icon icon='comment' />
    </span>
  </div>
);

export const DDP: FunctionComponent = observer(() => {
  const panelStore = usePanelStore();

  const logs = panelStore?.ddp.map(log => (
    <DDPLog log={log} key={log.timestamp} />
  ));

  return (
    <>
      <div className='mde-ddp'>{logs?.length ? logs : <Empty />}</div>

      <div className='mde-layout__status'>
        <Tag intent='primary' minimal round>
          {panelStore?.ddpCount}
        </Tag>

        <Button
          intent='danger'
          minimal
          style={{ marginLeft: 10 }}
          onClick={() => {
            panelStore?.clearLogs();
          }}
        >
          <Icon icon='disable' />
        </Button>
      </div>
    </>
  );
});
