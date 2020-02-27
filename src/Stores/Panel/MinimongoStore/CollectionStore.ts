import { Paginable } from '@/Stores/Common/Paginable';

export class CollectionStore extends Paginable<Document> {
  filterFunction = (collection: Document[], search: string) =>
    collection.filter(
      document =>
        !search ||
        JSON.stringify(document)
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
}
