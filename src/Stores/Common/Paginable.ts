import { DEFAULT_OFFSET } from '@/Constants';
import { calculatePagination } from '@/Utils/Pagination';
import { debounce } from 'lodash';
import { action, computed, observable } from 'mobx';

type BufferCallback<T> = ((buffer: T[]) => void) | null;
type FilterFunction<T> = ((collection: T[], search: string) => T[]) | null;

export abstract class Paginable<T> {
  bufferCallback: BufferCallback<T> = null;
  filterFunction: FilterFunction<T> = null;

  buffer: T[] = [];

  @observable.shallow collection: T[] = [];

  @observable currentPage: number = 1;
  @observable search: string = '';
  @observable isLoading: boolean = false;

  @action
  setCollection(collection: T[]) {
    this.collection = collection;
  }

  pushItem(log: T) {
    if (!this.isLoading) {
      this.isLoading = true;
    }

    this.buffer.push(log);

    this.submitLogs();
  }

  submitLogs = debounce(
    action(() => {
      this.collection.unshift(...this.buffer.reverse());

      if (this.bufferCallback) {
        this.bufferCallback(this.buffer);
      }

      this.buffer = [];

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
      this.currentPage = 1;
    }),
    250,
  );

  @action
  setCurrentPage(currentPage: number) {
    this.currentPage = currentPage;
  }

  @computed
  get filtered() {
    return this.filterFunction
      ? this.filterFunction(this.collection, this.search)
      : this.collection;
  }

  @computed
  get pagination() {
    return calculatePagination(
      DEFAULT_OFFSET,
      this.filtered.length,
      this.currentPage,
      this.setSearch.bind(this),
      this.setCurrentPage.bind(this),
    );
  }

  @computed
  get paginated() {
    return this.filtered.slice(this.pagination.start, this.pagination.end);
  }
}
