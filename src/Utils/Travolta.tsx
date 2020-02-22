import React, { FunctionComponent, useEffect, useState } from 'react';
import { sample } from 'lodash';

import TravoltaGif from '../Assets/travolta.gif';
import { Classes } from '@blueprintjs/core';

const messages = [
  'No logs yet',
  'Hit that refresh button',
  'Ahoy',
  'No one is here yet',
  'Here comes the BOOM',
  'Watch this',
];

export const Travolta: FunctionComponent = () => {
  const [isFinished, setFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFinished(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const message = sample(messages);

  const placeholder = isFinished ? (
    <span className={Classes.TEXT_MUTED}>{message}</span>
  ) : (
    <img src={TravoltaGif} height={64} width={64} />
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {placeholder}
    </div>
  );
};
