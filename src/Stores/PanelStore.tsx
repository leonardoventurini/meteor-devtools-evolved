import React, { createContext, FunctionComponent } from 'react';
import { action, observable } from 'mobx';
import { PanelDatabase } from '../Database/PanelDatabase';
import { DDPStore } from './Panel/DDPStore';

export class PanelStoreConstructor {
  @observable inboundBytes: number = 0;
  @observable outboundBytes: number = 0;

  @observable activeLog: DDPLog | null = null;
  @observable.shallow activeStackTrace: StackTrace[] | null = null;

  @observable.shallow bookmarks: Bookmark[] = [];
  @observable.shallow bookmarkIds: (string | undefined)[] = [];

  ddpStore = new DDPStore();

  constructor() {
    this.syncBookmarks().catch(console.error);
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
