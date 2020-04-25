import { SearchControls } from '@/Pages/Layout/SearchControls';
import { Button, Popover } from '@blueprintjs/core';
import { Position } from '@blueprintjs/core/lib/esm/common/position';
import React, { FunctionComponent } from 'react';
import { DDPFilterMenu } from '../DDPFilterMenu';

interface Props {
  activeFilters: FilterTypeMap<boolean>;
  setFilter: (filter: FilterType, isEnabled: boolean) => void;
  pagination: Pagination;
}

export const FilterControls: FunctionComponent<Props> = ({
  activeFilters,
  setFilter,
  pagination,
  children,
}) => (
  <div className='filter-controls'>
    {children}

    <Popover
      content={
        <DDPFilterMenu setFilter={setFilter} activeFilters={activeFilters} />
      }
      position={Position.RIGHT_TOP}
    >
      <Button icon='filter' text='Filter' />
    </Popover>

    <SearchControls pagination={pagination} />
  </div>
);
