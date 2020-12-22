import { React, useEffect, useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import { Context } from '../constants/Context.js';
import htm from '../web_modules/htm.js';
import css from '../web_modules/csz.js';
import ActionTypes from '../constants/ActionTypes.js';
import { mintNft } from '../functions/AssetFunctions.js';
import Card  from './AssetCard.js'

const styles = css`${window.locationSubdirectory}/components/MintPage.css`

const html = htm.bind(React.createElement)

const MintingPage = () => {
  const { state, dispatch } = useContext(Context);
  let [currentStep, setCurrentStep] = useState(1);

  const headerTitleImg = window.locationSubdirectory + "/images/Gallery_Subheader_Background.svg";

  // Current file
  let [file, setFile] = useState(null);

  let [imagePreview, setImagePreview] = useState(null);

  // Current name
  let [name, setName] = useState("");

  // current description
  let [description, setDescription] = useState("");

  // number to mint
  let [quantity, setQuantity] = useState(1);

  let [mintedState, setMintedState] = useState(null);

  let [mintFee, setMintFee] = useState(10);

  const mintAnotherNft = (e) => {    
    e.preventDefault();
    setFile(null);
    setImagePreview(null);
    setName("");
    setDescription("");
    setQuantity(1);
    setMintedState(null);
    setCurrentStep(1)
  }

  const backToUpload = (e) => {
    e.preventDefault();
    setCurrentStep(1)
  }

  const submitDetails = (e) => {
    e.preventDefault();
    setCurrentStep(3)
  }

  const backToDetails = (e) => {
    e.preventDefault();
    setCurrentStep(2)
  }

  const handleMintNftButton = (e) => {
    // TODO: On minted, refresh user's gallery
    e.preventDefault();
    mintNft(file,
            name,
            description,
            quantity,
            (err) => {
              console.error("Minting failed", err);
              setMintedState('error')},
            () => {
              console.log("Success callback!"); 
              dispatch({type: ActionTypes.UpdateInventory, payload: {address: state.address }});
              setMintedState('success')
          },
          state
          );
    setCurrentStep(4);
  }

  const handleFileUpload = e => {
    const [file] = e.target.files;
    if (file) {
      let reader = new FileReader();
      reader.onloadend = () => {
        setFile(file);
        setImagePreview(reader.result);
        setCurrentStep(2)
      }
      reader.readAsDataURL(file);
    }
    else console.warn("Didnt upload file");
  };

  const handleSetName = (e) => { 
    setName(e.target.value)
  }

  const handleSetDescription = (e) => setDescription(e.target.value);

  
  const MintPageHeader = () => html`
    <div className="mintPageHeader">
    <div className=" mintHeaderTitle">
      <span className="headerTitleValue">THE FORGE</span>
      <img className="headerTitleImg" src="${headerTitleImg}" />
    </div>
      <div>
        <div className="mintPageHeaderStep ${currentStep === 1 ? 'selected' : ''}">
          <span className="mintPageHeaderNumber ${currentStep === 1 ? 'selected' : ''}">1</span>
          <span className="mintPageHeaderAction ${currentStep === 1 ? 'selected' : ''}">Upload File</span>
        </div>
        <div className="mintPageHeaderStep ${currentStep === 2 ? 'selected' : ''}">
          <span className="mintPageHeaderNumber ${currentStep === 2 ? 'selected' : ''}">2</span>
          <span className="mintPageHeaderAction ${currentStep === 2 ? 'selected' : ''}">Prepare Asset</span>
        </div>
        <div className="mintPageHeaderStep ${currentStep === 3 || currentStep === 4 ? 'selected' : ''}">
          <span className="mintPageHeaderNumber ${currentStep === 3 || currentStep === 4 ? 'selected' : ''}">3</span>
          <span className="mintPageHeaderAction ${currentStep === 3 || currentStep === 4 ? 'selected' : ''}">Mint Token</span>
        </div>
      </div>
    </div>
  `

  const pageOne = html`
    <div className="mintPageBody">
      <form className="mintPageBodyFormOne">
        <h3 className="mintPageBodyTitleOne">Upload a file to use for your asset:</h3>
        <div>
          <span className="mintNftImageUploadSing">no file chosen</span>
          <div className="mintNftImageUpload">
            <label htmlFor="input-file" className="mintNftImageUploadBtn"><span>choose file</span></label>
            <input type="file" id="input-file" onChange=${handleFileUpload} multiple=${false} />
          </div>
        </div>
      </form>
    </div>
  `

  const pageTwo = html`
    <div className="mintPageBody">
      <form className="mintPageBodyFormTwo">
        <div className="mintNftImageContainer">
          ${imagePreview !== null && html`
            <img src=${imagePreview} className="mintNftImagePreview"/>
          `}
        </div>
        <div className="mintPageFormTwoContainer">
          <h3 className="mintNftNameLabel">Name</h3>
          <input type="text" className="mintNftName" maxLength=24 placeholder="Name" onChange=${handleSetName} />
          <h3 className="mintNftNameLabel">Description</h3>
          <textarea className="mintNftDescription scroll" rows="2" maxLength=140 placeholder="Description" onChange=${handleSetDescription} />
          <div>
            <button className="button mintPageBackButton" onClick=${backToUpload}>Upload Again</button>
            <button className="button mintPageContinueButton" onClick=${submitDetails}>Continue</button>
          </div>
        </div>
      </form>
    </div>
    `

    const tempCardData = {
      id: 1,
      assetName: 'My Cool Item',
      description: 'This is the first avatar I’ve uploaded to the Webaverse.',
      image: imagePreview,
      hash: '0x35ddcd7d8b66f1331f77186af17dbcf231909433',
      ext: 'jpg',
      totalSupply: 1,
      numberInEdition: 1,
      balance: 2000,
      ownerAvatarPreview: imagePreview,
      ownerUsername: 'Paul',
      ownerAddress: null,
      minterAvatarPreview: imagePreview,
      minterAddress: null,
      minterUsername: null,
      cardSize: "large",
      networkType: 'webaverse',
      onClickFunction: null,
    }

    const pageThree = html`
    <div className="mintPageBody">
      <form className="mintPageBodyFormThree flex">
        <${Card} ...${tempCardData} />
        <div className="mintPageFormThreeContainer flex">
          <h3 className="mintPageBodyTitleThree">Ready For Minting</h3>
          <div className="flex">  
            <span className="mintPageBodyWalletSing">This token will be deposited in your Webaverse wallet with the address:</span>
            <span className="mintPageBodyWalletAdress">0x35ddcd7d8b66f1331f77186af17dbcf231909433</span>
          </div>
          <div className="mintPageBodyQuantity flex">
            <span>quantity</span>
            <input type="number" min=1 className="mintPageBodyQuantitySet" value=${quantity} onChange=${(e) => setQuantity(e.target.value)} />
          </div>
          <div className="mintPageBodyMintingFee flex">
            <span>minting fee:</span>
            <span className="mintPageBodyMintingFeeValue">${mintFee}Ψ</span>
          </div>
          <div className="mintPageBodyYouHave flex unselected">
            <span>you have:</span>
            <span className="mintPageBodyYouHaveValue">1208Ψ</span>
          </div>
          <div className="mintPageButtons flex">
            <button className="button mintPageBackButton" onClick=${backToDetails}>Edit Asset</button>
            <button className="button mintPageMintButton" onClick=${handleMintNftButton}>MINT</button>
          </div>
        </div>
      </form>
    </div>
  `
 
  const pageFour = html`
  ${mintedState === 'success' ? html`
    <div className="mintPageBody">
    <h3>New Asset Created!</h3>
    <p> This token has been deposited in your Webaverse wallet with the address: </p>
    <button className="button mintPageMintButton" onClick=${mintAnotherNft}>Mint another NFT</button>
    </div>` :
    mintedState === 'error' ? html`
    <div className="mintPageBody">
      <h3>Error</h3>
      <p>Failed to upload your asset. Please try again.</p>
    </div>` : html`
    <div className="mintPageBody">
      <h3>Minting In Progress</h3>
      <p>Please stand by...</p>
    </div>
`}

`
    return html`
      <div className="${styles} mintPage">
      <${MintPageHeader} />
          ${currentStep === 1 ? pageOne : currentStep === 2 ? pageTwo : currentStep === 3 ? pageThree : currentStep === 4 ? pageFour : pageOne }
        </div>
    `;
  };

  export default MintingPage;