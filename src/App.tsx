import React from 'react';
import { render } from 'react-dom';

import { Panel } from './Pages/Panel';
import { Options } from './Pages/Options';
import { Popup } from './Pages/Popup';

import './$App.scss';
import { FocusStyleManager } from '@blueprintjs/core';

FocusStyleManager.onlyShowFocusOnTabs();

const panelElement = document.getElementById('panel');
const optionsElement = document.getElementById('options');
const popupElement = document.getElementById('popup');

if (panelElement) {
  render(<Panel />, panelElement);
}

if (optionsElement) {
  render(<Options />, optionsElement);
}

if (popupElement) {
  render(<Popup />, popupElement);
}
