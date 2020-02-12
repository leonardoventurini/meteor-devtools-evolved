import React from 'react';
import { render } from 'react-dom';

import { Panel } from './_Panel';
import { Options } from './_Options';
import { Popup } from './_Popup';

import './Style.scss';

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
