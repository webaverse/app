import { React, useEffect, useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import { Context } from '../constants/Context.js';
import htm from '/web_modules/htm.js';
import css from '../web_modules/csz.js';
import ActionTypes from '../constants/ActionTypes.js';
const styles = css`/components/MintPage.css`

const html = htm.bind(React.createElement)

const MintingPage = () => {
  const { dispatch } = useContext(Context);
  let [currentStep, setCurrentStep] = useState(1);

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

  const mintAnotherNft = (e) => {    
    e.preventDefault();
    setFile(null);
    setImagePreview(null);
    setName("");
    setDescription("");
    setQuantity(1);
    setMinted(null);
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

  const mintNft = (e) => {
    e.preventDefault();
    dispatch({ type: ActionTypes.MintNft,
        payload:
          { file,
            name,
            description,
            quantity,
            errorCallback: () => { console.error("Minting failed"); setMintedState('error')},
            successCallback: () => { console.log("Success callback!"); setMintedState('success') }
          }});
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
    console.log("Setting name to", e.target.value);
  }

  const handleSetDescription = (e) => setDescription(e.target.value);


  const MintPageHeader = () => html`
    <div className="mintPageHeader">
      <div className="mintPageHeaderStepOne ${currentStep === 1 ? 'selected' : ''}">
        <span className="mintpageHeaderNumber ${currentStep === 1 ? 'selected' : ''}">1</span>
        <span className="mintpageHeaderAction ${currentStep === 1 ? 'selected' : ''}">Upload File</span>
      </div>
      <div className="mintPageHeaderStepOne ${currentStep === 2 ? 'selected' : ''}">
        <span className="mintpageHeaderNumber ${currentStep === 2 ? 'selected' : ''}">2</span>
        <span className="mintpageHeaderAction ${currentStep === 2 ? 'selected' : ''}">Prepare Asset</span>
      </div>
      <div className="mintPageHeaderStepOne ${currentStep === 3 || currentStep === 4 ? 'selected' : ''}">
        <span className="mintpageHeaderNumber ${currentStep === 3 || currentStep === 4 ? 'selected' : ''}">3</span>
        <span className="mintpageHeaderAction ${currentStep === 3 || currentStep === 4 ? 'selected' : ''}">Mint Token</span>
      </div>
    </div>
  `

  const pageOne = html`
    <div className="mintPageBody">
    <form>
      <h3>Upload a file to use for your asset</h3>
      <input type="file" className="mintNftImageUpload" onChange=${handleFileUpload} multiple=${false} />
      </form>
    </div>
  `

  const pageTwo = html`
    <div className="mintPageBody">
    <form>
      <h3>Name, Description</h3>
      <input type="text" className="mintNftName" placeholder="Name" onChange=${handleSetName} />
      <input type="text" className="mintNftDescription" placeholder="Description" onChange=${handleSetDescription} />
      <button className="button mintPageContinueButton" onClick=${submitDetails}>Continue</button>
      <button className="button mintPageBackButton" onClick=${backToUpload}>Upload Again</button>
      ${imagePreview !== null && html`
        <img src=${imagePreview} />
      `}
      </form>
    </div>
    `
  
    const pageThree = html`
    <div className="mintPageBody">
      <h3>Ready For Minting</h3>
      <input type="number" className="mintNftImageUpload" value=1 onChange=${(e) => setQuantity(e.target.value)} />
      <button className="button mintPageMintButton" onClick=${mintNft}>Mint NFT</button>
      <button className="button mintPageBackButton" onClick=${backToDetails}>Edit Asset</button>
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
