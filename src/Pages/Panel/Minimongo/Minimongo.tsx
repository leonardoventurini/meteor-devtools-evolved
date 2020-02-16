import React, { FunctionComponent } from 'react';
import { Hideable } from '../../../Utils/Hideable';

interface Props {
  isVisible: boolean;
}

export const Minimongo: FunctionComponent<Props> = ({ isVisible }) => (
  <Hideable isVisible={isVisible}>
    <h1>Minimongo</h1>
  </Hideable>
);
