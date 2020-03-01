import { Paginable } from '@/Stores/Common/Paginable';

export class CollectionStore extends Paginable<DocumentWrapper> {
  filterFunction = (collection: DocumentWrapper[], search: string) =>
    collection.filter(
      document =>
        !search ||
        JSON.stringify(document)
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
}
