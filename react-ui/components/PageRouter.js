import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import Router, { Route } from '/web_modules/react-es-router.js';
import CreatorProfilePage from './CreatorProfilePage.js';
import CreatorsPage from './CreatorsPage.js';
import Gallery from './GalleryPage.js';
import LoginGateway from './LoginGateway.js';
import MintPage from './MintPage.js';
import MyProfile from './MyProfilePage.js';
import NavBar from './NavBar.js';
import NotFoundPage from './NotFoundPage.js';
import Settings from './SettingsPage.js';

export const PageRouter = () => {
  const myProfile = html`<${MyProfile} />`;
  const settings = html`<${Settings} />`;
  const loginGateway = html`<${LoginGateway} />`;
  const gallery = html`<${Gallery} />`;
  const mint = html`<${MintPage} />`;
  const creators = html`<${CreatorsPage} />`;
  const creatorProfile = html`<${CreatorProfilePage} />`;
  const notFound = html`<${NotFoundPage} />`;
  return html`
  <${React.Fragment}>
  <${Router}>
    <${NavBar} />
      <${Route} path="/" component=${myProfile} />
      <${Route} path="/profile" component=${myProfile} />
      <${Route} path="/settings" component=${settings} />
      <${Route} path="/gallery" component=${gallery} />
      <${Route} path="/mint" component=${mint} />
      <${Route} path="/creators" component=${creators} />
      <${Route} path="/creator" component=${creatorProfile} />
      <${Route} path="/gateway" component=${loginGateway} />
      <${Route} path="/notFound" component=${notFound} />
      <${Route} path="*" component=${notFound} />
    </${Router}>
  </${React.Fragment}>

  `;
};
