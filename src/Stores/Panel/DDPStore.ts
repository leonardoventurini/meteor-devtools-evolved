import { action, computed, observable } from 'mobx';
import { compact, debounce, flatten } from 'lodash';
import { FilterCriteria } from '../../Pages/Panel/DDP/FilterConstants';
import { Paginable } from '../Common/Paginable';

export class DDPStore extends Paginable<DDPLog> {
  @observable inboundBytes: number = 0;
  @observable outboundBytes: number = 0;

  @observable newLogs: string[] = [];

  @observable.shallow activeFilterBlacklist: string[] = [];

  @observable activeFilters: FilterTypeMap<boolean> = {
    heartbeat: true,
    subscription: true,
    collection: true,
    method: true,
    connection: true,
  };

  @observable isLoading: boolean = false;

  bufferCallback = (buffer: DDPLog[]) => {
    this.newLogs.push(...buffer.map(({ id }) => id));

    this.inboundBytes += buffer
      .filter(log => log.isInbound)
      .reduce((sum, log) => sum + (log.size ?? 0), 0);

    this.outboundBytes += buffer
      .filter(log => log.isOutbound)
      .reduce((sum, log) => sum + (log.size ?? 0), 0);

    this.clearNewLogs();
  };

  clearNewLogs = debounce(() => {
    this.newLogs = [];
  }, 1000);

  @action
  setFilter(type: FilterType, isEnabled: boolean) {
    this.activeFilters[type] = isEnabled;

    this.activeFilterBlacklist = flatten(
      compact(
        Object.entries(this.activeFilters).map(([type, isEnabled]) => {
          return isEnabled ? false : FilterCriteria[type as FilterType];
        }),
      ),
    );
  }

  filterFunction = (collection: DDPLog[], search: string) =>
    collection
      .filter(log => !this.filterRegularExpression.test(log.content))
      .filter(
        log =>
          !search ||
          log.content
            .toLowerCase()
            .concat(log.hash ?? '')
            .includes(search.toLowerCase()),
      );

  @computed
  get filterRegularExpression() {
    return new RegExp(`"msg":"(${this.activeFilterBlacklist.join('|')})"`);
  }
}
