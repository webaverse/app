import { React, ReactDOM } from 'https://unpkg.com/es-react@16.8.30/index.js';
import htm from 'https://unpkg.com/htm@2.1.1/dist/htm.mjs'
import csz from 'https://unpkg.com/csz@0.1.2/index.js'
import NavBar from './components/NavBar.js';

window.React = React
window.css = csz
window.html = htm.bind(React.createElement)

const Route = {
  '/': React.lazy(() => import('./pages/Profile.js')),
  '/profile': React.lazy(() => import('./pages/Profile.js')),
  '/settings': React.lazy(() => import('./pages/Settings.js')),
  '/gallery': React.lazy(() => import('./pages/Gallery.js')),
  '/creators': React.lazy(() => import('./pages/Creators.js')),
  '/mint': React.lazy(() => import('./pages/Mint.js')),
  '*': React.lazy(() => import('./pages/NotFound.js')),
}

ReactDOM.render(
  html`
    <${React.Suspense} fallback=${html`<div></div>`}>
      <${NavBar} />
      <${Route[location.pathname] || Route['*']} />
    <//>
  `,
  document.body
)
