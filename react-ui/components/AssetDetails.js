// Div around everything
// Left colum div with card in it
// RIght column div with menuy in it
// Detail buttons

import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)
import csz from '../web_modules/csz.js'

const styles = csz`/components/Booth.css`

const AssetDetails = ({
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
}) => {
    return html`
        <div class=${styles}>
            <div className="assetDetails">
                <div className="assetDetailsLeftColumn">
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
                <div className="assetDetailsRightColumn">
                    <div className="assetDetailsRightColumnHeader"> YOU OWN THIS ASSET </div>
                    <div className="assetDetailsRightColumnBody">
                        <button className="assetDetailsButton">Set As Avatar</button>
                        <button className="assetDetailsButton">Set As Homespace</button>
                        <button className="assetDetailsButton">Add To Loadout</button>
                        <button className="assetDetailsButton">Deposit To Webaverse</button>
                    </div>
                    <div className="assetDetailsRightColumnFooter">
                        <button className="assetDetailsButton assetDetailsFooterButton">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
  };

  export default AssetDetails;
