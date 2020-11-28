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
            key="${id}"
            assetName=${asset.name}
            assetDescription=${asset.description}
            assetImage=${asset.image}
            assetHash=${asset.hash}
            numberInEdition=${asset.numberInEdition}
            totalSupply=${asset.totalSupply}
            balance=${asset.balance}
            totalInEdition=${asset.totalInEdition}
            assetType=${asset.assetType}
            ownerAvatarPreview=${asset.ownerAvatarPreview}
            ownerUsername=${asset.ownerUsername}
            ownerAddress=${asset.ownerAddress}
            minterAvatarPreview=${asset.minterAvatarPreview}
            minterUsername=${asset.minterUsername}
            minterAddress=${asset.minterAddress}
            cardSize=${cardSize}
            networkType=${asset.networkType}
        />
        `)}
      </div>
    `;
  };

  export default AssetCardGrid;