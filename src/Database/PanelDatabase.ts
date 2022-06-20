import Dexie from 'dexie'
import { toJS } from 'mobx'

class Database extends Dexie {
  bookmarks: Dexie.Table<Bookmark, string>
  data: Dexie.Table<Record<string, any>, string>

  constructor() {
    super('MeteorToolsDatabase')

    this.version(1).stores({
      bookmarks: 'id, timestamp, log',
    })

    this.version(2).stores({
      data: 'id',
    })

    this.bookmarks = this.table('bookmarks')
    this.data = this.table('data')
  }

  add(log: DDPLog) {
    return this.bookmarks.add({
      id: log.id,
      timestamp: Date.now(),
      log: toJS(log),
    })
  }

  get(key: string) {
    return this.bookmarks.get(key)
  }

  remove(key: string) {
    return this.bookmarks.delete(key)
  }

  getAll() {
    return this.bookmarks.toArray()
  }

  async getSettings() {
    return (await this.data.get('settings')) ?? {}
  }

  async saveSettings(settings: ISettings) {
    if (await this.data.get('settings')) {
      return this.data.update('settings', settings)
    } else {
      return this.data.add({
        id: 'settings',
        ...settings,
      })
    }
  }
}

export const PanelDatabase = new Database()
