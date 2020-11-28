import { React, ReactDOM } from './web_modules/es-react.js'
import htm from './web_modules/htm.js'
import NavBar from './components/NavBar.js';

window.React = React
window.html = htm.bind(React.createElement)

const Route = {
  '/': React.lazy(() => import('./components/Profile.js')),
  '/profile': React.lazy(() => import('./pages/MyProfile.js')),
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
