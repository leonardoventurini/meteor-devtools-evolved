import { PanelDatabase } from '@/Database/PanelDatabase'
import {
  action,
  computed,
  makeObservable,
  observableShallow,
  runInAction,
} from 'mobx'
import { Searchable } from '../Common/Searchable'
import { PanelStore } from '@/Stores/PanelStore'

export class BookmarkStore extends Searchable<Bookmark> {
  constructor() {
    super()
    makeObservable(this, {
      bookmarkIds: observableShallow,
      remove: action,
      add: action,
      filterRegularExpression: computed,
    })
  }

  bookmarkIds: (string | undefined)[] = []

  async sync() {
    const collection = await PanelDatabase.getAll()

    runInAction(() => {
      this.collection = collection
      this.bookmarkIds = this.collection.map(
        (bookmark: Bookmark) => bookmark.id,
      )
    })
  }

  async remove(log: DDPLog) {
    if (log.timestamp) {
      await PanelDatabase.remove(log.id)
      await this.sync()
    }
  }

  async add(log: DDPLog) {
    const key = await PanelDatabase.add(log)
    const bookmark = await PanelDatabase.get(key)

    if (bookmark) {
      runInAction(() => {
        this.collection.push(bookmark)
        this.bookmarkIds.push(bookmark.log.id)
      })
    }
  }

  filterFunction = (collection: Bookmark[], search: string) =>
    collection
      .filter(
        bookmark => !this.filterRegularExpression.test(bookmark.log.content),
      )
      .filter(
        bookmark =>
          !search ||
          bookmark.log.content.toLowerCase().includes(search.toLowerCase()),
      )

  get filterRegularExpression() {
    return new RegExp(
      `"msg":"(${PanelStore.settingStore.activeFilterBlacklist.join('|')})"`,
    )
  }
}
