import { action, computed, observable } from 'mobx';
import { compact, debounce, flatten } from 'lodash';
import { DEFAULT_OFFSET } from '../../Constants';
import { calculatePagination } from '../../Utils/Pagination';
import { FilterCriteria } from '../../Pages/Panel/DDP/FilterConstants';

export class DDPStore implements Store {
  ddpBuffer: DDPLog[] = [];

  @observable currentPage: number = 1;

  @observable inboundBytes: number = 0;
  @observable outboundBytes: number = 0;

  @observable.shallow logsCollection: DDPLog[] = [];
  @observable newLogs: string[] = [];

  @observable activeLog: DDPLog | null = null;
  @observable.shallow activeStackTrace: StackTrace[] | null = null;

  @observable search: string = '';
  @observable.shallow activeFilterBlacklist: string[] = [];

  @observable activeFilters: FilterTypeMap<boolean> = {
    heartbeat: true,
    subscription: true,
    collection: true,
    method: true,
    connection: true,
  };

  @observable isLoading: boolean = false;

  pushLog(log: DDPLog) {
    if (!this.isLoading) {
      this.isLoading = true;
    }

    this.ddpBuffer.push(log);

    this.submitLogs();
  }

  submitLogs = debounce(
    action(() => {
      this.logsCollection.unshift(...this.ddpBuffer.reverse());

      this.newLogs.push(...this.ddpBuffer.map(({ id }) => id));

      this.inboundBytes += this.ddpBuffer
        .filter(log => log.isInbound)
        .reduce((sum, log) => sum + (log.size ?? 0), 0);

      this.outboundBytes += this.ddpBuffer
        .filter(log => log.isOutbound)
        .reduce((sum, log) => sum + (log.size ?? 0), 0);

      this.ddpBuffer = [];

      this.clearNewLogs();

      this.isLoading = false;
    }),
    100,
  );

  clearNewLogs = debounce(() => {
    this.newLogs = [];
  }, 1000);

  @action
  clearLogs() {
    this.logsCollection = [];
  }

  @action
  setActiveLog(log: DDPLog | null) {
    this.activeLog = log;
  }

  @action
  setActiveStackTrace(trace: StackTrace[] | null) {
    this.activeStackTrace = trace;
  }

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

  setSearch = debounce(
    action((search: string) => {
      this.search = search;
    }),
    250,
  );

  @action
  setCurrentPage(currentPage: number) {
    this.currentPage = currentPage;
  }

  @computed
  get filterRegularExpression() {
    return new RegExp(`"msg":"(${this.activeFilterBlacklist.join('|')})"`);
  }

  @computed
  get filteredLogsCollection() {
    return this.logsCollection
      .filter(log => !this.filterRegularExpression.test(log.content))
      .filter(log => !this.search || log.content.includes(this.search));
  }

  @computed
  get pagination() {
    return calculatePagination(
      DEFAULT_OFFSET,
      this.filteredLogsCollection.length,
      this.currentPage,
      this.setCurrentPage,
    );
  }

  @computed
  get paginatedFilteredLogsCollection() {
    return this.filteredLogsCollection.slice(
      this.pagination.start,
      this.pagination.end,
    );
  }
}
