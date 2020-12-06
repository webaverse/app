import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../web_modules/htm.js';
import CardSize from '../constants/CardSize.js'
import Booth from "../components/Booth.js";
import MockGalleryData from "../mock/GalleryData.js";

const html = htm.bind(React.createElement)

const galleryBannerImage = "";

const data = MockGalleryData;

const GalleryPage = () => {

  return html`
    <div className="galleryPage">
      ${data.map(asset => html`
        <${Booth} data=${asset} cardSize=${CardSize.Small} />
      `)}
  </div>
    `;
};

export default GalleryPage;
