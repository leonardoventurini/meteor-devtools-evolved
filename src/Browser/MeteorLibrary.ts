import { getCircularReplacer } from '@/Browser/Utils';

export const getSubscriptions = () =>
  JSON.stringify(Meteor?.connection?._subscriptions, getCircularReplacer());
