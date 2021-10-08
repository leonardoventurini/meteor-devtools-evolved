import { Switch } from '@blueprintjs/core'
import { observer } from 'mobx-react-lite'
import React, { FormEvent, FunctionComponent } from 'react'
import { FilterCriteria } from './FilterConstants'

interface Props {
  activeFilters: FilterTypeMap<boolean>
  setFilter: (filter: FilterType, isEnabled: boolean) => void
}

export const DDPFilterMenu: FunctionComponent<Props> = observer(
  ({ activeFilters, setFilter }) => {
    const filters = Object.keys(FilterCriteria).map(filter => (
      <Switch
        key={filter}
        checked={activeFilters[filter as FilterType]}
        label={filter.charAt(0).toUpperCase() + filter.slice(1)}
        onChange={(event: FormEvent<HTMLInputElement>) =>
          setFilter(filter as FilterType, event.currentTarget.checked)
        }
      />
    ))

    return <div style={{ padding: 10 }}>{filters}</div>
  },
)
