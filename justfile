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
    yarn run dev:{{ browser }}

# Start WXT development mode without the Meteor fixture.
watch browser="chrome":
    if [ "{{ browser }}" = "firefox" ]; then yarn wxt -b firefox --mv2; else yarn wxt -b chrome; fi

# Install root and active-fixture dependencies.
setup:
    yarn install
    cd devapp-3.5 && meteor npm install

# Update Meteor in the active development fixture.
update-meteor:
    cd devapp-3.5 && meteor update

# Print the extension version from package.json.
package-version:
    @echo "{{ version }}"

# Build and package one browser extension.
build-for-browser browser:
    mkdir -p releases
    if [ "{{ browser }}" = "firefox" ]; then yarn wxt zip -b firefox --mv2; else yarn wxt zip -b chrome; fi
    cp ".output/meteor-devtools-evolved-{{ version }}-{{ browser }}.zip" releases/
    if [ "{{ browser }}" = "firefox" ]; then cp ".output/meteor-devtools-evolved-{{ version }}-sources.zip" releases/; fi

# Build and package the Chrome and Firefox extensions sequentially.
build:
    just build-for-browser chrome
    just build-for-browser firefox
