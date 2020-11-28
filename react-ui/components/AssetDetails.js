// Div around everything
// Left colum div with card in it
// RIght column div with menuy in it
// Detail buttons

import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const AssetDetails = (
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
    networkType
) => {
    return html`
      <div class="assetDetails">
        <div class="assetDetailsLeftColumn">
            <${AssetCard}
                key="${id}"
                assetName=${name}
                assetDescription=${description}
                assetImage=${image}
                assetHash=${hash}
                numberInEdition=${numberInEdition}
                totalSupply=${totalSupply}
                balance=${balance}
                totalInEdition=${totalInEdition}
                assetType=${assetType}
                ownerAvatarPreview=${ownerAvatarPreview}
                ownerUsername=${ownerUsername}
                ownerAddress=${ownerAddress}
                minterAvatarPreview=${minterAvatarPreview}
                minterUsername=${minterUsername}
                minterAddress=${minterAddress}
                cardSize=${CardSize.Large}
                networkType=${networkType}
            /> 
        </div>
        <div class="assetDetailsRightColumn">
            <div class="assetDetailsRightColumn_header"> YOU OWN THIS ASSET </div>
            <div class="assetDetailsRightColumn_body">
                <button class="assetDetailsButton">Set As Avatar</button>
                <button class="assetDetailsButton">Set As Homespace</button>
                <button class="assetDetailsButton">Add To Loadout</button>
                <button class="assetDetailsButton">Deposit To Webaverse</button>
            </div>
            <div class="assetDetailsRightColumn_footer">
                <button class="assetDetailsButton assetDetailsFooterButton">Close</button>
            </div>
        </div>
      </div>
    `;
  };

  export default AssetDetails;
