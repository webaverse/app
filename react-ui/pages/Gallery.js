import { React, useEffect } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import CardSize from '../constants/CardSize'

const html = htm.bind(React.createElement)

const galleryBannerImage = ""
const galleryFeaturedAssets = []

const newAssets = []
const modelsAndAvatars = []
const images = []

const GalleryPage = () => {

  return html`
    <div class="galleryPage">
      <div class="galleryHeader">
        <div class="galleryBannerImage"><img src=${galleryBannerImage}</div>
        <div class="galleryFeaturedAssets">
          <${AssetCardGrid} data=${galleryFeaturedAssets} cardSize=${CardSize.Medium} />
        </div>
      </div>
    <div class="galleryBody">
      <div class="galleryBodyAssets">
        <span class="galleryBodyHeader">Freshly Minted</span>
        <${AssetCardGrid} data=${newAssets} cardSize=${CardSize.Small} />
      </div>
      <div class="galleryBodyAssets">
        <span class="galleryBodyHeader">Models & Avatars</span>
        <${AssetCardGrid} data=${modelsAndAvatars} cardSize=${CardSize.Small} />
      </div>
      <div class="galleryBodyAssets">
        <span class="galleryBodyHeader">Images</span>
        <${AssetCardGrid} data=${images} cardSize=${CardSize.Small} />
      </div>
    </div>
  </div>
    `;
};

export default GalleryPage;
