import { Mongo } from 'meteor/mongo'
import { FIXTURE_COLLECTION_NAMES } from './fixture-data'

export * from './fixture-data'

export const Projects = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.projects)
export const Tasks = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.tasks)
export const Events = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.events)
export const Remote = new Mongo.Collection(FIXTURE_COLLECTION_NAMES.remote)
