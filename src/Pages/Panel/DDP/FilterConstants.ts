export const FilterCriteria: FilterTypeMap = {
  heartbeat: ['ping', 'pong'],
  subscription: ['sub', 'unsub', 'nosub', 'ready'],
  collection: ['added', 'removed', 'changed'],
  method: ['method', 'result', 'updated'],
  connection: ['connect', 'connected', 'failed'],
};
