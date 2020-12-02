import { React, ReactDOM } from 'https://unpkg.com/es-react@16.13.1/dev';
import Router, { Route } from './web_modules/react-es-router.js';
import htm from './web_modules/htm.js'
import NavBar from './components/NavBar.js';
import MyProfile from './pages/MyProfilePage.js';
import Gallery from './pages/GalleryPage.js';
import MintPage from './pages/MintPage.js';
import CreatorsPage from './pages/CreatorsPage.js';
import NotFoundPage from './pages/NotFoundPage.js';

  import { UserContext } from './constants/UserContext.js';

window.React = React
window.html = htm.bind(React.createElement)

const myProfile = html`<${MyProfile} />`;
const gallery = html`<${Gallery} />`;
const mint = html`<${MintPage} />`;
const creators = html`<${CreatorsPage} />`;
const notFound = html`<${NotFoundPage} />`;

const PageRouter = () => {
  return html`
  <${Router}>
    <${NavBar} />
    <${Route} path="/" component=${myProfile} />
    <${Route} path="/profile" component=${myProfile} />
    <${Route} path="/gallery" component=${gallery} />
    <${Route} path="/mint" component=${mint} />
    <${Route} path="/creators" component=${creators} />
    <${Route} path="/notFound" component=${notFound} />
    <${Route} path="*" component=${notFound} />
  </${Router}>
  `
}

ReactDOM.render(
  html`
    <${React.Suspense} fallback=${html`<div></div>`}>
    <${UserContext.Provider} value="test from context">
      <${PageRouter} />
    </ ${UserContext.Provider}>
    <//>
  `,
  document.getElementById('root')
)

