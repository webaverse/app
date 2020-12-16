import { React, useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import { Context } from '../constants/Context.js';
import htm from '../web_modules/htm.js';
import AssetCard from './AssetCard.js';
import CardSize from '../constants/CardSize.js';
import { setAvatar, setHomespace, depositAsset, cancelSale, sellAsset, buyAsset } from '../functions/AssetFunctions.js'

const html = htm.bind(React.createElement)
import css from '../web_modules/csz.js';
import ActionTypes from '../constants/ActionTypes.js';

const styles = css`${window.locationSubdirectory}/components/AssetDetails.css`;

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
    const { state, dispatch } = useContext(Context);

    const [sellAssetShowing, setSellAssetShowing] = useState(false);
    const [salePrice, setSalePrice] = useState(0);

    // Do you own this asset?
    console.log("Owner address is", ownerAddress);
    console.log("minterAddress address is", minterAddress);

    console.log("State address is", state.address);

    const userOwnsThisAsset = ownerAddress.toLowerCase() === state.address.toLowerCase();

    // Did you create this asset?
    const userCreatedThisAsset = minterAddress.toLowerCase() === state.address.toLowerCase();

    // Otherwise, is this asset for sale?
    const isForSale = buyPrice !== undefined && buyPrice !== null && buyPrice !== ""

    console.log("**** Buy price is", buyPrice);

    const handleSetAvatar = (e) => {
        e.preventDefault();
        console.log("Setting avatar, id is", id);
        setAvatar(id)
    }

    const handleSetHomespace = (e) => {
        e.preventDefault();
        setHomespace(id, () => console.log("Changed homespace to ", id), (err) => console.log("Failed to change homespace", err));
    }

    // const addToLoadout = (e) => {
    //     e.preventDefault();
    //     addToLoadout(id, () => console.log("Changed homespace to ", id), (err) => console.log("Failed to change homespace", err));
    // }

    // const removeFromLoadout = (e) => {
    //     e.preventDefault();
    //     removeFromLoadout(id, () => console.log("Changed homespace to ", id), (err) => console.log("Failed to change homespace", err));
    // }

    const handleDeposit = (e) => {
        e.preventDefault();
        depositAsset(id, networkType, () => console.log("Deposited", id, "to", networkType, state.mainnetAddress), (err) => console.log("Failed to change homespace", err));
    }

    const handleReupload = (e) => {
        e.preventDefault();
        console.warn("TODO: Handle reuploading image");
    }

    const handleCancelSale = (e) => {
        e.preventDefault();
        cancelSale(id, networkType, () => console.log("Changed homespace to ", id), (err) => console.log("Failed to change homespace", err));
    }

    const handleShowSellAsset = (e) => {
        e.preventDefault();
        setSellAssetShowing(true);
    }

    const handleHideSellAsset = (e) => {
        e.preventDefault();
        setSellAssetShowing(false);
    }

    const handleSellAsset = (e) => {
        e.preventDefault();
        if(salePrice < 0) return console.error("Sale price can't be less than 0");
        console.log("Selling id", id, "from login token", state.loginToken.mnemonic);
        sellAsset(
            id,
            salePrice,
            networkType,
            state.loginToken.mnemonic,
            (success) => console.log("Sold asset ", id, success),
            (err) => console.log("Failed to sell asset", err)
        );
    }

    const handleBuyAsset = (e) => {
        e.preventDefault();
        buyAsset(
            id,
            networkType,
            state.loginToken.mnemonic,
            () => console.log("Buying Asset", id),
            (err) => console.log("Failed to purchase asset", err)
        );
    }

    return html`
        <div className="${styles}> assetDetails">
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
                ${userOwnsThisAsset ? html`
                ${/* USER OWNS THIS ASSET */ ''}
                    ${/* TODO: Hide corresponding button if this asset is already avatar, homespace or in loadout, and add option to remove from loadout if is in */''}
                    <button className="assetDetailsButton" onClick=${handleSetAvatar}>Set As Avatar</button>
                    <button className="assetDetailsButton" onClick=${handleSetHomespace}>Set As Homespace</button>
                    ${/* <button className="assetDetailsButton" onClick=${addToLoadout}>Add To Loadout</button>*/''}
                    ${state.mainnetAddress !== null && `
                        <button className="assetDetailsButton" onClick=${handleDeposit}>Deposit To ${networkType === 'webaverse' ? 'Mainnet' : 'Webaverse'}</button>
                    `}
            
                    ${userCreatedThisAsset && html`
                        <button className="assetDetailsButton" onClick=${handleReupload}>Reupload Asset</button>
                    `}
            
                    ${isForSale ? html`
                        <button className="assetDetailsButton" onClick=${handleCancelSale}>Cancel Sale</button>
                    ` : html`
                        ${!sellAssetShowing ? html`
                            <button className="assetDetailsButton" onClick=${handleShowSellAsset}>Sell Asset</button>
                        `: html`
                            <span className="sellAssetConfirmation">
                            <input type="text" value=${salePrice} onChange=${(e) => { e.preventDefault(); setSalePrice( e.target.value )}} />
                                <button className="assetDetailsButton" onClick=${handleSellAsset}>Sell Asset</button>
                                <button className="assetDetailsButton" onClick=${handleHideSellAsset}>Cancel</button>
                            </span>
                        `}
                    `}
                ` : html`
                ${/* USER DOES NOT OWN THIS ASSET */ ''}
                        ${isForSale ? html`
                        <span className="forSale">
                            <p>Sale price is ${buyPrice}</p>
                            <button className="assetDetailsButton" onClick=${handleBuyAsset}>Buy Asset</button>
                            </span>
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
    `;
};

export default AssetDetails;
