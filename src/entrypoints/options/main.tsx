import { FocusStyleManager } from '@blueprintjs/core'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Options } from '@/Pages/Options'
import 'normalize.css'
import '@blueprintjs/core/lib/css/blueprint.css'
import '@blueprintjs/icons/lib/css/blueprint-icons.css'
import './options.scss'

FocusStyleManager.onlyShowFocusOnTabs()

const optionsElement = document.querySelector('#options')

if (!(optionsElement instanceof HTMLElement)) {
  throw new TypeError('Meteor DevTools options root was not found')
}

createRoot(optionsElement).render(<Options />)
