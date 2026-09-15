# Privacy Policy for Meteor DevTools Evolved

Meteor DevTools Evolved is a browser extension for inspecting and testing Meteor
applications. It handles data from the application you choose to inspect so it
can show DDP traffic, subscriptions, Minimongo documents, and Playground
results. That data can include personal information or secrets supplied by the
application or entered into a Playground request.

The extension does not collect analytics, sell user data, or send inspected
application data to its developer.

## Data handled and stored locally

- DDP traffic, application responses, Minimongo snapshots, and Playground
  inspection history are shown in the DevTools panel. Recent traffic is kept in
  memory for inspection.
- Bookmarked DDP messages are saved in the browser's local IndexedDB storage.
  Playground cases and snapshots are saved in a separate local IndexedDB
  database when you choose to save them.
- Panel settings, the DDP startup-history preference, Minimongo query drafts,
  and display preferences are saved in local browser or extension storage so
  they persist between sessions. The `storage` permission is used for the DDP
  startup-history preference.
- Session-reuse credentials used internally by Playground remain in the
  inspected page and are excluded from ordinary capture and persistence.
  Manually entered request data and captured application responses may still
  contain secrets. Review the available redaction controls before saving or
  exporting records.

Saved records and preferences remain on your device until you delete them or
clear the extension's browser data. You can remove individual bookmarks,
Playground cases, and snapshots in the extension. Exported files are created
only when you choose to export them; after export, you control where those files
go.

## Network requests and sharing

When you press **Run** in Playground, the extension sends the request you entered
to the selected Meteor application's server. The application server handles
that request under its own privacy and security practices. The extension does
not send that request to its developer.

The extension requests public repository metadata from the GitHub API for its
repository information display. It does not include inspected application data
in that request. Links opened from the extension go to the sites you choose to
visit.

The extension has no developer-operated service that receives your inspected
application data, bookmarks, saved cases, snapshots, or preferences.

## Questions and updates

For questions about this policy, contact the developer through the [project
repository](https://github.com/leonardoventurini/meteor-devtools-evolved). Do
not include sensitive application data in a public issue.

This policy will be updated when the extension's data handling changes.
