import React, { useEffect, useRef, useState } from 'react'
import { useTracker } from 'meteor/react-meteor-data'
import { RandomCollection } from '../api/random'

export const App = () => {
  const [isSpamming, setSpamming] = useState(false)
  const spammerRef = useRef(0)

  const r1to100 = useTracker(() => {
    const handle = Meteor.subscribe('random1to100')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r101to200 = useTracker(() => {
    const handle = Meteor.subscribe('random101to200')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r201to300 = useTracker(() => {
    const handle = Meteor.subscribe('random201to300')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r301to400 = useTracker(() => {
    const handle = Meteor.subscribe('random301to400')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r401to500 = useTracker(() => {
    const handle = Meteor.subscribe('random401to500')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r501to600 = useTracker(() => {
    const handle = Meteor.subscribe('random501to600')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r601to700 = useTracker(() => {
    const handle = Meteor.subscribe('random601to700')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r701to800 = useTracker(() => {
    const handle = Meteor.subscribe('random701to800')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r801to900 = useTracker(() => {
    const handle = Meteor.subscribe('random801to900')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  const r901to1000 = useTracker(() => {
    const handle = Meteor.subscribe('random901to1000')
    return {
      isLoading: !handle.ready(),
      docs: RandomCollection.find({}).fetch(),
    }
  }, [])

  useEffect(() => {
    if (isSpamming && !spammerRef.current) {
      spammerRef.current = setInterval(() => {
        Meteor.call('echo', 'Echo')
      }, 100)
    } else {
      if (spammerRef.current) {
        clearInterval(spammerRef.current)
        spammerRef.current = 0
      }
    }
  }, [isSpamming])

  return (
    <div>
      <h1>Welcome to Meteor!</h1>

      <button
        onClick={() => {
          setSpamming(!isSpamming)
        }}
      >
        {isSpamming ? 'Spam [On]' : 'Spam [Off]'}
      </button>

      <button
        onClick={() => {
          Meteor.call('echo', 'Echo')
        }}
      >
        String
      </button>

      <button
        onClick={() => {
          Meteor.call('echo', {
            echo: 'Parley gun log poop deck salmagundi gibbet prow chandler gaff boatswain. Loaded to the gunwalls Jack Ketch parrel sheet smartly gabion coffer Admiral of the Black interloper carouser. Rutters booty barque galleon pink gun Barbary Coast run a shot across the bow list marooned.',
          })
        }}
      >
        Object
      </button>
    </div>
  )
}
