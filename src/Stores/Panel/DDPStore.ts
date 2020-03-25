import { debounce } from 'lodash';
import { computed, observable } from 'mobx';
import { Paginable } from '../Common/Paginable';
import { PanelStore } from '@/Stores/PanelStore';

export class DDPStore extends Paginable<DDPLog> {
  @observable inboundBytes: number = 0;
  @observable outboundBytes: number = 0;

  @observable newLogs: string[] = [];

  @observable isLoading: boolean = false;

  bufferCallback = (buffer: DDPLog[]) => {
    this.newLogs.push(...buffer.map(({ id }) => id));

    this.inboundBytes += buffer
      .filter(log => log.isInbound)
      .reduce((sum, log) => sum + (log.size ?? 0), 0);

    this.outboundBytes += buffer
      .filter(log => log.isOutbound)
      .reduce((sum, log) => sum + (log.size ?? 0), 0);

    this.clearNewLogs();
  };

  clearNewLogs = debounce(() => {
    this.newLogs = [];
  }, 1000);

  filterFunction = (collection: DDPLog[], search: string) =>
    collection
      .filter(log => !this.filterRegularExpression.test(log.content))
      .filter(
        log =>
          !search ||
          log.content
            .toLowerCase()
            .concat(log.hash ?? '')
            .includes(search.toLowerCase()),
      );

  @computed
  get filterRegularExpression() {
    return new RegExp(
      `"msg":"(${PanelStore.settingStore.activeFilterBlacklist.join('|')})"`,
    );
  }
}
