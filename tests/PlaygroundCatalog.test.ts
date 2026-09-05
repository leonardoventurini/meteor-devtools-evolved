import { describe, expect, it } from 'vitest'
import { EndpointCatalog } from '../src/Playground/Catalog'
const observation = (name = 'method') => ({
  pageEpoch: 'page',
  connectionId: 'connection',
  kind: 'method' as const,
  name,
  parameters: [1],
  provenance: 'application' as const,
})
describe('observed endpoint catalog', () => {
  it('separates pages, connections, kinds and provenance', () => {
    const catalog = new EndpointCatalog()
    catalog.observe(observation())
    catalog.observe({ ...observation(), provenance: 'playground' })
    catalog.observe({ ...observation(), kind: 'subscription' })
    catalog.observe({ ...observation(), connectionId: 'other' })
    expect(catalog.entries('page', 'connection')).toHaveLength(2)
    expect(catalog.entries('other-page', 'connection')).toHaveLength(0)
    expect(catalog.entries('page', 'connection')[0]).toMatchObject({
      applicationCount: 1,
      playgroundCount: 1,
      count: 2,
    })
  })
  it('keeps three recent distinct examples and does not retain caller mutations', () => {
    const catalog = new EndpointCatalog()
    for (let index = 0; index < 5; index++)
      catalog.observe({ ...observation(), parameters: [index] })
    catalog.observe({ ...observation(), parameters: [3] })
    const entries = catalog.entries('page', 'connection')
    expect(entries[0]!.examples.map(example => example.parameters)).toEqual([
      [3],
      [4],
      [2],
    ])
    entries[0]!.examples[0]!.parameters.push(100)
    expect(
      catalog.entries('page', 'connection')[0]!.examples[0]!.parameters,
    ).toEqual([3])
  })
  it('evicts least recently observed names per connection', () => {
    const catalog = new EndpointCatalog()
    for (let index = 0; index < 500; index++)
      catalog.observe(observation(`method${index}`))
    catalog.observe(observation('method0'))
    catalog.observe(observation('method500'))
    const names = catalog.entries('page', 'connection').map(entry => entry.name)
    expect(names).toHaveLength(500)
    expect(names).toContain('method0')
    expect(names).not.toContain('method1')
  })
  it('excludes internal operations and bounds individual samples', () => {
    const catalog = new EndpointCatalog()
    catalog.observe({ ...observation('login'), internal: true })
    catalog.observe({ ...observation(), parameters: ['x'.repeat(4096)] })
    expect(catalog.entries('page', 'connection')).toHaveLength(1)
    expect(catalog.entries('page', 'connection')[0]).toMatchObject({
      count: 1,
      examples: [],
      examplesOmitted: 1,
    })
  })
  it('clears only the explicitly selected scope', () => {
    const catalog = new EndpointCatalog()
    catalog.observe(observation())
    catalog.observe({ ...observation(), connectionId: 'other' })
    catalog.clear('page', 'connection')
    expect(catalog.entries('page', 'connection')).toEqual([])
    expect(catalog.entries('page', 'other')).toHaveLength(1)
    catalog.clear()
    expect(catalog.entries('page', 'other')).toEqual([])
  })
})
