import { Searchable } from '@/Stores/Common/Searchable';

export class SubscriptionStore extends Searchable<IMeteorSubscription> {
  filterFunction = (collection: IMeteorSubscription[], search: string) =>
    collection.filter(
      document =>
        !search ||
        JSON.stringify(document)
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
}
