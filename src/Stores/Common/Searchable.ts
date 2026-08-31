import { DEFAULT_OFFSET } from '@/Constants'
import { calculatePagination } from '@/Utils/Pagination'
import debounce from 'lodash.debounce'
import {
  action,
  computed,
  makeObservable,
  observable,
  observableShallow,
  runInAction,
} from 'mobx'

type BufferCallback<T> = ((buffer: T[]) => void) | null
type FilterFunction<T> = ((collection: T[], search: string) => T[]) | null

export abstract class Searchable<T> {
  constructor() {
    makeObservable(this, {
      collection: observableShallow,
      currentPage: observable,
      search: observable,
      isLoading: observable,
      setCollection: action,
      _submitLogs: action,
      setCurrentPage: action,
      filtered: computed,
      pagination: computed,
      paginated: computed,
    })
  }

  bufferCallback: BufferCallback<T> = null
  filterFunction: FilterFunction<T> = null

  lastPush: number = 0
  loadingTimeout: ReturnType<typeof setTimeout> | null = null

  buffer: T[] = []

  collection: T[] = []

  currentPage: number = 1
  search: string = ''
  isLoading: boolean = false

  setCollection(collection: T[]) {
    this.collection = collection
  }

  pushItem(log: T) {
    this.lastPush = Date.now()

    if (!this.isLoading) {
      runInAction(() => {
        this.isLoading = true
      })
    }

    this.buffer.push(log)

    this.submitLogs()

    this.setLoadingState(false)
  }

  submitLogs = debounce(
    action(() => {
      this._submitLogs()
    }),
    100,
    {
      maxWait: 1000,
    },
  )

  _submitLogs() {
    if (this.bufferCallback) {
      this.bufferCallback(this.buffer)
    }

    console.log('submitted')

    this.collection.unshift(...this.buffer.reverse())

    this.buffer = []
  }

  setSearch = debounce(
    action((search: string) => {
      this.search = search
      this.currentPage = 1
    }),
    250,
  )

  setLoadingState(isLoading: boolean) {
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout)
    }

    this.loadingTimeout = setTimeout(
      action(() => {
        this.isLoading = isLoading

        console.log('loading:false')
      }),
      250,
    )
  }

  setCurrentPage(currentPage: number) {
    this.currentPage = currentPage
  }

  get filtered() {
    return this.filterFunction
      ? this.filterFunction(this.collection, this.search)
      : this.collection
  }

  get pagination() {
    return calculatePagination(
      DEFAULT_OFFSET,
      this.filtered.length,
      this.currentPage,
      this.setSearch.bind(this),
      this.setCurrentPage.bind(this),
    )
  }

  get paginated() {
    return this.filtered.slice(this.pagination.start, this.pagination.end)
  }
}
