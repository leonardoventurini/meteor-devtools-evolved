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

  addStarredLog(log: DDPLog) {
    return this.bookmarks.add({
      id: log.id,
      timestamp: Date.now(),
      log: toJS(log),
    });
  }

  getStarredLog(key: string) {
    return this.bookmarks.get(key);
  }

  removeStarredLog(key: string) {
    return this.bookmarks.delete(key);
  }

  getStarredLogs() {
    return this.bookmarks.toArray();
  }
}

export const PanelDatabase = new Database();
