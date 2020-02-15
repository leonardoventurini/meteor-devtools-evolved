import React, { FunctionComponent, RefObject } from 'react';
import { PanelStoreConstructor } from '../../../Stores/PanelStore';
import { flow } from 'lodash/fp';
import { inject, observer } from 'mobx-react';
import { DDPMessage } from './DDPMessage';
import { Button, Icon, Tag } from '@blueprintjs/core';
import { tryScroll } from '../../../Utils';

interface Props {
  panelRef: RefObject<HTMLDivElement>;
  panelStore?: PanelStoreConstructor;
}

export const DDP: FunctionComponent<Props> = flow(
  observer,
  inject('panelStore'),
)(({ panelRef, panelStore }) => {
  const logs = panelStore?.ddp.map(message => (
    <DDPMessage store={panelStore} message={message} key={message.timestamp} />
  ));

  tryScroll(panelRef);

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
