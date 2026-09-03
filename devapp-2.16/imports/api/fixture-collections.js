import { Mongo } from 'meteor/mongo'
import { FIXTURE_COLLECTION_NAMES } from './fixture-data'

export const FixtureProjects = new Mongo.Collection(
  FIXTURE_COLLECTION_NAMES.projects,
)
export const FixtureTasks = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.tasks)
export const FixtureEvents = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.events)
