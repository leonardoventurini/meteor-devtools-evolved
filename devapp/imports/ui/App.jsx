import React from 'react';

export const App = () => (
  <div>
    <h1>Welcome to Meteor!</h1>

    <button
      onClick={() => {
        Meteor.call('echo', 'Echo');
      }}
    >
      String
    </button>

    <button
      onClick={() => {
        Meteor.call('echo', {
          echo:
            'Parley gun log poop deck salmagundi gibbet prow chandler gaff boatswain. Loaded to the gunwalls Jack Ketch parrel sheet smartly gabion coffer Admiral of the Black interloper carouser. Rutters booty barque galleon pink gun Barbary Coast run a shot across the bow list marooned.',
        });
      }}
    >
      Object
    </button>
  </div>
);
