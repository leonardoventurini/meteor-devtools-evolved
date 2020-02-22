import { action, computed, observable } from 'mobx';
import { debounce } from 'lodash';
import { DEFAULT_OFFSET } from '../../Constants';
import { calculatePagination } from '../../Utils/Pagination';

type BufferCallback<T> = ((buffer: T[]) => void) | null;
type FilterFunction<T> = ((collection: T[], search: string) => T[]) | null;

export class Paginable<T> {
  bufferCallback: BufferCallback<T> = null;
  filterFunction: FilterFunction<T> = null;

  collectionBuffer: T[] = [];

  @observable currentPage: number = 1;

  @observable.shallow collection: T[] = [];

  @observable search: string = '';
  @observable.shallow activeFilterBlacklist: string[] = [];

  @observable isLoading: boolean = false;

  pushItem(log: T) {
    if (!this.isLoading) {
      this.isLoading = true;
    }

    this.collectionBuffer.push(log);

    this.submitLogs();
  }

  submitLogs = debounce(
    action(() => {
      this.collection.unshift(...this.collectionBuffer.reverse());

      if (this.bufferCallback) {
        this.bufferCallback(this.collectionBuffer);
      }

      this.collectionBuffer = [];

      this.isLoading = false;
    }),
    100,
  );

  @action
  clearLogs() {
    this.collection = [];
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
  get filteredLogsCollection() {
    return this.filterFunction
      ? this.filterFunction(this.collection, this.search)
      : this.collection;
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
