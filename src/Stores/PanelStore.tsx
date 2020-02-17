import React, { createContext, FunctionComponent } from 'react';
import { action, observable } from 'mobx';
import { compact, debounce, flatten } from 'lodash';
import { PanelDatabase } from '../Database/PanelDatabase';
import { FilterCriteria } from '../Pages/Panel/DDP/FilterConstants';

export class PanelStoreConstructor {
  ddpBuffer: DDPLog[] = [];

  @observable inboundBytes: number = 0;
  @observable outboundBytes: number = 0;

  @observable.shallow ddp: DDPLog[] = [];
  @observable.shallow newDdpLogs: string[] = [];

  @observable activeLog: DDPLog | null = null;
  @observable.shallow activeStackTrace: StackTrace[] | null = null;

  @observable.shallow bookmarks: Bookmark[] = [];
  @observable.shallow bookmarkIds: (string | undefined)[] = [];

  @observable.shallow activeFilterBlacklist: string[] = [];

  @observable activeFilters: FilterTypeMap<boolean> = {
    heartbeat: true,
    subscription: true,
    collection: true,
    method: true,
    connection: true,
  };

  @observable isLoading: boolean = false;

  constructor() {
    this.syncBookmarks().catch(console.error);
  }

  pushLog(log: DDPLog) {
    if (!this.isLoading) {
      this.isLoading = true;
    }

    this.ddpBuffer.push(log);

    this.submitLogs();
  }

  submitLogs = debounce(
    action(() => {
      this.ddp.push(...this.ddpBuffer);

      this.newDdpLogs.push(...this.ddpBuffer.map(({ id }) => id));

      this.inboundBytes += this.ddpBuffer
        .filter(log => log.isInbound)
        .reduce((sum, log) => sum + (log.size ?? 0), 0);

      this.outboundBytes += this.ddpBuffer
        .filter(log => log.isOutbound)
        .reduce((sum, log) => sum + (log.size ?? 0), 0);

      this.ddpBuffer = [];

      this.clearNewLogs();

      this.isLoading = false;
    }),
    100,
  );

  clearNewLogs = debounce(() => {
    this.newDdpLogs = [];
  }, 1000);

  @action
  clearLogs() {
    this.ddp = [];
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
          return isEnabled ? false : FilterCriteria[type as FilterType];
        }),
      ),
    );
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
