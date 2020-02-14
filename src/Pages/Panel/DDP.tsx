import React, { FunctionComponent } from 'react';
import { PanelStoreConstructor } from '../../Stores/PanelStore';
import { defer } from 'lodash';
import { flow } from 'lodash/fp';
import { inject, observer } from 'mobx-react';
import { DDPMessage } from './DDP/DDPMessage';
import { Button, Icon, Tag } from '@blueprintjs/core';
import { scrollToBottom } from '../../Utils';

interface Props {
  panelStore?: PanelStoreConstructor;
}

export const DDP: FunctionComponent<Props> = flow(
  observer,
  inject('panelStore'),
)(({ panelStore }) => {
  const logs = panelStore?.ddp.map(message => (
    <DDPMessage store={panelStore} message={message} key={message.timestamp} />
  ));

  defer(scrollToBottom);

  return (
    <>
      <div className='mde-ddp'>{logs}</div>

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
