import { Paginable } from '../Common/Paginable';
import { action, observable } from 'mobx';
import { PanelDatabase } from '../../Database/PanelDatabase';

export class StarredStore extends Paginable<Bookmark> {
  @observable.shallow bookmarkIds: (string | undefined)[] = [];

  @action
  async syncBookmarks() {
    this.collection = await PanelDatabase.getBookmarks();
    this.bookmarkIds = this.collection.map((bookmark: Bookmark) => bookmark.id);
  }

  @action
  async removeBookmark(log: DDPLog) {
    if (log.timestamp) {
      await PanelDatabase.removeBookmark(log.id);
      await this.syncBookmarks();
    }
  }

  @action
  async addBookmark(log: DDPLog) {
    const bookmarkKey = await PanelDatabase.addBookmark(log);
    const bookmark = await PanelDatabase.getBookmark(bookmarkKey);

    if (bookmark) {
      this.collection.push(bookmark);
      this.bookmarkIds.push(bookmark.log.id);
    }
  }
}
