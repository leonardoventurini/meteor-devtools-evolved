import { getCircularReplacer } from '@/Browser/Utils';
import mapValues from 'lodash/mapValues';
import omit from 'lodash/omit';

export const getSubscriptions = () => {
  const payload = mapValues(
    Meteor?.connection?._subscriptions ?? {},
    (value: any) => omit(value, ['connection']),
  );

  return JSON.stringify(payload, getCircularReplacer());
};
