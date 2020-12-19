import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../web_modules/htm.js';
import css from '../web_modules/csz.js'
const styles = css`${window.locationSubdirectory}/components/AssetCard.css`

const html = htm.bind(React.createElement)

const Card = ({
  id,
  assetName,
  description,
  image,
  hash,
  external_url,
  filename,
  buyPrice,
  ext,
  totalSupply,
  numberInEdition,
  balance,
  ownerAvatarPreview,
  ownerUsername,
  ownerAddress,
  minterAvatarPreview,
  minterAddress,
  minterUsername,
  cardSize,
  networkType,
  onClickFunction
}) => {
    return html`
        <div
          className="${styles} card ${cardSize} cardItem" 
            onClick=${onClickFunction}
        >
          <div className="upperCardInfo upperCardInfo ${cardSize} upperCardInfo scheme-${id} upperCardInfo_${(ext ?? "").replace('.','')}">
            <div className="upperCardInfoLeft upperCardInfoLeft ${cardSize}">
              <span className="cardAssetName cardName ${cardSize}">${assetName}</span>
            </div>
            <div className="upperCardInfoRight upperCardInfoRight ${cardSize}">
              <img className="networkType networkType ${cardSize}" src='${window.locationSubdirectory}../images/icon-${networkType}.svg' />
              <div className="itemType ext ${cardSize} ext_${ext}">
                <img className="itemTypeIcon itemTypeIcon ${cardSize}" src='${window.locationSubdirectory}/components/AssetCardAdditional/icon-${ext}.svg' />
                <span className="itemTypeExt itemTypeExt ${cardSize}">.${ext}</span> 
              </div>
            </div>
          </div>
          <div className="assetImage assetImage ${cardSize}"><img src=${image} /></div>
          <div className="lowerCardInfo lowerCardInfo ${cardSize}">
            <div className="lowerCardInfoTop lowerCardInfoTop ${cardSize} lowerCardInfoTop scheme-${id}">
              <div className="lowerCardInfoTopLeft lowerCardInfoTopLeft ${cardSize}">
                <div className="lowerCardInfoTopLeftGroup">
                  <span className="creator creator ${cardSize}">
                    <span className="creatorIcon creatorIcon ${cardSize}"><img src=${minterAvatarPreview} /></span>
                    <span className="creatorName creatorName ${cardSize}">${minterUsername}></span>
                  </span>
                  <span className="owner owner ${cardSize}">
                    <span className="ownerIcon ownerIcon ${cardSize}"><img src=${ownerAvatarPreview} /></span>
                    <span className="ownerName ownerName ${cardSize}">${ownerUsername}></span>
                  </span>
                  <span className="arrow-down arrow-down ${cardSize}"></span>
                </div>
                <div className="lowerCardInfoTopClear"></div>
                <span className="edition edition ${cardSize}">${totalSupply} available</span>
              </div>
              <span className="greaseLoadedIntoAsset greaseLoadedIntoAsset ${cardSize}"> ${balance}Ψ</span>
            </div>
            <div className="lowerCardInfoMiddle lowerCardInfoMiddle ${cardSize}">
              <span className="assetDescription assetDescription ${cardSize}">${description}</span>
            </div>
            <div className="lowerCardInfoBottom lowerCardInfoBottom ${cardSize}">
              <span className="assetHash assetHash ${cardSize}">${hash}</span>
            </div>
          </div>
        </div>
    `;
  };

  export default Card;


  