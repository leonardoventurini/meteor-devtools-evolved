
<div align="right">
  <details>
    <summary >🌐 Language</summary>
    <div>
      <div align="center">
        <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=en">English</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=zh-CN">简体中文</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=zh-TW">繁體中文</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=ja">日本語</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=ko">한국어</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=hi">हिन्दी</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=th">ไทย</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=fr">Français</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=de">Deutsch</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=es">Español</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=it">Italiano</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=ru">Русский</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=pt">Português</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=nl">Nederlands</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=pl">Polski</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=ar">العربية</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=fa">فارسی</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=tr">Türkçe</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=vi">Tiếng Việt</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=id">Bahasa Indonesia</a>
        | <a href="https://openaitx.github.io/view.html?user=leonardoventurini&project=meteor-devtools-evolved&lang=as">অসমীয়া</
      </div>
    </div>
  </details>
</div>

<div align="center">

<img src="https://media.giphy.com/media/Pt2yOXUALOhpB5dpiM/giphy.gif" alt="Meteor Devtool Evolved Gif" />

<p style="font-size: 30px">
Meteor Devtools Extension
</p>
Behold, the evolution of Meteor DevTools.</p>

Meteor Devtools Evolved is currently available for Google Chrome and Mozilla Firefox.

</div>

<p align="center" >
    <a href="https://chrome.google.com/webstore/detail/meteor-devtools-evolved/ibniinmoafhgbifjojidlagmggecmpgf">
    <img width="120" src="https://img.shields.io/badge/%20-Chrome-orange?logo=google-chrome&logoColor=white" alt="Download for Chrome" />
    </a>
    <a href="https://addons.mozilla.org/en-US/firefox/addon/meteor-devtools-evolved/">
    <img width="110" src="https://img.shields.io/badge/%20-Firefox-red?logo=mozilla&logoColor=white" alt="Download for Firefox" />
    </a>
</p>

[Harder, Better, Faster, Stronger](https://www.youtube.com/watch?v=gAjR4_CbPpQ) :rocket:

Are you beginning with Meteor? Do you want to get a sense of "what is going on" or even to optimize your Meteor app? This is the tool for you.

:point_right: [Changelog](CHANGELOG.md)

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

> Anyone is welcome to contribute, more info [here](CONTRIBUTING.md).

## Firefox

The Firefox port of the extension was a contribution made by [@nilooy](https://github.com/nilooy). Thank you!
