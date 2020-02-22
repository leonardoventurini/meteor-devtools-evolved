import React, { FormEvent, FunctionComponent } from 'react';
import { Switch } from '@blueprintjs/core';
import { observer } from 'mobx-react-lite';
import { FilterCriteria } from './FilterConstants';
import { DDPStore } from '../../../Stores/Panel/DDPStore';

interface Props {
  store: DDPStore;
}

export const DDPFilterMenu: FunctionComponent<Props> = observer(({ store }) => {
  const filters = Object.keys(FilterCriteria).map(filter => (
    <Switch
      key={filter}
      checked={store.activeFilters[filter as FilterType]}
      label={filter.charAt(0).toUpperCase() + filter.slice(1)}
      onChange={(event: FormEvent<HTMLInputElement>) =>
        store.setFilter(filter as FilterType, event.currentTarget.checked)
      }
    />
  ));

  return <div style={{ padding: 10 }}>{filters}</div>;
});
