import React from 'react'
import { Meteor } from 'meteor/meteor'
import { render } from 'react-dom'
import { App } from '../imports/ui/App'

import '../imports/api/links'
import '../imports/api/random'

Meteor.startup(() => {
  render(<App />, document.getElementById('react-target'))
})
