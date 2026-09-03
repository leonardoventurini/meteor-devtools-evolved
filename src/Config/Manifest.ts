import packageJson from '../../package.json'

export type TargetBrowser = 'chrome' | 'firefox'

const WEB_PAGE_MATCHES = ['http://*/*', 'https://*/*']
const FIREFOX_ADDON_ID = '{bcb0685a-df42-43b8-969f-7aae4b2b262b}'

export const createManifest = (browser: TargetBrowser) => ({
  name: 'Meteor DevTools Evolved',
  description: 'The Meteor framework development tool belt, evolved.',
  version: packageJson.version,
  author: 'Leonardo Venturini',
  icons: {
    16: '/icons/meteor-16.png',
    32: '/icons/meteor-32.png',
    48: '/icons/meteor-48.png',
    128: '/icons/meteor-128.png',
  },
  action: {
    default_title: 'Meteor',
    default_icon: '/icons/meteor-48.png',
  },
  permissions: ['storage'],
  host_permissions: ['https://api.github.com/*'],
  web_accessible_resources: [
    {
      resources: ['inject.js'],
      matches: WEB_PAGE_MATCHES,
    },
  ],
  ...(browser === 'firefox'
    ? {
        browser_specific_settings: {
          gecko: {
            id: FIREFOX_ADDON_ID,
            strict_min_version: '140.0',
            data_collection_permissions: { required: ['none'] },
          },
          gecko_android: { strict_min_version: '142.0' },
        },
      }
    : {}),
})
