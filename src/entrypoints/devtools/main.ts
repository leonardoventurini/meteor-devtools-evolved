import { browser } from 'wxt/browser'

const panelTitle = `${import.meta.env.FIREFOX ? '' : '☄️'} Meteor`

browser.devtools.panels.create(panelTitle, '', '/devtools-panel.html')
