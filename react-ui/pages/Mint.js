import { React, useEffect } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const MintingPage = () => {
  
  let currentStep = 1;

  const pageOne = html`
    <h3>Upload a file to use for your asset</h3>

    <p> Form Stuff Here </p>

    <button class="button mintPageUploadButton">Upload</button>
  `

  const pageTwo = html`
    <h3>Name, Description</h3>

    <p> Form Stuff Here </p>

    <button class="button mintPageContinueButton">Continue</button>
    <button class="button mintPageBackButton">Upload Again</button>
    `
  
    const pageThree = html`
      <h3>Ready For Minting</h3>

    <p> This token will be deposited in your Webaverse wallet with the address: </p>
  <p> Quantity</p>
  <p> You Have </p>
    <button class="button mintPageMintButton">Mint NFT</button>
    <button class="button mintPageBackButton">Edit Asset</button>
  `

    return html`
      <div class="mintPage">
        <div class="mintPageHeader">
          <span class="mintPageHeaderStepOne ${currentStep ? 'selected' : ''}">1: Upload File</span>
          <span class="mintPageHeaderStepTwo ${currentStep ? 'selected' : ''}">2: Prepare Asset</span>
          <span class="mintPageHeaderStepTwo ${currentStep ? 'selected' : ''}">3: Mint Token</span>
        </div>
        <div class="mintPageBody">
          ${currentStep===1 ? pageOne : currentStep===2 ? pageTwo : currentStep===3 ? pageThree : pageOne }
        </div>


      </div>
    `;
  };

  export default MintingPage;
