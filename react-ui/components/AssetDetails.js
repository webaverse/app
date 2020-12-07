import { React, useContext } from 'https://unpkg.com/es-react@16.13.1/dev';
import { Context } from '../constants/Context.js';
import htm from '/web_modules/htm.js';
import AssetCard from './AssetCard.js';
import CardSize from '../constants/CardSize.js';
const html = htm.bind(React.createElement)
import csz from '../web_modules/csz.js';

const styles = csz`/components/AssetDetails.css`;

const AssetDetails = ({
    id,
    name,
    description,
    image,
    hash,
    external_url,
    filename,
    ext,
    totalInEdition,
    numberInEdition,
    totalSupply,
    balance,
    ownerAvatarPreview,
    ownerUsername,
    ownerAddress,
    minterAvatarPreview,
    minterAddress,
    minterUsername,
    networkType,
    salePrice,
    hideDetailsFunction,
    assetType
}) => {
    const {state, dispatch} = useContext(Context);

    // Do you own this asset?
    const userOwnsThisAsset = ownerAddress === state.address;  
    
    // Did you create this asset?
    const userCreatedThisAsset = minterAddress === state.address;    

    // Otherwise, is this asset for sale?
    const isForSale = salePrice !== undefined && salePrice !== null && salePrice !== ""

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
                    <div className="assetDetailsRightColumnHeader"> ${userOwnsThisAsset ? 'You Own This Asset' : 'Asset Details'} </div>
                    <div className="assetDetailsRightColumnBody">
                    ${userOwnsThisAsset && html`
                        <button className="assetDetailsButton">Set As Avatar</button>
                        <button className="assetDetailsButton">Set As Homespace</button>
                        <button className="assetDetailsButton">Add To Loadout</button>
                        <button className="assetDetailsButton">Deposit To Webaverse</button>
                            ${userCreatedThisAsset && html`
                            <button className="assetDetailsButton">Reupload Asset</button>
                            `}
                            ${isForSale ? html`
                            <button className="assetDetailsButton">Unsell Asset</button>
                            ` : html `
                            <button className="assetDetailsButton">Sell Asset</button>
                            `}
                        `}
                    ${!userOwnsThisAsset && html`
                        ${isForSale ? html`
                        <p>Sale price is ${salePrice}</p>
                        <button className="assetDetailsButton">Unsell Asset</button>
                        ` : html`
                            <p>Not for sale</p>
                        `}
                    `}
                     </div>
                    <div className="assetDetailsRightColumnFooter">
                        <button className="assetDetailsButton assetDetailsFooterButton" onClick=${hideDetailsFunction}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
  };

  export default AssetDetails;
