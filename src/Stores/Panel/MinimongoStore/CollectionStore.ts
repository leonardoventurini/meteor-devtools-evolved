import { Searchable } from '@/Stores/Common/Searchable'

export class CollectionStore extends Searchable<IDocumentWrapper> {
  constructor() {
    super()
  }

  filterFunction = (collection: IDocumentWrapper[], search: string) =>
    collection.filter(
      document =>
        !search ||
        JSON.stringify(document).toLowerCase().includes(search.toLowerCase()),
    )
}
