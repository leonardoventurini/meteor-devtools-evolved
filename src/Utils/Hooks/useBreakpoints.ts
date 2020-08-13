import { useRef } from 'react';
import { useDimensions } from '@/Utils/Hooks/useDimensions';

type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const useBreakpoints = () => {
  const ref = useRef(document.body);

  const { width } = useDimensions(ref, []);

  const breakpoints: { [key in Breakpoint]: boolean } = {
    xs: width <= 360,
    sm: width <= 720,
    md: width <= 1280,
    lg: width <= 1920,
    xl: width > 1920,
  };

  return breakpoints;
};
