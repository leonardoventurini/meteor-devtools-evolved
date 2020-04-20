import React from 'react';
import { useTracker } from 'meteor/react-meteor-data';

export const App = () => {
  const r1to100 = useTracker(() => {
    const handle = Meteor.subscribe('random1to100');
    return !handle.ready();
  }, []);

  const r101to200 = useTracker(() => {
    const handle = Meteor.subscribe('random101to200');
    return !handle.ready();
  }, []);

  const r201to300 = useTracker(() => {
    const handle = Meteor.subscribe('random201to300');
    return !handle.ready();
  }, []);

  const r301to400 = useTracker(() => {
    const handle = Meteor.subscribe('random301to400');
    return !handle.ready();
  }, []);

  const r401to500 = useTracker(() => {
    const handle = Meteor.subscribe('random401to500');
    return !handle.ready();
  }, []);

  const r501to600 = useTracker(() => {
    const handle = Meteor.subscribe('random501to600');
    return !handle.ready();
  }, []);

  const r601to700 = useTracker(() => {
    const handle = Meteor.subscribe('random601to700');
    return !handle.ready();
  }, []);

  const r701to800 = useTracker(() => {
    const handle = Meteor.subscribe('random701to800');
    return !handle.ready();
  }, []);

  const r801to900 = useTracker(() => {
    const handle = Meteor.subscribe('random801to900');
    return !handle.ready();
  }, []);

  const r901to1000 = useTracker(() => {
    const handle = Meteor.subscribe('random901to1000');
    return !handle.ready();
  }, []);

  return (
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
};
