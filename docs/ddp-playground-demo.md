# Five-minute method replay and access-control demo

Audience: Meteor developers. Target: the existing local `devapp-3.5` fixture
in Chrome. Deliverable: a presenter script; no application changes are needed.

The story is: capture a real method call, edit and replay it, then test whether
the server enforces access rules when the caller changes. Success means the
audience sees an owner request succeed, an anonymous request fail, and a
deliberately permissive fixture request expose the same record.

## Prepare before presenting

1. Follow [contributor setup](../CONTRIBUTING.md#setting-the-environment-up)
   if dependencies or the Meteor toolchain are not installed. Use the pinned
   Node and Yarn versions from the repository; allow setup time before the demo.
2. From the repository root, run `yarn dev:chrome`. Keep that terminal running.
   This starts Meteor 3 and launches a development browser with the extension.
3. Open `http://127.0.0.1:2100` in that browser. Wait for the fixture to report
   ready. Open DevTools, select **Meteor**, and open **DDP** so capture is active.
4. In the inspected app's DevTools **Console**, run:

   ```js
   await window.__meteorDevtoolsPlaygroundFixture.login('Account A')
   ```

   Expect `playground-account-1`. These passwordless accounts exist only in the
   development fixture. Do not use the extension page's console.

5. Rehearse the sequence below once, then reload the inspected page, reopen the
   Meteor panel, and repeat the login. The demonstration methods below do not
   mutate fixture records. Saved snapshots survive reloads; remove only your
   rehearsal snapshots if you want an uncluttered comparison list.

Keep these three parameter arrays ready to paste:

| Scenario                           | Parameters                        | Expected result                                                    |
| ---------------------------------- | --------------------------------- | ------------------------------------------------------------------ |
| Owner, application session         | `["playground-account-1", true]`  | Success; `viewedBy` is `playground-account-1`                      |
| Anonymous, enforced access         | `["playground-account-1", true]`  | Error code `playground-forbidden`                                  |
| Anonymous, deliberately permissive | `["playground-account-1", false]` | Success; `ownerId` is `playground-account-1`, `viewedBy` is `null` |

## 0:00–0:45 — Capture a real request

Say: “DDP logs show what the app sent. The Playground lets us turn that request
into an editable test, with an explicit choice of connection and session.”

In the app's Console, run:

```js
await Meteor.callAsync('playground.access', 'playground-account-1', true)
```

Return to **Meteor → DDP**, search for `playground.access`, and hover the outbound
method entry. Click its edit icon (accessible name/tooltip:
**Edit in DDP Playground**).

Point out that this opens a draft: it has not dispatched another request.

## 0:45–1:40 — Replay as the owner

In the **Run** tab's **Request editor**, expand **Execution settings** and confirm:

- **Target connection**: the app's primary connection, with ID `default`.
- **Operation**: **Method**.
- **Method or publication name**: `playground.access`.
- **Parameters (encoded EJSON array)**: `["playground-account-1", true]`.
- **Execution mode**: **Application connection · current session**.
- **Session label**: `Owner baseline`.

Click **Run method**. In **Runs and results**, show the **Response** and
the returned `ownerId`, `value`, and `viewedBy`. Point out **Server result** and
**writes reflected** as separate signals.

Say: “This uses Account A's current application connection. The parameters are
EJSON data, not JavaScript. A session label is just a note; it does not log us in.”

## 1:40–2:40 — Test anonymous access

Keep the method and parameters unchanged. In **Execution settings**, set:

- **Execution mode**: **Fresh isolated connection**.
- **Isolated authentication**: **Anonymous**.
- **Session label**: `Anonymous denied`.

Click **Run method**. Show the error code `playground-forbidden` in the evidence.
Click **Review snapshot to save**, inspect the preview, then click
**Confirm reviewed snapshot save**.

Say: “The app is still logged in, but this fresh connection is anonymous. The
server correctly rejects access to Account A's record.”

## 2:40–3:40 — Reveal the deliberate access-control flaw

Keep isolated anonymous execution. Change only the parameters and label:

- **Parameters (encoded EJSON array)**: `["playground-account-1", false]`.
- **Session label**: `Anonymous permissive`.

Click **Run method**. Show the successful response containing Account A's record
with `viewedBy: null`. Save this run using the same reviewed snapshot flow.

Say: “This fixture intentionally accepts a client-controlled flag that disables
its owner check. An anonymous caller can retrieve another user's record. The
lesson is that access rules must be enforced by the server independently of
client input. This is a planted fixture flaw, not an automatic vulnerability
verdict from the extension.”

## 3:40–4:35 — Compare the evidence

Open **Compare**. Find **Baseline snapshot** and choose `Anonymous denied`. In **Comparison
snapshot**, choose `Anonymous permissive`. Show the **Structured comparison**:
the error evidence has been replaced by returned record data. Return to **Run**
and expand **Run details → Exact submitted request and context** for the selected
run to show what was sent.

Say: “These snapshots preserve the observations. We changed one argument while
keeping the caller anonymous, so we can explain why the behavior changed.”

If comparison navigation takes too long, use **Run → Run history** to switch between
the two labeled runs and show their evidence directly.

## 4:35–5:00 — Close

Say: “Capture, edit, run, and compare. Use this to reproduce bugs and check your
application's access rules. Cases, expectations, parameter matrices, and reviewed
exports extend the same workflow when you need repeatable tests.”

Add: “Stopping local waiting does not undo a method already dispatched.”

Keep publications, matrices, cross-profile transfers, and session reuse out of
this five-minute walkthrough; see the [usage guide](ddp-playground.md) for those.

## Recovery and rehearsal checklist

- Missing captured call: confirm the Meteor panel was open before dispatch,
  select the primary connection, and repeat the Console call. If needed, open
  **Playground** and enter the owner request manually; explain that this skips
  the capture-to-draft step.
- Run disabled or stale target: reload the inspected app, wait for readiness,
  repeat login, then select the live `default` target in the editor.
- Owner request denied: repeat the Account A login and verify application mode.
- Anonymous request unexpectedly succeeds: verify the second parameter is
  `true`, and verify both isolated mode and anonymous authentication.
- Slow startup: finish startup before presenting; do not spend the live demo
  installing packages or waiting for Meteor compilation.
- Afterward: optionally log out with
  `await window.__meteorDevtoolsPlaygroundFixture.logout()` in the app Console,
  and stop the development terminal with Ctrl+C.

Before presenting, check all three results in the table, confirm opening a draft
does not execute it, and practice selecting the two saved snapshots within five
minutes. The script was checked against the fixture implementation, UI labels,
and existing browser-test scenarios; that source review is not a live rehearsal.
