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
  window.test = async () => {
    const msg = 'lol';
    var h = web3.utils.sha3(msg)
    var sgn = await web3.eth.personal.sign(h, address)
    const r = sgn.slice(0,66)
    const s = '0x' + sgn.slice(66,130)
    const v = '0x' + sgn.slice(130,132)
    console.log('got', [r, s, v]);
  };
  /* function verify() internal pure returns(bool) {
    bytes memory prefix = "\x19Ethereum Signed Message:\n32";
    bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, keccak256("lol")));
    
    bytes32 r = 0x759061c199709771981bae805bda38365fe8097325a407d454874e846c3af062;
    bytes32 s = 0x01dba57498cd4e2dae4d11a5d2a62bcea9cd50c04b7a8e4b625567d96cf30441;
    uint8 v = 0x1b;
    
    address a = 0x08E242bB06D85073e69222aF8273af419d19E4f6;
    
    return ecrecover(prefixedHash, v, r, s) == a;
  } */
})();