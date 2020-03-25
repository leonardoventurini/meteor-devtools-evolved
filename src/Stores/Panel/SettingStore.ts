import { action, observable, reaction, toJS } from 'mobx';
import { PanelDatabase } from '@/Database/PanelDatabase';
import { assign, compact, flatten, omit } from 'lodash';
import { FilterCriteria } from '@/Pages/Panel/DDP/FilterConstants';

export class SettingStore implements Settings {
  hydrated: boolean = false;

  @observable repositoryData: GitHubRepository | null = null;

  @observable activeFilterBlacklist: string[] = [];

  @observable activeFilters: FilterTypeMap<boolean> = {
    heartbeat: true,
    subscription: true,
    collection: true,
    method: true,
    connection: true,
  };

  constructor() {
    PanelDatabase.getSettings().then(settings => {
      assign(this, settings);

      setTimeout(() => {
        this.hydrated = true;
      }, 1000);
    });

    reaction(
      () => toJS(this),
      (data: Settings) => {
        if (this.hydrated) {
          PanelDatabase.saveSettings(omit(data, ['hydrated']) as Settings)
            .then(() => {
              console.log('Settings updated.');
            })
            .catch(console.error);
        }
      },
    );
  }

  @action
  setRepositoryData(repositoryData: GitHubRepository) {
    this.repositoryData = repositoryData;
  }

  @action
  updateRepositoryData() {
    fetch(
      'https://api.github.com/repos/leonardoventurini/meteor-devtools-evolved',
    )
      .then(response => response.json())
      .then(data => {
        if (data) {
          this.setRepositoryData(data);
        }
      })
      .catch(console.error);
  }

  @action
  setFilter(type: FilterType, isEnabled: boolean) {
    this.activeFilters[type] = isEnabled;

    this.activeFilterBlacklist = flatten(
      compact(
        Object.entries(this.activeFilters).map(([type, isEnabled]) => {
          return isEnabled ? false : FilterCriteria[type as FilterType];
        }),
      ),
    );
  }
}
