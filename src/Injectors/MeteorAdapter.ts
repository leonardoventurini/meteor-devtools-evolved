import { Registry } from '@/Browser/Inject';

export const MeteorAdapter = () => {
  Registry.register('ddp-run-method', (message: Message<any>) => {
    const { method, params } = message.data;

    Meteor.call(method, ...params);
  });
};
