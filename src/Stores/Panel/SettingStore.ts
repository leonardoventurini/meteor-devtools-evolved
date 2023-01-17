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

  @observable repositoryData: IGitHubRepository | null = null

  @observable activeFilterBlacklist: string[] = []

  @observable activeFilters: FilterTypeMap<boolean> = {
    heartbeat: true,
    subscription: true,
    collection: true,
    method: true,
    connection: true,
  }

  constructor() {
    makeObservable(this)

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
              // eslint-disable-next-line no-console
              console.log('Settings updated.')
            })
            // eslint-disable-next-line no-console
            .catch(console.error)
        }
      },
    )
  }

  @action
  setRepositoryData(repositoryData: IGitHubRepository) {
    this.repositoryData = repositoryData
  }

  @action
  updateRepositoryData() {
    fetch(
      'https://api.github.com/repos/leonardoventurini/meteor-devtools-evolved',
    )
      .then(response => response.json())
      .then(data => {
        if (data) {
          if (!data.stargazers_count || !data.open_issues_count) {
            // eslint-disable-next-line no-console
            console.log('Not updating repository data', data)
            return
          }

          runInAction(() => {
            this.setRepositoryData(data)
          })
        }
      })
      // eslint-disable-next-line no-console
      .catch(console.error)
  }

  @action
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
