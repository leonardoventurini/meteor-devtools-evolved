import { action, observable } from 'mobx';
import { debounce } from 'lodash';

export class PanelStoreConstructor {
  @observable ddpCount: number = 0;
  @observable ddp: DDPLog[] = [];
  @observable newDdpLogs: number[] = [];
  @observable activeLog: DDPLog | null = null;
  @observable canScroll: boolean = true;

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
  setCanScroll(canScroll: boolean) {
    this.canScroll = canScroll;
  }
}

export const PanelStore = new PanelStoreConstructor();
