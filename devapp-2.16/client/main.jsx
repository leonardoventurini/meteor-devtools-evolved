import React from 'react'
import { Meteor } from 'meteor/meteor'
import { render } from 'react-dom'
import { App } from '../imports/ui/App'
import './local-collections'
import './additional-connection'
import './fixture-contract'

import '../imports/api/links'
import '../imports/api/random'
import '../imports/api/fixture-collections'

Meteor.startup(() => {
  render(<App />, document.getElementById('react-target'))
})
