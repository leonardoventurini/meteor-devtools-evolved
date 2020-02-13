import React, { FunctionComponent } from 'react';
import { PanelStoreConstructor } from '../../Stores/PanelStore';
import { flow } from 'lodash/fp';
import { inject, observer } from 'mobx-react';

interface Props {
  panelStore?: PanelStoreConstructor;
}

export const DDP: FunctionComponent<Props> = flow(
  observer,
  inject('panelStore'),
)(({ panelStore }) => {
  console.log(panelStore);
  console.log(panelStore?.ddp.length);

  const renderedMessages = panelStore?.ddp.map(message =>
    JSON.stringify(message),
  );

  return (
    <div>
      <h1>DDP</h1>

      {renderedMessages}
    </div>
  );
});
