import React, { FormEvent, FunctionComponent } from 'react';
import { StatusBar } from '@/Components/StatusBar';
import { Button } from '@/Components/Button';
import { TextInput } from '@/Components/TextInput';
import { Field } from '@/Components/Field';
import { observer } from 'mobx-react-lite';
import { usePanelStore } from '@/Stores/PanelStore';

export const MinimongoStatus: FunctionComponent = observer(() => {
  const { minimongoStore } = usePanelStore();

  return (
    <StatusBar>
      <div className='left-group'>
        <Button
          icon={minimongoStore.activeCollection ? 'database' : 'asterisk'}
          onClick={() => minimongoStore.setNavigatorVisible(true)}
          disabled={!minimongoStore.collectionNames.length}
        >
          {minimongoStore.activeCollection || 'Everything'}
        </Button>

        {minimongoStore.activeCollection && (
          <Button
            icon='asterisk'
            onClick={() => minimongoStore.setActiveCollection(null)}
          >
            Clear
          </Button>
        )}

        <TextInput
          icon='search'
          placeholder='Search...'
          onChange={(event: FormEvent<HTMLInputElement>) =>
            minimongoStore.activeCollectionDocuments.pagination.setSearch(
              event.currentTarget.value,
            )
          }
        />

        <Field icon='eye-open'>
          {minimongoStore.activeCollectionDocuments.pagination.length}
        </Field>
      </div>
    </StatusBar>
  );
});
