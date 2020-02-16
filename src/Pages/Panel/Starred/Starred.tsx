import React, { FunctionComponent } from 'react';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '../../../Stores/PanelStore';
import { Hideable } from '../../../Utils/Hideable';

interface Props {
  isVisible: boolean;
}

export const Starred: FunctionComponent<Props> = observer(({ isVisible }) => {
  const store = usePanelStore();

  return <Hideable isVisible={isVisible}>Hello World</Hideable>;
});
