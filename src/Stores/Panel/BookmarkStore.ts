import { Paginable } from '../Common/Paginable';
import { action, observable } from 'mobx';
import { PanelDatabase } from '../../Database/PanelDatabase';

export class BookmarkStore extends Paginable<Bookmark> {
  @observable.shallow bookmarkIds: (string | undefined)[] = [];

  @action
  async sync() {
    this.collection = await PanelDatabase.getAll();
    this.bookmarkIds = this.collection.map(
      (bookmark: Bookmark) => bookmark.id,
    );
  }

  @action
  async remove(log: DDPLog) {
    if (log.timestamp) {
      await PanelDatabase.remove(log.id);
      await this.sync();
    }
  }

  @action
  async add(log: DDPLog) {
    const key = await PanelDatabase.add(log);
    const bookmark = await PanelDatabase.get(key);

    if (bookmark) {
      this.collection.push(bookmark);
      this.bookmarkIds.push(bookmark.log.id);
    }
  }
}
