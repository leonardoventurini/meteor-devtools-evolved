import { isString } from 'lodash';

export namespace StringUtils {
  export const truncate = (str: string, max: number = 40) => {
    return isString(str) && str.length > max
      ? str.slice(0, max).concat('...')
      : str;
  };
}
