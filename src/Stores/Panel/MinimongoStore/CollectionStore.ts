import { Searchable } from '@/Stores/Common/Searchable'
import { makeObservable } from 'mobx'

export class CollectionStore extends Searchable<IDocumentWrapper> {
  constructor() {
    super()
    makeObservable(this)
  }

  filterFunction = (collection: IDocumentWrapper[], search: string) =>
    collection.filter(
      document =>
        !search ||
        JSON.stringify(document).toLowerCase().includes(search.toLowerCase()),
    )
}
