import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const Card = (
  assetName,
  assetHash,
  assetDescription,
  numberInEdition,
  totalInEdition,
  greaseLoadedIntoAsset,
  assetType,
  assetImage,
  assetTypeImage,
  ownerIcon,
  ownerName,
  creatorIcon,
  creatorName,
  cardSize,
  networkType
) => {
    return html`
      <div class="card card_${cardSize}">

        <div class="upperCardInfo upperCardInfo_${cardSize} upperCardInfo_${assetType}">
          <div class="upperCardInfoLeft upperCardInfoLeft_${cardSize}">
            <span class="cardAssetName cardAssetName_${cardSize}">${assetName}</span>
          </div>

          <div class="upperCardInfoRight">
            <span class="networkType networkType_${cardSize}">${networkType}</span>
            <span class="assetType assetType_${cardSize} assetType_${assetType}">${assetTypeImage}</span>
          </div>
        </div>

        <div class="assetImage assetImage_${cardSize}"><img src=${assetImage} /></div>

        <div class="lowerCardInfo lowerCardInfo_${cardSize}">
          <div class="lowerCardInfoTop lowerCardInfoTop_${cardSize}">
              <span class="creator creator_${cardSize}">
                <span class="creatorIcon creatorIcon_${cardSize}"><img src=${creatorIcon} /></span>
                <span class="creatorName creatorName_${cardSize}">${creatorName}></span>
              </span>
              <span class="owner owner_${cardSize}">
                <span class="ownerIcon ownerIcon_${cardSize}"><img src=${ownerIcon} /></span>
                <span class="ownerName ownerName_${cardSize}">${ownerName}></span>
              </span>
              <span class="edition edition_${cardSize}"> ${numberInEdition} of ${totalInEdition}</span>
              <span class="greaseLoadedIntoAsset greaseLoadedIntoAsset_${cardSize}"> ${greaseLoadedIntoAsset}Ψ</span>
          </div>
        </div>
        <div class="lowerCardInfoMiddle lowerCardInfoMiddle_${cardSize}">
          <span class="assetDescription assetDescription_${cardSize}">${assetDescription}</span>
        </div>
        <div class="lowerCardInfoBottom lowerCardInfoBottom_${cardSize}">
          <span class="assetHash assetHash_${cardSize}">${assetHash}</span>
        </div>
      </div>
    `;
  };

  export default Card;
