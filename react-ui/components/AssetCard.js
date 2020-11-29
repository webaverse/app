import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
const styles = css`./AssetCard.css`

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
        <div className="card card_${cardSize}">
          <div className="upperCardInfo upperCardInfo_${cardSize} upperCardInfo_${ext.replace('.','')}">
            <div className="upperCardInfoLeft upperCardInfoLeft_${cardSize}">
              <span className="cardAssetName cardName_${cardSize}">${assetName}</span>
            </div>

            <div className="upperCardInfoRight">
              <span className="networkType networkType_${cardSize}">${networkType}</span>
              <span className="ext ext_${cardSize} ext_${ext}">${ext}</span>
            </div>
          </div>

          <div className="assetImage assetImage_${cardSize}"><img src=${image} /></div>

          <div className="lowerCardInfo lowerCardInfo_${cardSize}">
            <div className="lowerCardInfoTop lowerCardInfoTop_${cardSize}">
                <span className="creator creator_${cardSize}">
                  <span className="creatorIcon creatorIcon_${cardSize}"><img src=${minterAvatarPreview} /></span>
                  <span className="creatorName creatorName_${cardSize}">${minterAddress}></span>
                </span>
                <span className="owner owner_${cardSize}">
                  <span className="ownerIcon ownerIcon_${cardSize}"><img src=${ownerAvatarPreview} /></span>
                  <span className="ownerName ownerName_${cardSize}">${ownerUsername}></span>
                </span>
                <span className="edition edition_${cardSize}">${totalSupply}</span>
                <span className="greaseLoadedIntoAsset greaseLoadedIntoAsset_${cardSize}"> ${balance}Ψ</span>
            </div>
          </div>
          <div className="lowerCardInfoMiddle lowerCardInfoMiddle_${cardSize}">
            <span className="assetDescription assetDescription_${cardSize}">${description}</span>
          </div>
          <div className="lowerCardInfoBottom lowerCardInfoBottom_${cardSize}">
            <span className="assetHash assetHash_${cardSize}">${hash}</span>
          </div>
        </div>
      </div>
    `;
  };

  export default Card;
