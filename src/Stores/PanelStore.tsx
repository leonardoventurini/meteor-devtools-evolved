import React, { createContext, FunctionComponent } from 'react';
import { action, observable, toJS } from 'mobx';
import { compact, debounce, flatten } from 'lodash';
import { PanelDatabase } from '../Database/PanelDatabase';
import { FilterCriteria } from '../Pages/Panel/DDP/FilterConstants';

export class PanelStoreConstructor {
  ddpBuffer: DDPLog[] = [];

  @observable ddpCount: number = 0;
  @observable.shallow ddp: DDPLog[] = [];
  @observable.shallow newDdpLogs: string[] = [];

  @observable activeLog: DDPLog | null = null;
  @observable.shallow activeStackTrace: StackTrace[] | null = null;

  @observable.shallow bookmarks: Bookmark[] = [];
  @observable.shallow bookmarkIds: (string | undefined)[] = [];

  @observable.shallow activeFilterBlacklist: string[] = [];

  @observable activeFilters = {
    heartbeat: true,
    subscription: true,
    collection: true,
    method: true,
    connection: true,
  };

  constructor() {
    this.syncBookmarks().catch(console.error);
  }

  pushLog(log: DDPLog) {
    this.ddpBuffer.push(log);
    this.submitLogs();
  }

  submitLogs = debounce(
    action(() => {
      const newDdp = this.ddp.concat(this.ddpBuffer);

      if (newDdp.length > 500) {
        this.ddp = newDdp.slice(-500);
      } else {
        this.ddp = newDdp;
      }

      this.newDdpLogs.push(...this.ddpBuffer.map(({ id }) => id));

      this.ddpBuffer = [];

      this.ddpCount = this.ddp.length;

      this.clearNewLogs();
    }),
    100,
  );

  clearNewLogs = debounce(() => {
    this.newDdpLogs = [];
  }, 1000);

  @action
  clearLogs() {
    this.ddp = [];
    this.ddpCount = 0;
  }

  @action
  setActiveLog(log: DDPLog | null) {
    this.activeLog = log;
  }

  @action
  setActiveStackTrace(trace: StackTrace[] | null) {
    this.activeStackTrace = trace;
  }

  @action
  async addBookmark(log: DDPLog) {
    const bookmarkKey = await PanelDatabase.addBookmark(log);
    const bookmark = await PanelDatabase.getBookmark(bookmarkKey);

    if (bookmark) {
      this.bookmarks.push(bookmark);
      this.bookmarkIds.push(bookmark.log.id);
    }
  }

  @action
  async removeBookmark(log: DDPLog) {
    if (log.timestamp) {
      await PanelDatabase.removeBookmark(log.id);
      await this.syncBookmarks();
    }
  }

  @action
  async syncBookmarks() {
    console.log('Syncing bookmarks...');

    this.bookmarks = await PanelDatabase.getBookmarks();
    this.bookmarkIds = this.bookmarks.map((bookmark: Bookmark) => bookmark.id);
  }

  @action
  setFilter(type: FilterType, isEnabled: boolean) {
    this.activeFilters[type] = isEnabled;

    this.activeFilterBlacklist = flatten(
      compact(
        Object.entries(this.activeFilters).map(([type, isEnabled]) => {
          return isEnabled ? false : FilterCriteria[type];
        }),
      ),
    );

    console.log(toJS(this.activeFilterBlacklist));
  }
}

export const PanelStore = new PanelStoreConstructor();

const PanelStoreContext = createContext<PanelStoreConstructor | null>(null);

export const PanelStoreProvider: FunctionComponent = ({ children }) => (
  <PanelStoreContext.Provider value={PanelStore}>
    {children}
  </PanelStoreContext.Provider>
);

export const usePanelStore = () => {
  const store = React.useContext(PanelStoreContext);

  if (!store) {
    throw new Error('Must be used within a provider.');
  }

  return store;
};
