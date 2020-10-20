import Web3 from './web3.min.js';
import contractAddress from 'https://contracts.webaverse.com/ethereum/address.js';
import contractAbi from 'https://contracts.webaverse.com/ethereum/abi.js';

// const _numberToHex = n => '0x' + web3.utils.padLeft(new web3.utils.BN(n).toString(16), 32);

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
    const to = '0x08E242bB06D85073e69222aF8273af419d19E4f6';
    const amount = {t: 'uint256', v: new web3.utils.BN(1).toString(10) };
    const timestamp = {t: 'uint256', v: new web3.utils.BN(10).toString(10) };
    const chainId = {t: 'uint256', v: new web3.utils.BN(1).toString(10) };
    const message = web3.utils.encodePacked(to, amount, timestamp, chainId);
    const hashedMessage = web3.utils.sha3(message);
    console.log('got message', {to, amount, timestamp, message, hashedMessage});
    const sgn = await web3.eth.personal.sign(hashedMessage, address);
    const r = sgn.slice(0, 66);
    const s = '0x' + sgn.slice(66, 130);
    const v = '0x' + sgn.slice(130, 132);
    console.log('got', JSON.stringify({r, s, v}, null, 2));
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
  /*
    const events = await contract.getPastEvents('Transfer', {fromBlock: 0, toBlock: 'latest',})
    for (const event of events) {
      const {returnValues} = event;
      const {from, to, amount} = returnValues;
    }
  */
})();