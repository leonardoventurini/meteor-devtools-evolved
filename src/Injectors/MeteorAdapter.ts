import { Registry, sendMessage } from '@/Browser/Inject';
import { getSubscriptions } from '@/Browser/MeteorLibrary';

export const MeteorAdapter = () => {
  Registry.register('ddp-run-method', (message: Message<any>) => {
    const { method, params } = message.data;

    Meteor.call(method, ...params);
  });

  Registry.register('sync-subscriptions', () => {
    sendMessage('sync-subscriptions', {
      subscriptions: getSubscriptions(),
    });
  });

  Registry.register('stats', () => {
    sendMessage('stats', {
      gitCommitHash: Meteor.gitCommitHash,
    });
  });
};
