import { React, useEffect, useState, useContext } from 'https://unpkg.com/es-react@16.13.1/dev';
import CardSize from '../constants/CardSize.js'
import Booth from "../components/Booth.js";
import htm from '../web_modules/htm.js';
import ActionTypes from '../constants/ActionTypes.js';
import css from '../web_modules/csz.js';
const styles = css`${window.locationSubdirectory}/components/GalleryPage.css`
import { Context } from '../constants/Context.js';
import Card  from './AssetCard.js'

const html = htm.bind(React.createElement)

const headerTitleImg = window.locationSubdirectory + "/images/Gallery_Subheader_Background.svg";
const defaultHomespacePreview = window.locationSubdirectory + "/images/defaulthomespace.svg";
const avatarPreview = window.locationSubdirectory + "/images/Gallery_Featured_Avatar.png";
const featureNameBackground = window.locationSubdirectory + "/images/Gallery_Featured_Name_Background.svg";
const featureVisiteBackground = window.locationSubdirectory + "/images/Gallery_Featured_Visite_Background.svg";
const featureVisiteArrow = window.locationSubdirectory + "/images/Gallery_Featured_Visite_arrow.svg";
const browseTitleImg = window.locationSubdirectory + "/images/Gallety_Subhead_Browse_Background.svg";

const mockCardData = {
  id: 1,
  assetName: 'My Cool Item',
  description: 'This is the first avatar I’ve uploaded to the Webaverse.',
  image: `${window.locationSubdirectory}/components/AssetCardAdditional/tempImage.png`,
  hash: '0x35ddcd7d8b66f1331f77186af17dbcf231909433',
  ext: 'jpg',
  totalSupply: 1,
  numberInEdition: 1,
  balance: 2000,
  ownerAvatarPreview: `${window.locationSubdirectory}/components/AssetCardAdditional/tempImageIcon.png`,
  ownerUsername: 'Paul',
  ownerAddress: null,
  minterAvatarPreview: `${window.locationSubdirectory}/components/AssetCardAdditional/tempImageIcon.png`,
  minterAddress: null,
  minterUsername: 'Vernigora',
  cardSize: "medium",
  networkType: 'webaverse',
  onClickFunction: null,
}

const GalleryPage = () => {
  const { state, dispatch } = useContext(Context);
  const [currentPage, setCurrentPage] = useState(1);
  let boothId = 0;
  useEffect(() => {
    console.log("Rendering gallery");
    dispatch({ type: ActionTypes.GetBooths, payload: { page: currentPage } });
  }, [])

  const responsive = {
    superLargeDesktop: {
      // the naming can be any, depends on you.
      breakpoint: { max: 4000, min: 3000 },
      items: 5
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1
    }
  };

  return html`
    <${React.Suspense} fallback=${html`<div>Loading...</div>`}>
    ${state.booths[currentPage] && html`
    <div className="${styles}">
      <div className="header">
        <div className="headerTitle">
          <span className="headerTitleValue">FEATURED CREATOR</span>
          <img className="headerTitleImg" src="${headerTitleImg}" />
        </div>
        <div className="headerMain">
          <div className="homespaceBannerImage"><img src="${defaultHomespacePreview}" /></div>
          <div className="headerMainContent">
            <div className="avatar">
              <img className="avatarImageBackground" src="${defaultHomespacePreview}" />
              <img className="avatarImage" src="${avatarPreview}" />
              <div className="avatarIconsCaurousel">
                <img className="iconsCaurouselItem" src="${avatarPreview}" />
                <img className="iconsCaurouselItem" src="${avatarPreview}" />
                <img className="iconsCaurouselItem" src="${avatarPreview}" />
                <img className="iconsCaurouselItem" src="${avatarPreview}" />
                <img className="iconsCaurouselItem" src="${avatarPreview}" />
                <span>+3 more</span>
              </div>
            </div>
            <div className="headerCards">
              <div className="headerCardsTitle">
                <img className="featureNameImg" src="${featureNameBackground}" />
                <span className="featureNameValue">AVAER</span>
              </div>
              <div className="headerCardsMain">
                <div className="headerCardItem">
                  <${Card} ...${mockCardData} />
                </div>
                <div className="headerCardItem">
                  <${Card} ...${mockCardData} />
                </div>
                <div className="headerCardItem">
                  <${Card} ...${mockCardData} />
                </div>
              </div>
            </div>
          </div>
          <div className="headerMainVisite">
            <img className="visiteNameBackground" src="${featureVisiteBackground}" />
            <span className="visiteNameValue">VISIT CREATOR PAGE</span>
            <img className="visiteNameArrow" src="${featureVisiteArrow}" />
          </div>
        </div>
      </div>
      <div className="browseTitle">
        <span className="browseTitleValue">BROWSE SELLERS</span>
        <img className="browseTitleImg" src="${browseTitleImg}" />
      </div>
      <div className="browseMain">
        ${state.booths[currentPage].map(asset => html`
        <${Booth} key=${boothId++} data=${asset} cardSize=${CardSize.Small} />
        `)}
      </div>
      </div>
      `}
    <//>
    `;
};

export default GalleryPage;
