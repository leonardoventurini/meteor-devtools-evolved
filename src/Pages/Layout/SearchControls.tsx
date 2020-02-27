import { Icon, InputGroup } from '@blueprintjs/core';
import React, { FormEvent, FunctionComponent } from 'react';

interface Props {
  pagination: Pagination;
}

export const SearchControls: FunctionComponent<Props> = ({ pagination }) => (
  <>
    <InputGroup
      leftIcon='search'
      placeholder='Search...'
      onChange={(event: FormEvent<HTMLInputElement>) =>
        pagination.setSearch(event.currentTarget.value)
      }
    />

    <small>
      <Icon icon='eye-open' style={{ marginRight: 8 }} />
      {pagination.pageItems + ' of ' + pagination.length}
    </small>
  </>
);
