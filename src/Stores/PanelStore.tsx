import { action, observable, toJS } from 'mobx';
import React, { createContext, FunctionComponent } from 'react';
import { BookmarkStore } from './Panel/BookmarkStore';
import { DDPStore } from './Panel/DDPStore';
import { MinimongoStore } from './Panel/MinimongoStore';

export class PanelStoreConstructor {
  @observable activeObject: ViewableObject = null;
  @observable.shallow activeStackTrace: StackTrace[] | null = null;

  ddpStore = new DDPStore();
  bookmarkStore = new BookmarkStore();
  minimongoStore = new MinimongoStore();

  constructor() {
    this.bookmarkStore.sync().catch(console.error);
  }

  @action
  setActiveObject(viewableObject: ViewableObject) {
    this.activeObject = viewableObject;
  }

  @action
  setActiveStackTrace(trace: StackTrace[] | null) {
    this.activeStackTrace = trace;
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
