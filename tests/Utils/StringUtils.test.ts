import { describe, expect, it } from 'vitest'

import { StringUtils } from '../../src/Utils/StringUtils'

describe('StringUtils', () => {
  it('truncates text only when it exceeds the maximum length', () => {
    expect(StringUtils.truncate('Meteor', 6)).toBe('Meteor')
    expect(StringUtils.truncate('Meteor DevTools', 6)).toBe('Meteor...')
  })

  it('prefixes CSS classes consistently', () => {
    expect(StringUtils.getPrefixedClass('panel')).toBe('mde-panel')
  })
})
