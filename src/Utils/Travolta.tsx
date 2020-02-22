import React, { FunctionComponent, useEffect, useState } from 'react';

import TravoltaGif from '../Assets/travolta.gif';
import { Classes, Icon } from '@blueprintjs/core';

const randomMessages = [
  'Hit the refresh button!!!',
  'Ahoy, get them logs...',
  'No one is here yet...',
];

export const Travolta: FunctionComponent = () => {
  const [isFinished, setFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFinished(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const placeholder = isFinished ? (
    <span className={Classes.TEXT_MUTED}>
      No logs yet... <Icon icon='comment' />
    </span>
  ) : (
    <img src={TravoltaGif} height={64} width={64} />
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {placeholder}
    </div>
  );
};
