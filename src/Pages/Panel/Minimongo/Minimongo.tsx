import React, { FunctionComponent } from 'react';
import { Hideable } from '../../../Utils/Hideable';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '../../../Stores/PanelStore';
import { ObjectTree } from '../../../Utils/ObjectTree';

interface Props {
  isVisible: boolean;
}

export const Minimongo: FunctionComponent<Props> = observer(({ isVisible }) => {
  const panelStore = usePanelStore();

  // const tree: ITreeNode[] = toPairs(panelStore.minimongoStore.collections).map(
  //   ([key, documents]) => ({
  //     id: key,
  //     hasCaret: true,
  //     icon: 'database',
  //     label: key,
  //     expanded: true,
  //     childNodes: documents.map(document => ({
  //       id: document._id,
  //       hasCaret: false,
  //       icon: 'document',
  //       label: truncate(JSON.stringify(document)),
  //     })),
  //   }),
  // );

  return (
    <Hideable isVisible={isVisible}>
      <ObjectTree object={panelStore.minimongoStore.collections} />
    </Hideable>
  );
});
