import React, { createContext, FunctionComponent } from 'react';
import { action, observable } from 'mobx';
import { DDPStore } from './Panel/DDPStore';
import { StarredStore } from './Panel/StarredStore';

export class PanelStoreConstructor {
  @observable activeLog: DDPLog | null = null;
  @observable.shallow activeStackTrace: StackTrace[] | null = null;

  ddpStore = new DDPStore();
  starredStore = new StarredStore();

  constructor() {
    this.starredStore.sync().catch(console.error);
  }

  @action
  setActiveLog(log: DDPLog | null) {
    this.activeLog = log;
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
