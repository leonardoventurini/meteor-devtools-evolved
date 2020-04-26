import React, { FunctionComponent, useEffect, useState } from 'react';

import TravoltaGif from '../Assets/travolta.gif';
import styled from 'styled-components';
import { STATUS_HEIGHT } from '@/Styles/Constants';

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  position: absolute;
  bottom: ${STATUS_HEIGHT + 32}px;
  width: 100%;
`;

export const Travolta: FunctionComponent = () => {
  const [isFinished, setFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFinished(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Wrapper>
      {!isFinished && (
        <img src={TravoltaGif} height={64} width={64} alt='Travolta' />
      )}
    </Wrapper>
  );
};
