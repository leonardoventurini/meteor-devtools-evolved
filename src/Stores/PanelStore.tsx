import React, { createContext, FunctionComponent } from 'react';
import { action, observable, toJS } from 'mobx';
import { debounce } from 'lodash';
import { PanelDatabase } from '../Database/PanelDatabase';
import { useLocalStore } from 'mobx-react-lite';

export class PanelStoreConstructor {
  @observable ddpCount: number = 0;
  @observable ddp: DDPLog[] = [];
  @observable newDdpLogs: number[] = [];
  @observable activeLog: DDPLog | null = null;
  @observable activeStackTrace: StackTrace[] | null = null;
  @observable bookmarks: Bookmark[] = [];
  @observable bookmarkIds: number[] = [];

  constructor() {
    this.syncBookmarks().catch(console.error);
  }

  @action
  pushLog(log: DDPLog) {
    if (log.timestamp) {
      this.newDdpLogs.push(log.timestamp);
    }

    this.ddp.push(log);

    // Maximum number of items.
    if (this.ddpCount + 1 > 1000) {
      this.ddp.shift();
    } else {
      ++this.ddpCount;
    }

    this.clearNewLogs();
  }

  clearNewLogs = debounce(
    action(() => {
      this.newDdpLogs = [];
    }),
    1000,
  );

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
    console.log(toJS(trace));
    this.activeStackTrace = trace;
  }

  @action
  async addBookmark(log: DDPLog) {
    const bookmarkKey = await PanelDatabase.addBookmark(log);

    const bookmark = await PanelDatabase.getBookmark(bookmarkKey);

    if (bookmark) {
      this.bookmarks.push(bookmark);
      this.bookmarkIds.push(bookmark.log.timestamp ?? 0);
    }
  }

  @action
  async removeBookmark(log: DDPLog) {
    if (log.timestamp) {
      await PanelDatabase.removeBookmark(log.timestamp);
      await this.syncBookmarks();
    }
  }

  @action
  async syncBookmarks() {
    this.bookmarks = await PanelDatabase.getBookmarks();
    this.bookmarkIds = this.bookmarks.map(
      (bookmark: Bookmark) => bookmark.log.timestamp ?? 0,
    );
  }
}

export const PanelStore = new PanelStoreConstructor();

const PanelStoreContext = createContext<PanelStoreConstructor | null>(null);

export const PanelStoreProvider: FunctionComponent = ({ children }) => {
  const store = useLocalStore(() => PanelStore);

  return (
    <PanelStoreContext.Provider value={store}>
      {children}
    </PanelStoreContext.Provider>
  );
};

export const usePanelStore = () => {
  const store = React.useContext(PanelStoreContext);

  if (!store) {
    throw new Error('useStore must be used within a StoreProvider.');
  }

  return store;
};
