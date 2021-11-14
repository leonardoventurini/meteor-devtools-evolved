Package.describe({
  summary: "Meteor's client-side datastore: a port of MongoDB to Javascript",
  version: '1.7.0',
})

Package.onUse(api => {
  api.export('LocalCollection')
  api.export('Minimongo')

  api.export('MinimongoTest', { testOnly: true })
  api.export('MinimongoError', { testOnly: true })

  api.use([
    'diff-sequence',
    'ecmascript',
    'ejson',
    'geojson-utils',
    'id-map',
    'mongo-id',
    'ordered-dict',
    'random',
    'tracker',
    'typescript',
  ])

  // Make weak use of Decimal type on client
  api.use('mongo-decimal', 'client', { weak: true })
  api.use('mongo-decimal', 'server')

  api.mainModule('minimongo_client.js', 'client')
  api.mainModule('minimongo_server.js', 'server')
})

Package.onTest(api => {
  api.use([
    'minimongo',
    'ecmascript',
    'ejson',
    'mongo-id',
    'ordered-dict',
    'random',
    'reactive-var',
    'test-helpers',
    'tinytest',
    'tracker',
    'typescript',
  ])

  api.addFiles('minimongo_tests.js')
  api.addFiles('minimongo_tests_client.js', 'client')
  api.addFiles('minimongo_tests_server.js', 'server')
})
