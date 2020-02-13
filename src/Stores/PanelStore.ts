import { action, observable } from 'mobx';
import { createContext, useContext } from 'react';

export class PanelStoreConstructor {
  @observable ddpCount: number = 0;
  @observable ddp: MeteorMessage[] = [];

  @action
  pushDdpMessage(log: MeteorMessage) {
    ++this.ddpCount;
    this.ddp.push(log);

    if (this.ddpCount > 100) {
      this.ddp.pop();
    }
  }
}

export const PanelStore = new PanelStoreConstructor();

export const PanelStoreContext = createContext<PanelStoreConstructor>(
  PanelStore,
);

export const PanelStoreProvider = PanelStoreContext.Provider;

export const useStore = (): PanelStoreConstructor =>
  useContext(PanelStoreContext);
