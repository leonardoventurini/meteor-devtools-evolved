import assert from 'assert'

describe('devapp-3.5', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json')
    assert.strictEqual(name, 'devapp-3.5')
  })

  it('runs on the maintained Meteor 3 release', function () {
    assert.strictEqual(Meteor.release, 'METEOR@3.5.1')
  })

  if (Meteor.isClient) {
    it('client is not server', function () {
      assert.strictEqual(Meteor.isServer, false)
    })
  }

  if (Meteor.isServer) {
    it('server is not client', function () {
      assert.strictEqual(Meteor.isClient, false)
    })
  }
})
