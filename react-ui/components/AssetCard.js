import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const Card = (
  id,
  name,
  description,
  image,
  hash,
  external_url,
  filename,
  ext,
  numberInEdition,
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
) => {
    return html`
      <div class="card card_${cardSize}">

        <div class="upperCardInfo upperCardInfo_${cardSize} upperCardInfo_${assetType}">
          <div class="upperCardInfoLeft upperCardInfoLeft_${cardSize}">
            <span class="cardAssetName cardAssetName_${cardSize}">${name}</span>
          </div>

          <div class="upperCardInfoRight">
            <span class="networkType networkType_${cardSize}">${networkType}</span>
            <span class="assetType assetType_${cardSize} assetType_${ext}">${ext}</span>
          </div>
        </div>

        <div class="assetImage assetImage_${cardSize}"><img src=${image} /></div>

        <div class="lowerCardInfo lowerCardInfo_${cardSize}">
          <div class="lowerCardInfoTop lowerCardInfoTop_${cardSize}">
              <span class="creator creator_${cardSize}">
                <span class="creatorIcon creatorIcon_${cardSize}"><img src=${minterAvatarPreview} /></span>
                <span class="creatorName creatorName_${cardSize}">${minterAddress}></span>
              </span>
              <span class="owner owner_${cardSize}">
                <span class="ownerIcon ownerIcon_${cardSize}"><img src=${ownerAvatarPreview} /></span>
                <span class="ownerName ownerName_${cardSize}">${ownerUsername}></span>
              </span>
              <span class="edition edition_${cardSize}"> ${numberInEdition} of ${totalSupply}</span>
              <span class="greaseLoadedIntoAsset greaseLoadedIntoAsset_${cardSize}"> ${balance}Ψ</span>
          </div>
        </div>
        <div class="lowerCardInfoMiddle lowerCardInfoMiddle_${cardSize}">
          <span class="assetDescription assetDescription_${cardSize}">${description}</span>
        </div>
        <div class="lowerCardInfoBottom lowerCardInfoBottom_${cardSize}">
          <span class="assetHash assetHash_${cardSize}">${hash}</span>
        </div>
      </div>
    `;
  };

  export default Card;
