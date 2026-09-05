import { Meteor } from 'meteor/meteor'
import { Accounts } from 'meteor/accounts-base'

const ACCOUNT_LABELS = Object.freeze(['Account A', 'Account B'])

/**
 * Independent local-fixture API: preserve the existing fixture catalog contract.
 * Credentials stay inside Accounts; callers receive only the resulting user ID.
 */
window.__meteorDevtoolsPlaygroundFixture = Object.freeze({
  accountLabels: ACCOUNT_LABELS,
  accountIds: Object.freeze(ACCOUNT_LABELS.map((_, index) => `playground-account-${index + 1}`)),
  login(label) {
    if (!ACCOUNT_LABELS.includes(label)) return Promise.reject(new Error('Choose Account A or Account B'))
    return new Promise((resolve, reject) => {
      Accounts.callLoginMethod({
        methodArguments: [{ playgroundFixtureAccount: label }],
        userCallback(error) {
          if (error) reject(error)
          else resolve(Meteor.userId())
        },
      })
    })
  },
  logout() {
    return new Promise((resolve, reject) => {
      Meteor.logout(error => {
        if (error) reject(error)
        else resolve(null)
      })
    })
  },
})
