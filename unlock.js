import * as THREE from './three.module.js';
// import {GLTFLoader} from './GLTFLoader.js';
// import {GLTFExporter} from './GLTFExporter.js';
// import {makePromise, downloadFile, convertMeshToPhysicsMesh} from './util.js';
// import {loginManager} from './login.js';
import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;
import {web3, contracts, getNetworkName, getMainnetAddress, runSidechainTransaction, runMainnetTransaction} from './blockchain.js';

const unlocksForm = document.getElementById('unlocks-form');
const submitButton = document.getElementById('submit-button');
const unlocksEl = document.getElementById('unlocks');

const m = "Proof of address.";
// const id = 82;

(async () => {
  await loginManager.waitForLoad();
  
  window.Web3 = Web3;
  window.mainnet = web3.mainnet;
  window.mainnetsidechain = web3.mainnetsidechain;

  submitButton.removeAttribute('disabled');
  unlocksForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    const ethereumSpec = await window.ethereum.enable();
    // const [address] = ethereumSpec;

    if (window.ethereum) {
      const mainnetAddress = web3.mainnet.currentProvider.selectedAddress;
      const sidechainAddress = await loginManager.getAddress();
    
      const _getMainnetTokens = async address => {
        const res = await fetch(`https://mainnet-tokens.webaverse.com/${address}`);
        const j = await res.json();
        return j;
      };
      // const tokens = await _getMainnetTokens('0x84310641ea558c5e2f86bfe4f95d426d4f3c7360');
      // console.log('got tokens', tokens);      
      const _getSidechainTokens = async address => {
        const res = await fetch(`https://tokens.webaverse.com/${address}`);
        const j = await res.json();
        return j;
      };
      const _getMainnetSignature = async () => {
        const result1 = await window.ethereum.enable();
        const signature = await web3.mainnet.eth.personal.sign(m, web3.mainnet.currentProvider.selectedAddress);
        const result3 = await web3.mainnet.eth.personal.ecRecover(m, signature);
        // console.log('got sig 1', {signature});
        return signature;
      };
      const _getSidechainSignature = async () => {
        const mnemonic = await loginManager.getMnemonic();
        const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
        const privateKey = wallet.getPrivateKey().toString('hex');

        const result2 = await web3.mainnetsidechain.eth.accounts.sign(m, privateKey);
        const {v, r, s, signature} = result2;
        const result3 = await web3.mainnetsidechain.eth.accounts.recover(m, v, r, s);
        // console.log('got sig 2', {signature});
        return signature;
      };
      const _getUnlockable = async (signatures, id) => {
        const res = await fetch('https://unlock.exokit.org/', {
          method: 'POST',
          body: JSON.stringify({
            signatures,
            id,
          }),
        });
        const j = await res.json();
        return j;
      };
      
      const [
        mainnetTokens,
        sidechainTokens,
        mainnetSignature,
        sidechainSignature,
      ] = await Promise.all([
        _getMainnetTokens(mainnetAddress),
        _getSidechainTokens(sidechainAddress),
        _getMainnetSignature(),
        _getSidechainSignature(),
      ]);
      const allTokens = mainnetTokens.concat(sidechainTokens);
      for (let i = 0; i < allTokens.length; i++) {
        const token = allTokens[i];
        const {id, unlockable} = token;

        const {ok, result} = await _getUnlockable([
          mainnetSignature,
          sidechainSignature,
        ], id);
        if (ok) {
          token.unlocked = result;
        } else {
          token.unlocked = null;
        }
      }
      
      console.log('get all tokens', allTokens);
      
      unlocksEl.innerHTML = allTokens.map(t => `<li class=token>
        ${t.id} - ${t.properties.hash} - ${t.properties.name} - ${t.properties.ext} - ${t.properties.unlockable} = ${t.unlocked}
      </li>`).join('\n');
      // console.log('got results', results);
    }
  });
})();