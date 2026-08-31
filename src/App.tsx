import { FocusStyleManager } from '@blueprintjs/core'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Options } from './Pages/Options'
import { Panel } from './Pages/Panel'
import { Popup } from './Pages/Popup'

import './Styles/Tailwind.css'
import './Styles/App.scss'

FocusStyleManager.onlyShowFocusOnTabs()

const panelElement = document.querySelector('#panel')
const optionsElement = document.querySelector('#options')
const popupElement = document.querySelector('#popup')

if (panelElement) createRoot(panelElement).render(<Panel />)
if (optionsElement) createRoot(optionsElement).render(<Options />)
if (popupElement) createRoot(popupElement).render(<Popup />)
