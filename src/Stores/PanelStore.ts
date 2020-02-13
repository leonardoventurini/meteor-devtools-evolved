import { action, observable } from 'mobx';
import { debounce } from 'lodash';

export class PanelStoreConstructor {
  @observable ddpCount: number = 0;
  @observable ddp: DDPLog[] = [];
  @observable newDdpLogs: number[] = [];

  @action
  pushLog(log: DDPLog) {
    if (log.timestamp) {
      this.newDdpLogs.push(log.timestamp);
    }

    ++this.ddpCount;
    this.ddp.push(log);

    if (this.ddpCount > 100) {
      this.ddp.shift();
    }

    this.clearNewLogs();
  }

  clearNewLogs = debounce(
    action(() => {
      this.newDdpLogs = [];
    }),
    3000,
  );
}

export const PanelStore = new PanelStoreConstructor();
