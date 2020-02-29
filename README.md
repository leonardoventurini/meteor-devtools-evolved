Behold, the evolution of Meteor DevTools.

[Harder, Better, Faster, Stronger](https://www.youtube.com/watch?v=gAjR4_CbPpQ) :rocket:

Are you beginning with Meteor? Do you want to get a sense of "what is going on" or even to optimize your Meteor app? This is the tool for you.

### Distributed Data Protocol (DDP)

Everything you need to track and understand what is going on under the hood of your Meteor application. The extension allows you to filter and search for any DDP message, being able to handle thousands and thousands of messages without a hiccup.

### Bookmarks

The DDP inspection is ephemeral, but you can save as many DDP messages you want for later search and retrieval, from any host. Be careful though, it is saved on IndexedDB.

### Minimongo

You don't know what data belongs to where? You can rapidly search for anything in your Minimongo data and easily visualize the documents with our blazing fast custom-made Object Treerinator.

---

## Development

> DISCLAIMER: This work is based in part on the [Meteor DevTools](https://github.com/bakery/meteor-devtools) extension by The Bakery. Which sadly is not maintained anymore. While it is not necessarily a fork, I did use some useful knowledge and architectural decisions, and some things naturally converged into the same most practical solution. Hence the "evolved".

The extension is almost entirely written in TypeScript, while some Chrome specific code being left out for practical reasons. It uses MobX to manage state, and SASS its styles. We also use components from the [Blueprint](https://github.com/palantir/blueprint) library by Palantir. Everything is glued together with Webpack.
