import Dexie from 'dexie';
import { toJS } from 'mobx';

class Database extends Dexie {
  bookmarks: Dexie.Table<StarredLog, string>;

  constructor() {
    super('MeteorToolsDatabase');

    this.version(1).stores({
      bookmarks: 'id, timestamp, log',
    });

    this.bookmarks = this.table('bookmarks');
  }

  addBookmark(log: DDPLog) {
    return this.bookmarks.add({
      id: log.id,
      timestamp: Date.now(),
      log: toJS(log),
    });
  }

  getBookmark(key: string) {
    return this.bookmarks.get(key);
  }

  removeBookmark(key: string) {
    return this.bookmarks.delete(key);
  }

  getBookmarks() {
    return this.bookmarks.toArray();
  }
}

export const PanelDatabase = new Database();
