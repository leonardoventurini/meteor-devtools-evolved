import { Searchable } from '@/Stores/Common/Searchable'
import { computed, makeObservable } from 'mobx'
import { PanelStore } from '@/Stores/PanelStore'

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

  @computed
  get subsWithMeta() {
    return this.filtered.map(sub => ({
      ...sub,
      ...PanelStore.ddpStore.getSubscriptionMeta(sub),
    }))
  }
}
