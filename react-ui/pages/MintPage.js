import { React, useEffect, useState } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const MintingPage = () => {
  let [currentStep, setCurrentStep] = useState(1);

  function submitUpload(e){
    e.preventDefault();
    setCurrentStep(2)
  }

  function backToUpload(e){
    e.preventDefault();
    setCurrentStep(1)
  }

  function submitDetails(e){
    e.preventDefault();
    setCurrentStep(3)
  }

  function backToDetails(e){
    e.preventDefault();
    setCurrentStep(2)
  }

  function mintNft(e){
    e.preventDefault();
    setCurrentStep(4)
  }


  const pageOne = html`
    <h3>Upload a file to use for your asset</h3>

    <p> Form Stuff Here </p>

    <button class="button mintPageUploadButton" onClick=${submitUpload}>Upload</button>
  `

  const pageTwo = html`
    <h3>Name, Description</h3>

    <p> Form Stuff Here </p>

    <button class="button mintPageContinueButton" onClick=${submitDetails}>Continue</button>
    <button class="button mintPageBackButton" onClick=${backToUpload}>Upload Again</button>
    `
  
    const pageThree = html`
      <h3>Ready For Minting</h3>

    <p> This token will be deposited in your Webaverse wallet with the address: </p>
  <p> Quantity</p>
  <p> You Have </p>
    <button class="button mintPageMintButton" onClick=${mintNft}>Mint NFT</button>
    <button class="button mintPageBackButton" onClick=${backToDetails}>Edit Asset</button>
  `

    
  const pageFour = html`
  <h3>New Asset Created!</h3>

  <p> This token has been deposited in your Webaverse wallet with the address: </p>
  <button class="button mintPageMintButton" onClick=${backToUpload}>Mint another NFT</button>
`
    return html`
      <div class="mintPage">
        <div class="mintPageHeader">
          <span class="mintPageHeaderStepOne ${currentStep === 1 ? 'selected' : ''}">1: Upload File</span>
          <span class="mintPageHeaderStepTwo ${currentStep === 2 ? 'selected' : ''}">2: Prepare Asset</span>
          <span class="mintPageHeaderStepTwo ${currentStep === 3 ? 'selected' : ''}">3: Mint Token</span>
        </div>
        <div class="mintPageBody">
          ${currentStep === 1 ? pageOne : currentStep === 2 ? pageTwo : currentStep === 3 ? pageThree : currentStep === 4 ? pageFour : pageOne }
        </div>
      </div>
    `;
  };

  export default MintingPage;
