import { DEVELOPMENT } from '@/Constants';

export const inDevelopmentOnly = (callback: () => any) => {
  if (DEVELOPMENT) {
    console.trace('DEVELOPMENT ONLY');
    callback();
  }
};
