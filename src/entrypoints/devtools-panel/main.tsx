import { FocusStyleManager } from '@blueprintjs/core'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Panel } from '@/Pages/Panel'
import 'normalize.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import '@/Styles/Tailwind.css'
import '@/Styles/App.scss'

FocusStyleManager.onlyShowFocusOnTabs()

const panelElement = document.querySelector('#panel')

if (!(panelElement instanceof HTMLElement)) {
  throw new TypeError('Meteor DevTools panel root was not found')
}

createRoot(panelElement).render(<Panel />)
