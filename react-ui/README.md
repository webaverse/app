# create-es-react-app

A create-react-app like template demonstrating how far you can get creating progressive web apps (using react) with no build step. It takes advantage of [static and dynamic imports](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) which enables you to break up your app into small reusable ES modules that are compiled for you by the browser at run time.

## Getting Started

To get started, first clone this repo then run the following command in your terminal (from the project root directory) which will open the app in your preferred browser.

```
$ npx servor
```

> Live reload is enabled by default with [servor](https://github.com/lukejacksonn/servor) so when you make changes to your code the browser will reload the tab and your changes will be reflected there.

## Implementation

This project uses a proprietary version of react called [`es-react`](https://github.com/lukejacksonn/es-react) which allows you to import `React` and `ReactDOM` (version 16.8.3) as an es module from within your app and component files.

```js
import { React, ReactDOM } from 'https://unpkg.com/es-react';
```

To use JSX like syntax without a transpilation step you are going to need to use something like [`htm`](https://github.com/developit/htm) by [Jason Miller](https://github.com/developit). The package is available to import directly from [unpkg.com](https://unpkg.com) and can be configured for react like this:

```js
import htm from 'https://unpkg.com/htm?module'
const html = htm.bind(React.createElement)
```

[Code splitting](https://reactjs.org/docs/code-splitting.html) on route is achieved at runtime thanks to `React.lazy` and `React.Suspense` which provides a solid basis for a scalable architecture where only the code that required is actually requested from the server.

```js
const Route = {
  '/': React.lazy(() => import('./routes/home.js')),
  '*': React.lazy(() => import('./routes/notfound.js')),
}

ReactDOM.render(
  html`
    <${React.Suspense} fallback=${html`<div></div>`}>
      <${Route[location.pathname] || Route['*']} />
    <//>
  `,
  document.body
)
```