import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

const browser = process.argv[2]
const outputDirectories = {
  chrome: '.output/chrome-mv3',
  firefox: '.output/firefox-mv2',
}

assert.ok(browser in outputDirectories, 'Expected browser: chrome or firefox')

const projectRoot = path.resolve(import.meta.dirname, '..')
const outputDirectory = path.join(projectRoot, outputDirectories[browser])
const packageJson = JSON.parse(
  readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
)
const manifest = JSON.parse(
  readFileSync(path.join(outputDirectory, 'manifest.json'), 'utf8'),
)

const resolveOutputFile = reference => {
  const normalized = reference.replace(/^\//, '')
  assert.ok(!normalized.includes('..'), `Unsafe output path: ${reference}`)
  return path.join(outputDirectory, normalized)
}

const assertOutputFile = reference => {
  const filename = resolveOutputFile(reference)
  assert.ok(existsSync(filename), `Missing generated file: ${reference}`)
  assert.ok(statSync(filename).size > 0, `Empty generated file: ${reference}`)
}

assert.equal(manifest.version, packageJson.version)
assert.equal(manifest.manifest_version, browser === 'chrome' ? 3 : 2)
assert.deepEqual(manifest.content_scripts[0].matches, [
  'http://*/*',
  'https://*/*',
])
assert.equal(manifest.content_scripts[0].run_at, 'document_start')
assert.equal(manifest.content_scripts[0].all_frames, true)
assert.ok(!('default_popup' in (manifest.action ?? manifest.browser_action)))

for (const icon of Object.values(manifest.icons)) assertOutputFile(icon)
for (const script of manifest.content_scripts[0].js) assertOutputFile(script)
assertOutputFile(manifest.devtools_page)
assertOutputFile(manifest.options_ui.page)
assertOutputFile(
  browser === 'chrome'
    ? manifest.background.service_worker
    : manifest.background.scripts[0],
)

const accessibleResources =
  browser === 'chrome'
    ? manifest.web_accessible_resources.flatMap(entry => entry.resources)
    : manifest.web_accessible_resources

assert.ok(accessibleResources.includes('inject.js'))
for (const resource of accessibleResources) assertOutputFile(resource)

if (browser === 'firefox') {
  assert.equal(
    manifest.browser_specific_settings.gecko.id,
    '{bcb0685a-df42-43b8-969f-7aae4b2b262b}',
  )
  assert.deepEqual(
    manifest.browser_specific_settings.gecko.data_collection_permissions
      .required,
    ['none'],
  )
  assert.deepEqual(manifest.permissions, [
    'storage',
    'https://api.github.com/*',
  ])
}

for (const htmlFile of [
  'devtools.html',
  'devtools-panel.html',
  'options.html',
]) {
  const html = readFileSync(path.join(outputDirectory, htmlFile), 'utf8')
  const localReferences = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)]
    .map(match => match[1])
    .filter(reference => !reference.startsWith('http'))

  assert.ok(localReferences.length > 0, `${htmlFile} has no bundled assets`)
  for (const reference of localReferences) assertOutputFile(reference)
}

const contentScript = readFileSync(
  resolveOutputFile(manifest.content_scripts[0].js[0]),
  'utf8',
)
assert.match(contentScript, /inject\.js/)

console.log(`Validated ${browser} extension in ${outputDirectories[browser]}`)
