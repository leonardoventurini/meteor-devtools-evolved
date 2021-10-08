import { css, FlattenSimpleInterpolation } from 'styled-components'
import { mapValues } from 'lodash'

type BreakpointLabel = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export const Breakpoints: Record<BreakpointLabel, number> = {
  xs: 0,
  sm: 600,
  md: 960,
  lg: 1280,
  xl: 1920,
}

export const respond = mapValues(
  Breakpoints,
  (value: number) => (content: FlattenSimpleInterpolation) =>
    css`
      @media (min-width: ${value}px) {
        ${content};
      }
    `,
)
