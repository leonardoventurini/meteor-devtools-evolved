import { browser } from 'wxt/browser'

const panelTitle = 'Meteor'

browser.devtools.panels.create(panelTitle, '', '/devtools-panel.html')
