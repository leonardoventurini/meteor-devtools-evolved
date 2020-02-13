import React, { FunctionComponent } from 'react';
import { PanelStoreConstructor } from '../../Stores/PanelStore';
import { flow } from 'lodash/fp';
import { inject, observer } from 'mobx-react';
import { HTMLTable } from '@blueprintjs/core';
import JSONTree from 'react-json-tree';
import moment from 'moment';

interface Props {
  panelStore?: PanelStoreConstructor;
}

export const DDP: FunctionComponent<Props> = flow(
  observer,
  inject('panelStore'),
)(({ panelStore }) => {
  const theme = {
    scheme: 'google',
    base00: 'transparent',
    base01: '#282a2e',
    base02: '#373b41',
    base03: '#969896',
    base04: '#b4b7b4',
    base05: '#c5c8c6',
    base06: '#e0e0e0',
    base07: '#ffffff',
    base08: '#CC342B',
    base09: '#F96A38',
    base0A: '#FBA922',
    base0B: '#CED9E0',
    base0C: '#eda794',
    base0D: '#2B95D6',
    base0E: '#A36AC7',
    base0F: '#9ded9b',
  };

  const renderedMessages = panelStore?.ddp.map(message => (
    <tr key={message.timestamp}>
      <td>
        {(message.isInbound && 'Inbound') || (message.isOutbound && 'Outbound')}
      </td>
      <td>
        <JSONTree
          data={JSON.parse(message.content)}
          theme={theme}
          invertTheme={false}
          hideRoot
        />
      </td>
      <td>
        {message.timestamp && moment(message.timestamp).format('HH:mm:ss.SSS')}
      </td>
    </tr>
  ));

  return (
    <div>
      <HTMLTable className='mde-table' condensed interactive>
        <thead>
          <tr>
            <th>Flow</th>
            <th>Content</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>{renderedMessages}</tbody>
      </HTMLTable>
    </div>
  );
});
