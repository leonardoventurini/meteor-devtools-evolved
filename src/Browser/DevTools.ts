import browser from 'webextension-polyfill'
import { checkFirefoxBrowser } from '@/Utils'

const isFirefox = checkFirefoxBrowser()

browser.devtools.panels.create(
  `${isFirefox ? '' : '☄️'} Meteor`,
  '',
  'devtools-panel.html',
)
