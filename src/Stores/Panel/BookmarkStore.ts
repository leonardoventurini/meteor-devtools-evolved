import { PanelDatabase } from '@/Database/PanelDatabase';
import { action, computed, observable } from 'mobx';
import { Searchable } from '../Common/Searchable';
import { PanelStore } from '@/Stores/PanelStore';

export class BookmarkStore extends Searchable<Bookmark> {
  @observable.shallow bookmarkIds: (string | undefined)[] = [];

  @action
  async sync() {
    this.collection = await PanelDatabase.getAll();
    this.bookmarkIds = this.collection.map((bookmark: Bookmark) => bookmark.id);
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

  filterFunction = (collection: Bookmark[], search: string) =>
    collection
      .filter(
        bookmark => !this.filterRegularExpression.test(bookmark.log.content),
      )
      .filter(
        bookmark =>
          !search ||
          bookmark.log.content
            .toLowerCase()
            .concat(bookmark.log.hash ?? '')
            .includes(search.toLowerCase()),
      );

  @computed
  get filterRegularExpression() {
    return new RegExp(
      `"msg":"(${PanelStore.settingStore.activeFilterBlacklist.join('|')})"`,
    );
  }
}
