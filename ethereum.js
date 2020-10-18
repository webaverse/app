import Web3 from './web3.min.js';
import contractAddress from 'https://contracts.webaverse.com/ethereum/address.js';
import contractAbi from 'https://contracts.webaverse.com/ethereum/abi.js';

/* const _fetchJson = async u => {
  const res = await fetch(u);
  const j = await res.json();
  return j;
}; */

(async () => {
  const web3 = new Web3(window.ethereum);
  window.ethereum.enable();

  const contract = new web3.eth.Contract(contractAbi, contractAddress);
  const address = web3.currentProvider.selectedAddress;

  window.Web3 = Web3;
  window.web3 = web3;
  window.contract = contract;
  window.address = address;
})();