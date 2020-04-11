import { Searchable } from '@/Stores/Common/Searchable';

export class CollectionStore extends Searchable<DocumentWrapper> {
  filterFunction = (collection: DocumentWrapper[], search: string) =>
    collection.filter(
      document =>
        !search ||
        JSON.stringify(document)
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
}
