import { Searchable } from '@/Stores/Common/Searchable'
import { makeObservable } from 'mobx'

export class SubscriptionStore extends Searchable<IMeteorSubscription> {
  constructor() {
    super()
    makeObservable(this)
  }

  filterFunction = (collection: IMeteorSubscription[], search: string) =>
    collection.filter(
      document =>
        !search ||
        JSON.stringify(document).toLowerCase().includes(search.toLowerCase()),
    )
}
