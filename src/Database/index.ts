import { Dexie } from 'dexie';

export const Database = new Dexie('MeteorToolsEvolved');

Database.version(1).stores({
  bookmarks: 'timestamp,log',
});
