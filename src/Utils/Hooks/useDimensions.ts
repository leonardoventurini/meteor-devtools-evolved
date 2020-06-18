import { RefObject, useEffect, useState } from 'react';
import { useResize } from '@/Utils/Hooks/useResize';

export const useDimensions = (ref: RefObject<HTMLElement>, deps: any[]) => {
  const [dimensions, setDimensions] = useState({
    height: 300,
    width: 300,
  });

  useEffect(() => {
    setDimensions({
      width: ref?.current?.clientWidth ?? 300,
      height: ref?.current?.clientHeight ?? 300,
    });
  }, deps);

  useResize(() => {
    setDimensions({
      width: ref?.current?.clientWidth ?? 300,
      height: ref?.current?.clientHeight ?? 300,
    });
  });

  return dimensions;
};
