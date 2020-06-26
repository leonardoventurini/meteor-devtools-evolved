import { isString, memoize } from 'lodash';

export namespace StringUtils {
  export const truncate = (str: string, max: number = 40) => {
    return isString(str) && str.length > max
      ? str.slice(0, max).concat('...')
      : str;
  };

  /**
   * Five levels of brightness from 1 to 5.
   *
   * @param brightness
   */
  export const getRandomColor = (brightness: number) => {
    if (brightness < 1 || brightness > 5)
      throw new Error(
        'Only five brightness levels, from 1 to 5, are acceptable.',
      );

    const variance = 255 / 5;

    const getByte = () =>
      Math.round(variance * (brightness - 1) + Math.random() * variance);

    const rgb = [0, 0, 0].map(getByte).join(',');

    return `rgb(${rgb})`;
  };

  export const toClipboard = (
    data: string,
    mimeType: string = 'text/plain',
  ) => {
    document.oncopy = function(event: ClipboardEvent) {
      event.clipboardData?.setData(mimeType, data);
      event.preventDefault();
    };
    document.execCommand('copy', false);
  };

  export const getSize = memoize((content: string) => new Blob([content]).size);
}
