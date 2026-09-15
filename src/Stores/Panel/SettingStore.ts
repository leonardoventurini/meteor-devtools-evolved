import {
  action,
  makeObservable,
  observable,
  reaction,
  runInAction,
  toJS,
} from 'mobx'
import { PanelDatabase } from '@/Database/PanelDatabase'
import { FilterCriteria } from '@/Pages/Panel/DDP/FilterConstants'
import { compact, flatten, omit } from '@/Utils/Objects'

export class SettingStore implements ISettings {
  hydrated = false

  // Preserve the shape of settings saved by earlier versions; this cache is no longer used.
  repositoryData: IGitHubRepository | null = null

  activeFilterBlacklist: string[] = []

  activeFilters: FilterTypeMap<boolean> = {
    heartbeat: true,
    subscription: true,
    collection: true,
    method: true,
    connection: true,
  }

  constructor() {
    makeObservable(this, {
      activeFilterBlacklist: observable,
      activeFilters: observable,
      setFilter: action,
    })

    PanelDatabase.getSettings().then(settings => {
      runInAction(() => {
        Object.assign(this, settings)
      })

      setTimeout(() => {
        runInAction(() => {
          this.hydrated = true
        })
      }, 1000)
    })

    reaction(
      () => toJS(this),
      (data: ISettings) => {
        if (this.hydrated) {
          PanelDatabase.saveSettings(omit(data, ['hydrated']) as ISettings)
            .then(() => {
              console.log('Settings updated.')
            })

            .catch(console.error)
        }
      },
    )
  }

  setFilter(type: FilterType, isEnabled: boolean) {
    this.activeFilters[type] = isEnabled

    this.activeFilterBlacklist = flatten(
      compact(
        Object.entries(this.activeFilters).map(([type, isEnabled]) => {
          return isEnabled ? false : FilterCriteria[type as FilterType]
        }),
      ),
    )
  }
}
