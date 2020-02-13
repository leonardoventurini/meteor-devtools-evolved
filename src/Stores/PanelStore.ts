import { observable } from 'mobx';
import { createContext, useContext } from 'react';

export class PanelStoreConstructor {
  @observable ddp: MeteorMessage[] = [];
}

export const PanelStore = new PanelStoreConstructor();

export const PanelStoreContext = createContext<PanelStoreConstructor>(
  PanelStore,
);

export const PanelStoreProvider = PanelStoreContext.Provider;

export const useStore = (): PanelStoreConstructor =>
  useContext(PanelStoreContext);
