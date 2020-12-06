import CreatorsPage from './CreatorsPage.js';
import Gallery from './GalleryPage.js';
import MintPage from './MintPage.js';
import MyProfile from './MyProfilePage.js';
import CreatorProfilePage from './CreatorProfilePage.js';
import NotFoundPage from './NotFoundPage.js';
import Router, { Route } from '../web_modules/react-es-router.js';

export const PageRouter = () => {
  const myProfile = html`<${MyProfile} />`;
  const gallery = html`<${Gallery} />`;
  const mint = html`<${MintPage} />`;
  const creators = html`<${CreatorsPage} />`;
  const creatorProfile = html`<${CreatorProfilePage} />`;
  const notFound = html`<${NotFoundPage} />`;
  return html`
  <${Router}>
    <${Route} path="/" component=${myProfile} />
    <${Route} path="/profile" component=${myProfile} />
    <${Route} path="/gallery" component=${gallery} />
    <${Route} path="/mint" component=${mint} />
    <${Route} path="/creators" component=${creators} />
    <${Route} path="/creator" component=${creatorProfile} />
    <${Route} path="/notFound" component=${notFound} />
    <${Route} path="*" component=${notFound} />
  </${Router}>
  `;
};
