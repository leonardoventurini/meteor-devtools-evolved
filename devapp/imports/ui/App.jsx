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
        Meteor.call('echo', { echo: 'echo' });
      }}
    >
      Object
    </button>
  </div>
);
