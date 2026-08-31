set shell := ["bash", "-eu", "-o", "pipefail", "-c"]

version := `node -p "require('./package.json').version"`

# List available recipes.
default:
    @just --list

# Run an npm command through Meteor.
mpm *args:
    meteor npm {{ args }}

# Start the active Meteor development fixture.
start:
    yarn devapp

# Start an extension watcher and the Meteor fixture (browser defaults to Chrome).
develop browser="chrome":
    @echo "Starting development mode for => {{ browser }}"
    yarn concurrently -n ext,app "webpack --config webpack/{{ browser }}.dev.js" "cd devapp-3.4 && npm start"

# Watch an extension build (browser defaults to Chrome).
watch browser="chrome":
    yarn webpack --config webpack/{{ browser }}.dev.js

# Install root and active-fixture dependencies.
setup:
    yarn install
    npm install --prefix devapp-3.4

# Update Meteor in the active development fixture.
update-meteor:
    cd devapp-3.4 && meteor update

# Print the extension version from package.json.
package-version:
    @echo "{{ version }}"

# Build and package one browser extension.
build-for-browser browser:
    mkdir -p releases
    yarn run build:{{ browser }}
    cd extension/{{ browser }} && zip -r "../../releases/meteor-devtools-evolved-{{ version }}.{{ browser }}.zip" -- *

# Build and package the Chrome and Firefox extensions sequentially.
build:
    just build-for-browser chrome
    just build-for-browser firefox
