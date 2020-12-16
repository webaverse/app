import { React, useState, useEffect } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../web_modules/htm.js';
import AssetCard from './AssetCard.js'
import AssetDetails from './AssetDetails.js'

const html = htm.bind(React.createElement)
import css from '../web_modules/csz.js'

const styles = css`/${window.locationSubdirectory}components/AssetCardGrid.css`

const AssetCardGrid = ({
  data,
  cardSize
}) => {
  console.log("Data is", data);
  const [currentAsset, setCurrentAsset] = useState(null)

  const showCardDetails = (asset) => {
    console.log("Showing card details", asset);
    setCurrentAsset(asset);
  }

  const hideCardDetails = () => {
    console.log("Hiding card details");
    setCurrentAsset(null);
  }

  useEffect(() => {
    if(currentAsset === null) return
    console.log("**** Current asset is", currentAsset);
    console.log("Address is", currentAsset.id);
  }, [currentAsset])


    return html`
    <${React.Fragment}>
    ${currentAsset !== null && html`
          <${AssetDetails}
            id=${currentAsset.id}
            key=${currentAsset.id}
            name=${currentAsset.name}
            description=${currentAsset.description}
            image=${currentAsset.image}
            buyPrice=${currentAsset.buyPrice}
            hash=${currentAsset.properties.hash}
            external_url=${currentAsset.external_url}
            filename=${currentAsset.properties.filename}
            ext=${currentAsset.properties.ext}
            totalSupply=${currentAsset.totalSupply}
            balance=${currentAsset.balance}
            ownerAvatarPreview=${currentAsset.owner.avatarPreview}
            ownerUsername=${currentAsset.owner.username}
            ownerAddress=${currentAsset.owner.address}
            minterAvatarPreview=${currentAsset.minter.avatarPreview}
            minterAddress=${currentAsset.minter.address}
            minterUsername=${currentAsset.minter.username}
            hideDetails=${hideCardDetails}
            networkType='webaverse'
          />
      `}
      <div className="${styles} ${cardSize}">
        ${data.map(asset => html`
          <${AssetCard}
              key=${asset.properties.hash}
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
              onClickFunction=${() => showCardDetails(asset)}
              networkType='webaverse'
          />
          `)}
          </div>
      </${React.Fragment}>
    `
  };

  export default AssetCardGrid;

