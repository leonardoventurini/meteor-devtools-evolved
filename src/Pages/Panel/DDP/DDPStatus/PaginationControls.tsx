import React, { FunctionComponent } from 'react';
import { Button } from '@blueprintjs/core';

interface Props {
  pagination: Pagination;
}

export const PaginationControls: FunctionComponent<Props> = ({
  pagination,
}) => (
  <>
    <Button
      minimal
      onClick={pagination.next}
      disabled={!pagination.hasNextPage}
      icon='fast-backward'
      style={{ marginRight: 10 }}
    />
    <Button
      minimal
      onClick={pagination.prev}
      disabled={!pagination.hasPreviousPage}
      icon='fast-forward'
    />
  </>
);
