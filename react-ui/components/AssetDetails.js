import { React, useContext } from 'https://unpkg.com/es-react@16.13.1/dev';
import { Context } from '../constants/Context.js';
import htm from '/web_modules/htm.js';
import AssetCard from './AssetCard.js';
import CardSize from '../constants/CardSize.js';
const html = htm.bind(React.createElement)
import csz from '../web_modules/csz.js';
import ActionTypes from '../constants/ActionTypes.js';

const styles = csz`/components/AssetDetails.css`;

export const AssetDetails = ({
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
    buyPrice,
    hideDetails,
    assetType
}) => {
    const {state, dispatch} = useContext(Context);

    // Do you own this asset?
    console.log("Owner address is", ownerAddress);
    console.log("State address is", state.address);

    const userOwnsThisAsset = ownerAddress.toLowerCase() === state.address.toLowerCase();  
    
    // Did you create this asset?
    const userCreatedThisAsset = minterAddress === state.address;    

    // Otherwise, is this asset for sale?
    const isForSale = buyPrice !== undefined && buyPrice !== null && buyPrice !== ""

    const setAvatar = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.SetAvatar, payload: { hash }});
    }

    const setHomespace = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.SetHomespace, payload: { hash }});
    }

    const addToLoadout = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.AddToLoadout, payload: { hash }});
    }
    
    const removeFromLoadout = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.RemoveFromLoadout, payload: { hash }});
    }

    const depositToMainnet = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.WithdrawNft, payload: { hash }});
    }

    const depositToWebaverse = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.DepositNft, payload: { hash }});
    }

    const handleReupload = (e) => {
        e.preventDefault();
        console.warn ("Handle reuploading image");
    }

    const cancelSale = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.UnsellNft, payload: { hash }});
    }

    const sellAsset = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.SellNft, payload: { hash }});
    }

    const buyAsset = (e) => {
        e.preventDefault();
        dispatch({ type: ActionTypes.BuyNft, payload: { hash }});
    }

    return html`
        <div className=${styles}>
            <div className="assetDetails">
                <div className="assetDetailsLeftColumn">
                    <${AssetCard}
                        key="${id}"
                        assetName=${name}
                        ext=${ext}
                        description=${description}
                        buyPrice=${buyPrice}
                        image=${image}
                        hash=${hash}
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
                        networkType='webaverse'
                    /> 
                </div>
                <div className="assetDetailsRightColumn">
                    <div className="assetDetailsRightColumnHeader"> ${userOwnsThisAsset ? 'You Own This Asset' : 'Asset Details'} </div>
                    <div className="assetDetailsRightColumnBody">

                    ${userOwnsThisAsset && html`
                    ${/* TODO: Hide corresponding button if this asset is already avatar, homespace or in loadout, and add option to remove from loadout if is in */''}
                        <button className="assetDetailsButton" onClick=${setAvatar}>Set As Avatar</button>
                        <button className="assetDetailsButton" onClick=${setHomespace}>Set As Homespace</button>
                        <button className="assetDetailsButton" onClick=${addToLoadout}>Add To Loadout</button>

                        ${networkType == 'webaverse' ? html`
                        <button className="assetDetailsButton" onClick=${depositToMainnet}>Deposit To Mainnet</button>
                        ` : html`
                        <button className="assetDetailsButton" onClick=${depositToWebaverse}>Deposit To Webaverse</button>
                        `}

                            ${userCreatedThisAsset && html`
                            <button className="assetDetailsButton" onClick=${handleReupload}>Reupload Asset</button>
                            `}

                            ${isForSale ? html`
                            <button className="assetDetailsButton" onClick=${cancelSale}>Cancel Sale</button>
                            ` : html `
                            <button className="assetDetailsButton" onClick=${sellAsset}>Sell Asset</button>
                            `}
                        `}
                        
                    ${!userOwnsThisAsset && html`
                        ${isForSale ? html`
                        <p>Sale price is ${buyPrice}</p>
                        <button className="assetDetailsButton" onClick=${buyAsset}>Buy Asset</button>
                        ` : html`
                        <p>Not for sale</p>
                        `}
                    `}
                     </div>
                    <div className="assetDetailsRightColumnFooter">
                        <button className="assetDetailsButton assetDetailsFooterButton" onClick=${hideDetails}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
  };

  export  default AssetDetails;
