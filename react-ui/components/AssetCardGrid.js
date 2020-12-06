import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../web_modules/htm.js';
import AssetCard from './AssetCard.js'

const html = htm.bind(React.createElement)
import csz from '../web_modules/csz.js'

const styles = csz`/components/AssetCardGrid.css`

const AssetCardGrid = ({
  data,
  cardSize
}) => {
  console.log("Data is", data);
    return html`
      <div className="${styles} ${cardSize}">
        ${data.map(asset => html`
          <${AssetCard}
              key=${asset}
              id=${asset.id}
              assetName=${asset.name}
              description=${asset.description}
              image=${asset.image}
              hash=${asset.properties.hash}
              external_url=${asset.external_url}
              filename=${asset.properties.filename}
              ext=${asset.properties.ext}
              totalSupply=${asset.totalSupply}
              balance=${asset.balance}
              buyPrice=${asset.buyPrice}
              ownerAvatarPreview=${asset.owner.avatarPreview}
              ownerUsername=${asset.owner.username}
              ownerAddress=${asset.owner.address}
              minterAvatarPreview=${asset.minter.avatarPreview}
              minterUsername=${asset.minter.username}
              minterAddress=${asset.minter.address}
              cardSize=${cardSize}
              networkType='webaverse'
          />
          `)}
        </div>
    `;
  };

  export default AssetCardGrid;

