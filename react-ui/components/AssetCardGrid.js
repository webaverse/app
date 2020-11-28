import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import AssetCard from './AssetCard'

const html = htm.bind(React.createElement)

const AssetCardGrid = (
  assetData,
  cardSize
) => {
    return html`
      <div class="assetDataGrid ${assetType}">
      ${assetData.map(asset => html`
        <${AssetCard}
            key="${assetHash}"
            assetName=${asset.assetName}
            assetHash=${asset.assetHash}
            assetDescription=${asset.assetDescription}
            numberInEdition=${asset.numberInEdition}
            totalInEdition=${asset.totalInEdition}
            greaseLoadedIntoAsset=${asset.greaseLoadedIntoAsset}
            assetType=${asset.assetType}
            assetImage=${asset.assetImage}
            ownerIcon=${asset.ownerIcon}
            ownerName=${asset.ownerName}
            creatorIcon=${asset.creatorIcon}
            creatorName=${asset.creatorName}
            networkType=${asset.networkType}
            cardSize=${cardSize}
        />
        `)}
      </div>
    `;
  };

  export default AssetCardGrid;
