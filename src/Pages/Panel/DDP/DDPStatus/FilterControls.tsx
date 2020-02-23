import React, { FormEvent, FunctionComponent } from 'react';
import { Button, Icon, InputGroup, Popover, Tag } from '@blueprintjs/core';
import { DDPFilterMenu } from '../DDPFilterMenu';
import { Position } from '@blueprintjs/core/lib/esm/common/position';

interface Props {
  activeFilters: FilterTypeMap<boolean>;
  setFilter: (filter: FilterType, isEnabled: boolean) => void;
  setSearch: (search: string) => void;
  pagination: Pagination;
}

export const FilterControls: FunctionComponent<Props> = ({
  activeFilters,
  setFilter,
  setSearch,
  pagination,
}) => (
  <div className='mde-layout__status__filter'>
    <Popover
      content={
        <DDPFilterMenu setFilter={setFilter} activeFilters={activeFilters} />
      }
      position={Position.RIGHT_TOP}
    >
      <Button icon='filter' text='Filter' />
    </Popover>

    <InputGroup
      leftIcon='search'
      placeholder='Search...'
      onChange={(event: FormEvent<HTMLInputElement>) =>
        setSearch(event.currentTarget.value)
      }
    />

    <Tag minimal round>
      <Icon icon='eye-open' style={{ marginRight: 8 }} />
      {pagination.pageItems + ' of ' + pagination.length}
    </Tag>
  </div>
);
