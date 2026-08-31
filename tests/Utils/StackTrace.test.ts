import { describe, expect, it } from 'vitest'
import {
  collapseStackFrames,
  getCleanStackFrames,
  parseStackTrace,
} from '../../src/Utils/StackTrace'

describe('stack trace utilities', () => {
  it('parses Chrome, Firefox, and unknown frame formats without data loss', () => {
    expect(
      parseStackTrace(`Error: Stack trace
    at saveDocument (http://localhost:2100/app/app.js:42:7)
anonymous@http://localhost:2100/app/client.js:18:3
    at http://localhost:2100/app/main.js:9:2
unrecognized frame`),
    ).toEqual([
      {
        raw: 'at saveDocument (http://localhost:2100/app/app.js:42:7)',
        callee: 'saveDocument',
        url: 'http://localhost:2100/app/app.js',
        line: 42,
        column: 7,
        isInternal: false,
        isApplication: true,
      },
      {
        raw: 'anonymous@http://localhost:2100/app/client.js:18:3',
        callee: 'anonymous',
        url: 'http://localhost:2100/app/client.js',
        line: 18,
        column: 3,
        isInternal: false,
        isApplication: true,
      },
      {
        raw: 'at http://localhost:2100/app/main.js:9:2',
        callee: 'Anonymous',
        url: 'http://localhost:2100/app/main.js',
        line: 9,
        column: 2,
        isInternal: false,
        isApplication: true,
      },
      {
        raw: 'unrecognized frame',
        callee: 'unrecognized frame',
        isInternal: false,
        isApplication: false,
      },
    ])
  })

  it('filters runtime noise and keeps likely application frames', () => {
    const frames = parseStackTrace(`Error: Stack trace
    at Meteor.connection._stream.send (http://localhost:2100/packages/ddp-client.js:1:1)
    at asyncGeneratorStep (http://localhost:2100/app/app.js:2:2)
    at saveDocument (http://localhost:2100/app/app.js:42:7)`)

    expect(getCleanStackFrames(frames)).toEqual([
      expect.objectContaining({
        callee: 'saveDocument',
        isApplication: true,
      }),
    ])
  })

  it('groups repeated frames and retains first-seen ordering', () => {
    const [saveFrame, renderFrame] = parseStackTrace(`
      at saveDocument (http://localhost:2100/app/app.js:42:7)
      at renderForm (http://localhost:2100/app/app.js:80:4)`)

    expect(collapseStackFrames([saveFrame, renderFrame, saveFrame])).toEqual([
      expect.objectContaining({ callee: 'saveDocument', occurrences: 2 }),
      expect.objectContaining({ callee: 'renderForm', occurrences: 1 }),
    ])
  })
})
