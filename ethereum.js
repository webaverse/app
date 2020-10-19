import Web3 from './web3.min.js';
import contractAddress from 'https://contracts.webaverse.com/ethereum/address.js';
import contractAbi from 'https://contracts.webaverse.com/ethereum/abi.js';

(async () => {
  const web3 = new Web3(window.ethereum);
  window.ethereum.enable();

  const contract = new web3.eth.Contract(contractAbi, contractAddress);
  const address = web3.currentProvider.selectedAddress;
  
  // contract.methods.mint('0x08E242bB06D85073e69222aF8273af419d19E4f6', '0x1', 1).send({from: address})

  window.Web3 = Web3;
  window.web3 = web3;
  window.contract = contract;
  window.address = address;
})();