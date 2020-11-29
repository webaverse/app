import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import csz from '../web_modules/csz.js'
const styles = csz`/components/AssetCard.css`

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
  balance,
  ownerAvatarPreview,
  ownerUsername,
  ownerAddress,
  minterAvatarPreview,
  minterAddress,
  minterUsername,
  cardSize,
  networkType
}) => {
    return html`
      <div className=${styles}>
        <div className="card card ${cardSize}">
          <div className="upperCardInfo upperCardInfo ${cardSize} upperCardInfo_${ext.replace('.','')}">
            <div className="upperCardInfoLeft upperCardInfoLeft ${cardSize}">
              <span className="cardAssetName cardName ${cardSize}">${assetName}</span>
            </div>

            <div className="upperCardInfoRight">
              <span className="networkType networkType ${cardSize}">${networkType}</span>
              <span className="ext ext ${cardSize} ext_${ext}">${ext}</span>
            </div>
          </div>

          <div className="assetImage assetImage ${cardSize}"><img src=${image} /></div>

          <div className="lowerCardInfo lowerCardInfo ${cardSize}">
            <div className="lowerCardInfoTop lowerCardInfoTop ${cardSize}">
                <span className="creator creator ${cardSize}">
                  <span className="creatorIcon creatorIcon ${cardSize}"><img src=${minterAvatarPreview} /></span>
                  <span className="creatorName creatorName ${cardSize}">${minterAddress}></span>
                </span>
                <span className="owner owner ${cardSize}">
                  <span className="ownerIcon ownerIcon ${cardSize}"><img src=${ownerAvatarPreview} /></span>
                  <span className="ownerName ownerName ${cardSize}">${ownerUsername}></span>
                </span>
                <span className="edition edition ${cardSize}">${totalSupply}</span>
                <span className="greaseLoadedIntoAsset greaseLoadedIntoAsset ${cardSize}"> ${balance}Ψ</span>
            </div>
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
