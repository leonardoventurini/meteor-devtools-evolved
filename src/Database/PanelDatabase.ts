import Dexie from 'dexie';
import { toJS } from 'mobx';

class Database extends Dexie {
  bookmarks: Dexie.Table<Bookmark, string>;

  constructor() {
    super('MeteorToolsDatabase');

    this.version(1).stores({
      bookmarks: 'id, timestamp, log',
    });

    this.bookmarks = this.table('bookmarks');
  }

  add(log: DDPLog) {
    return this.bookmarks.add({
      id: log.id,
      timestamp: Date.now(),
      log: toJS(log),
    });
  }

  get(key: string) {
    return this.bookmarks.get(key);
  }

  remove(key: string) {
    return this.bookmarks.delete(key);
  }

  getAll() {
    return this.bookmarks.toArray();
  }
}

export const PanelDatabase = new Database();
