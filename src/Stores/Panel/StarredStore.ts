import { Paginable } from '../Common/Paginable';
import { action, observable } from 'mobx';
import { PanelDatabase } from '../../Database/PanelDatabase';

export class StarredStore extends Paginable<StarredLog> {
  @observable.shallow starredLogIds: (string | undefined)[] = [];

  @action
  async sync() {
    this.collection = await PanelDatabase.getStarredLogs();
    this.starredLogIds = this.collection.map(
      (starred: StarredLog) => starred.id,
    );
  }

  @action
  async removeStar(log: DDPLog) {
    if (log.timestamp) {
      await PanelDatabase.removeStarredLog(log.id);
      await this.sync();
    }
  }

  @action
  async addStar(log: DDPLog) {
    const starredKey = await PanelDatabase.addStarredLog(log);
    const starred = await PanelDatabase.getStarredLog(starredKey);

    if (starred) {
      this.collection.push(starred);
      this.starredLogIds.push(starred.log.id);
    }
  }
}
