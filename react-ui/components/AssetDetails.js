import { React, useContext, useState, useEffect } from 'https://unpkg.com/es-react@16.13.1/dev';
import { Context } from '../constants/Context.js';
import htm from '../web_modules/htm.js';
import AssetCard from './AssetCard.js';
import CardSize from '../constants/CardSize.js';
import { setAvatar, setHomespace, depositAsset, cancelSale, sellAsset, buyAsset, addToLoadout } from '../functions/Functions.js'

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
    const [toggleReuploadOpen, setToggleReuploadOpen] = useState(false);
    const [toggleRenameOpen, setToggleRenameOpen] = useState(false);
    const [toggleDestroyOpen, setToggleDestroyOpen] = useState(false);
    const [toggleCancelSaleOpen, setToggleCancelSaleOpen] = useState(false);
    // const [toggleSaleOpen, setToggleSaleOpen] = useState(false);
    const [toggleOnSaleOpen, setToggleOnSaleOpen] = useState(false);
    const [toggleTransferToOpen, setToggleTransferToOpen] = useState(false);
    const [toggleDropdownConfirmOpen, setToggleDropdownConfirmOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [calculatedCardSize, setCalculatedCardSize] = useState(CardSize.Large)

    useEffect(() => {
        document.documentElement.clientWidth < 585 ? setCalculatedCardSize(CardSize.Small) :
        document.documentElement.clientWidth < 750 ? setCalculatedCardSize(CardSize.Medium) : 
                                                     setCalculatedCardSize(CardSize.Large)
    },  [document.documentElement.clientWidth])

    // Do you own this asset?
    console.log("Owner address is", ownerAddress);
    console.log("minterAddress address is", minterAddress);

    console.log("State address is", state.address);

    const userOwnsThisAsset = ownerAddress?.toLowerCase() === state.address.toLowerCase();

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

    const handleAddToLoadout = (e) => {
        e.preventDefault();
        dispatch({type: ActionTypes.AddToLoadout, payload: { id }})
    }

    const removeFromLoadout = (e) => {
        e.preventDefault();
        removeFromLoadout(id, () => console.log("Changed homespace to ", id), (err) => console.log("Failed to change homespace", err));
    }

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

    const isAlreadyAvatar = false;
    const isAlreadyHomespace = false;
    const isAlreadyLoadout = false;

    const toggleReupload = () => {
        setToggleReuploadOpen(!toggleReuploadOpen);
    }

    const toggleRename = () => {
        setToggleRenameOpen(!toggleRenameOpen);
    }
   
    const toggleDestroy = () => {
        setToggleDestroyOpen(!toggleDestroyOpen);
    }

    const toggleCancelSale = () => {
        setToggleCancelSaleOpen(!toggleCancelSaleOpen);
    }

    const toggleShowSellAsset = () => {
        setSellAssetShowing(!sellAssetShowing);
    }

    const toggleTransferTo = () => {
        setToggleTransferToOpen(!toggleTransferToOpen);
    }

    const toggleDropdownConfirm = () => {
        setToggleDropdownConfirmOpen(!toggleDropdownConfirmOpen)
    }

    const toggleOnSale = () => {
        setToggleOnSaleOpen(!toggleOnSaleOpen)
    }

    return html`
        <div className="${styles} assetDetailsContainer">
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
                        cardSize=${calculatedCardSize}
                        networkType='webaverse'
                    /> 
                </div>
                <div className="assetDetailsRightColumn">
                    ${userOwnsThisAsset ? html`
                    ${/* USER OWNS THIS ASSET */ ''}
                        ${/* TODO: Hide corresponding button if this asset is already avatar, homespace or in loadout, and add option to remove from loadout if is in */''}
                        ${isAlreadyAvatar || isAlreadyHomespace || isAlreadyLoadout ? html `` : html`
                        <div className="detailsBlock detailsBlockSet">
                            <button className="assetDetailsButton" onClick=${handleSetAvatar}>Set As Avatar</button>
                            <button className="assetDetailsButton" onClick=${handleSetHomespace}>Set As Homespace</button>
                            <button className="assetDetailsButton" onClick=${handleAddToLoadout}>Add To Loadout</button>
                        </div>
                        `}
                        
                        ${userCreatedThisAsset && html`
                        <div className="detailsBlock detailsBlockEdit">
                            <div className="Accordion">
                                <div className="accordionTitle" onClick=${toggleReupload}>
                                    <span className="accordionTitleValue">Reupload file</span>
                                    <span className="accordionIcon ${toggleReuploadOpen ? 'reverse' : ''}"></span>
                                </div>
                                ${toggleReuploadOpen && html`
                                <div className="accordionDropdown">
                                    <button className="assetDetailsButton assetSubmitButton" onClick=${handleReupload}>Reupload</button>   
                                </div>
                                `}
                            </div>

                            <div className="Accordion">
                                <div className="accordionTitle" onClick=${toggleRename}>
                                    <span className="accordionTitleValue">Rename asset</span>
                                    <span className="accordionIcon ${toggleRenameOpen ? 'reverse' : ''}"></span>
                                </div>
                                ${toggleRenameOpen && html`
                                <div className="accordionDropdown">
                                    <button className="assetDetailsButton assetSubmitButton" onClick=${() => console.log('rename asset')}>rename</button>   
                                </div>
                                `}
                            </div>

                            <div className="Accordion">
                                <div className="accordionTitle" onClick=${toggleDestroy}>
                                    <span className="accordionTitleValue">destroy asset</span>
                                    <span className="accordionIcon ${toggleDestroyOpen ? 'reverse' : ''}"></span>
                                </div>
                                ${toggleDestroyOpen && html`
                                <div className="accordionDropdown">
                                    <button className="assetDetailsButton assetSubmitButton" onClick=${() => console.log('destroy')}>destroy</button>   
                                </div>
                                `}
                            </div>
                        </div>
                        `}

                        ${state.mainnetAddress !== null && html`
                        <div className="detailsBlock detailsBlockTransferTo">
                            <div className="Accordion">
                                <div className="accordionTitle" onClick=${toggleTransferTo}>
                                    <span className="accordionTitleValue">TRANSFER TO MAINNET</span>
                                    <span className="accordionIcon ${toggleTransferToOpen ? 'reverse' : ''}"></span>
                                </div>
                                ${toggleTransferToOpen && html`
                                <div className="accordionDropdown transferToDropdown">
                                    <span>Connected Wallet: 0x...038a</span>
                                    <div><span>Transfer Cost:</span><span>.00021ETH</span></div>
                                    <button className="assetDetailsButton assetSubmitButton" onClick=${handleDeposit}>To ${networkType === 'webaverse' ? 'Mainnet' : 'Webaverse'}</button>      
                                </div>
                                `}
                            </div>
                        </div>
                        `}

                        ${isForSale ? html`
                            <div className="detailsBlock detailsBlockCancelSell">
                                <div className="Accordion">
                                    <div className="accordionTitle" onClick=${toggleCancelSale}>
                                        <span className="accordionTitleValue">Cancel sell</span>
                                        <span className="accordionIcon ${toggleCancelSaleOpen ? 'reverse' : ''}"></span>
                                    </div>
                                    ${toggleCancelSaleOpen && html`
                                    <div className="accordionDropdown">
                                        <button className="assetDetailsButton assetSubmitButton" onClick=${handleCancelSale}>Cancel</button>      
                                    </div>
                                    `}
                                </div>
                            </div>
                        ` : html`
                            ${!sellAssetShowing ? html`
                                <div className="detailsBlock detailsBlockSell">
                                    <div className="Accordion">
                                        <div className="accordionTitle" onClick=${toggleShowSellAsset}>
                                            <span className="accordionTitleValue">sell in gallery</span>
                                            <span className="accordionIcon ${sellAssetShowing ? 'reverse' : ''}"></span>
                                        </div>
                                        
                                    </div>
                                </div>
                            `: html`
                                <div className="detailsBlock detailsBlockSell">
                                    <div className="Accordion">
                                        <div className="accordionTitle" onClick=${toggleShowSellAsset}>
                                            <span className="accordionTitleValue">sell in gallery</span>
                                            <span className="accordionIcon ${sellAssetShowing ? 'reverse' : ''}"></span>
                                        </div>
                                        <div className="accordionDropdown sellInputDropdown">
                                            <div className="sellInputLine">
                                                <div>
                                                    <span>PRICE</span>
                                                    <input className="salePrice" type="text" value=${salePrice} onChange=${(e) => { e.preventDefault(); setSalePrice( e.target.value )}} />
                                                </div>
                                                <div>
                                                    <span>QTY</span>
                                                    <input type="text" value=${quantity} onChange=${(e) => setQuantity(e.target.value)} />
                                                </div>
                                            </div>
                                            <div className="sellConfirmLine">
                                                <button className="assetDetailsButton assetSubmitButton assetSubmitButtonSmall" onClick=${handleSellAsset}>Sell</button>
                                                <button className="assetDetailsButton assetSubmitButton assetSubmitButtonSmall" onClick=${handleHideSellAsset}>Cancel</button>             
                                            </div>
                                        </div>
                                        
                                    </div>
                                </div>
                            `}
                        `}
                    ` : html`
                    ${/* USER DOES NOT OWN THIS ASSET */ ''}
                            ${isForSale && buyPrice !== undefined && buyPrice !== null && buyPrice !== "" ? html`
                            <div className="detailsBlock detailsBlockOnSale">
                                <div className="Accordion">
                                    <div className="accordionTitle" onClick=${toggleOnSale}>
                                        <span className="accordionTitleValue">ON SALE FOR ${buyPrice}Ψ</span>
                                        <span className="accordionIcon ${toggleOnSaleOpen ? 'reverse' : ''}"></span>
                                    </div>
                                    ${toggleOnSaleOpen && html`
                                    <div className="accordionDropdown accordionDropdownWithConfirm">
                                        <button className="assetDetailsButton assetSubmitButton ${toggleDropdownConfirmOpen ? 'disable' : ''}" onClick=${toggleDropdownConfirm}>Buy Asset</button>         
                                        ${toggleDropdownConfirmOpen && html`
                                            <div className="accordionDropdownConfirm">
                                                <span className="dropdownConfirmTitle">A you sure?</span>
                                                <div className="dropdownConfirmSubmit">
                                                    <button className="assetDetailsButton assetSubmitButton assetSubmitButtonSmall" onClick=${handleBuyAsset}>Buy</button>
                                                    <button className="assetDetailsButton assetSubmitButton assetSubmitButtonSmall" onClick=${toggleDropdownConfirm}>Nope</button>
                                                </div>
                                            </div>
                                        `}
                                    </div>
                                    `}
                                </div>
                            </div>    
                            ` : html`
                            <div className="detailsBlock detailsBlockOnSale">
                                <div className="Accordion">
                                    <div className="accordionTitle" onClick=${toggleOnSale}>
                                        <span className="accordionTitleValue">ON SALE FOR ${buyPrice}Ψ</span>
                                        <span className="accordionIcon ${toggleOnSaleOpen ? 'reverse' : ''}"></span>
                                    </div>
                                    ${toggleOnSaleOpen && html`
                                    <div className="accordionDropdown">
                                        <p className="onSaleWarning">Not for sale</p>            
                                    </div>
                                    `}
                                </div>
                            </div>   
                            `}
                        `}
                    <button className="assetDetailsButton assetDetailsCloseButton" onClick=${hideDetails}></button>
                </div>
            </div>
        </div>
    `;
};

export default AssetDetails;
