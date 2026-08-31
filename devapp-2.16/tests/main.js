import assert from 'assert'

describe('devapp-2.16', function () {
  it('package.json has correct name', async function () {
    const { name } = await import('../package.json')
    assert.strictEqual(name, 'devapp-2.16')
  })

  it('runs on the maintained Meteor 2 release', function () {
    assert.strictEqual(Meteor.release, 'METEOR@2.16')
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
