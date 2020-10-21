import Web3 from './web3.min.js';
import bip32 from './bip32.js';
import bip39 from './bip39.js';
import addresses from 'https://contracts.webaverse.com/ethereum/address.js';
import abis from 'https://contracts.webaverse.com/ethereum/abi.js';
let {sidechain: {FT: FTAddress, FTProxy: FTProxyAddress}} = addresses;
let {FT: FTAbi, FTProxy: FTProxyAbi} = abis;

// FTAddress = `0x2e5eE6508D8c5DCd7403b0B4286500dc2Db80744`;
// FTProxyAddress = `0x9d0aA50A44B7C1CC9D668cfa09998C60e61AEB97`;

(async () => {
  const web3 = new Web3(window.ethereum);
  window.ethereum.enable();

  const contract = new web3.eth.Contract(FTAbi, FTAddress);
  const proxyContract = new web3.eth.Contract(FTProxyAbi, FTProxyAddress);
  const address = web3.currentProvider.selectedAddress;
  
  // contract.methods.mint('0x08E242bB06D85073e69222aF8273af419d19E4f6', '0x1', 1).send({from: address})

  window.Web3 = Web3;
  window.bip32 = bip32;
  window.bip39 = bip39;
  window.web3 = web3;
  window.contract = contract;
  window.address = address;
  window.test = async () => {
    const address = web3.currentProvider.selectedAddress;
    const amount = {
      t: 'uint256',
      v: new web3.utils.BN(1),
    };
    
    const receipt = await contract.methods.transfer(FTProxyAddress, amount.v).send({
      from: address,
    });
    console.log('got receipt', receipt);
    const {transactionHash} = receipt;
    
    const timestamp = {
      t: 'uint256',
      // v: new web3.utils.BN(Date.now()),
      v: transactionHash,
    };
    const chainId = {
      t: 'uint256',
      v: new web3.utils.BN(1),
    };

    const message = web3.utils.encodePacked(address, amount, timestamp, chainId);
    const hashedMessage = web3.utils.sha3(message);
    const sgn = await web3.eth.personal.sign(hashedMessage, address);
    const r = sgn.slice(0, 66);
    const s = '0x' + sgn.slice(66, 130);
    const v = '0x' + sgn.slice(130, 132);
    console.log('got', JSON.stringify({r, s, v}, null, 2));

    await proxyContract.methods.withdraw(address, amount.v, timestamp.v, r, s, v).send({
      from: address,
    });
  };
  window.testEvents = async () => {
    const events = await contract.getPastEvents('Transfer', {fromBlock: 0, toBlock: 'latest',})
    for (const event of events) {
      const {returnValues} = event;
      const {from, to, value} = returnValues;
      if (to === FTProxyAddress) {
        console.log('got event', {from, to, value});
      }
    }
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