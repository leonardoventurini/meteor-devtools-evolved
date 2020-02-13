import { action, observable } from 'mobx';
import { createContext, useContext } from 'react';
import { debounce } from 'lodash';

export class PanelStoreConstructor {
  @observable ddpCount: number = 0;
  @observable ddp: MeteorMessage[] = [];
  @observable newDdpLogs: number[] = [];

  @action
  pushDdpMessage(log: MeteorMessage) {
    const { timestamp } = log;

    timestamp && this.pushNewLog(timestamp);

    ++this.ddpCount;
    this.ddp.push(log);

    if (this.ddpCount > 100) {
      this.ddp.shift();
    }

    this.clearNewLogs();
  }

  @action
  pushNewLog(timestamp: number) {
    this.newDdpLogs.push(timestamp);
  }

  clearNewLogs = debounce(
    action(() => {
      this.newDdpLogs = [];
    }),
    3000,
  );
}

export const PanelStore = new PanelStoreConstructor();

export const PanelStoreContext = createContext<PanelStoreConstructor>(
  PanelStore,
);

export const PanelStoreProvider = PanelStoreContext.Provider;

export const useStore = (): PanelStoreConstructor =>
  useContext(PanelStoreContext);
