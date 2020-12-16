import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import { Router } from '../web_modules/@reach/router.js';

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
  return html`
  <${React.Fragment}>
  <${NavBar} />
  <${Router} basepath='${window.locationSubdirectory}' >
    <${MyProfile} path="${window.locationSubdirectory}/"/>
      <${MyProfile} path="${window.locationSubdirectory}/profile/:view"/>
      <${Settings} path="${window.locationSubdirectory}/settings" />
      <${Gallery} path="${window.locationSubdirectory}/gallery" />
      <${MintPage} path="${window.locationSubdirectory}/mint" />
      <${CreatorsPage} path="${window.locationSubdirectory}/creators" />
      <${CreatorProfilePage} path="${window.locationSubdirectory}/creator" />
      <${CreatorProfilePage} path="${window.locationSubdirectory}/creator/:address" />
      <${CreatorProfilePage} path="${window.locationSubdirectory}/creator/:address/:view" />
      <${LoginGateway} path="${window.locationSubdirectory}/gateway" />
      <${NotFoundPage} path="${window.locationSubdirectory}/*" />
    </${Router}>
  </${React.Fragment}>

  `;
};
