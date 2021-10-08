import { FocusStyleManager } from '@blueprintjs/core'
import React from 'react'
import { render } from 'react-dom'
import { Options } from './Pages/Options'
import { Panel } from './Pages/Panel'
import { Popup } from './Pages/Popup'

import './Styles/App.scss'

FocusStyleManager.onlyShowFocusOnTabs()

const panelElement = document.getElementById('panel')
const optionsElement = document.getElementById('options')
const popupElement = document.getElementById('popup')

panelElement && render(<Panel />, panelElement)
optionsElement && render(<Options />, optionsElement)
popupElement && render(<Popup />, popupElement)
