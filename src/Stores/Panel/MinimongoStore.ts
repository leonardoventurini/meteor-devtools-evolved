import { action, observable } from 'mobx';

interface Document {
  _id: string;
  [key: string]: any;
}

interface Collections {
  [key: string]: Document[];
}

export class MinimongoStore {
  @observable collections: Collections = {};

  @action
  setCollections(collections: Collections) {
    this.collections = collections;
  }
}
