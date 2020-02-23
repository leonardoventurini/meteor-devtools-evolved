import { Paginable } from '../Common/Paginable';
import { action, computed, observable } from 'mobx';
import { PanelDatabase } from '../../Database/PanelDatabase';
import { compact, flatten } from 'lodash';
import { FilterCriteria } from '../../Pages/Panel/DDP/FilterConstants';

export class BookmarkStore extends Paginable<Bookmark> {
  @observable.shallow bookmarkIds: (string | undefined)[] = [];

  @observable.shallow activeFilterBlacklist: string[] = [];

  @observable activeFilters: FilterTypeMap<boolean> = {
    heartbeat: true,
    subscription: true,
    collection: true,
    method: true,
    connection: true,
  };

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

  @action
  setFilter(type: FilterType, isEnabled: boolean) {
    this.activeFilters[type] = isEnabled;

    this.activeFilterBlacklist = flatten(
      compact(
        Object.entries(this.activeFilters).map(([type, isEnabled]) => {
          return isEnabled ? false : FilterCriteria[type as FilterType];
        }),
      ),
    );
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
    return new RegExp(`"msg":"(${this.activeFilterBlacklist.join('|')})"`);
  }
}
