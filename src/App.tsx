import { FocusStyleManager } from '@blueprintjs/core'
import React from 'react'
import { render } from 'react-dom'
import { Options } from './Pages/Options'
import { Panel } from './Pages/Panel'
import { Popup } from './Pages/Popup'

import './Styles/Tailwind.css'
import './Styles/App.scss'

FocusStyleManager.onlyShowFocusOnTabs()

const panelElement = document.querySelector('#panel')
const optionsElement = document.querySelector('#options')
const popupElement = document.querySelector('#popup')

if (panelElement) render(<Panel />, panelElement)
if (optionsElement) render(<Options />, optionsElement)
if (popupElement) render(<Popup />, popupElement)
