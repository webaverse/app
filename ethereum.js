import Web3 from './web3.min.js';
import bip32 from './bip32.js';
import bip39 from './bip39.js';
import addresses from 'https://contracts.webaverse.com/ethereum/address.js';
import abis from 'https://contracts.webaverse.com/ethereum/abi.js';
let {
  main: {Account: AccountAddress, FT: FTAddress, NFT: NFTAddress, FTProxy: FTProxyAddress, NFTProxy: NFTProxyAddress},
  sidechain: {Account: AccountAddressSidechain, FT: FTAddressSidechain, NFT: NFTAddressSidechain, FTProxy: FTProxyAddressSidechain, NFTProxy: NFTProxyAddressSidechain},
} = addresses;
let {Account: AccountAbi, FT: FTAbi, FTProxy: FTProxyAbi, NFT: NFTAbi, NFTProxy: NFTProxyAbi} = abis;

(async () => {
  const web3 = new Web3(window.ethereum);
  window.ethereum.enable();

  const contracts = {
    main: {
      Account: new web3.eth.Contract(AccountAbi, AccountAddress),
      FT: new web3.eth.Contract(FTAbi, FTAddress),
      FTProxy: new web3.eth.Contract(FTProxyAbi, FTProxyAddress),
      NFT: new web3.eth.Contract(NFTAbi, NFTAddress),
      NFTProxy: new web3.eth.Contract(NFTProxyAbi, NFTProxyAddress),
    },
    sidechain: {
      Account: new web3.eth.Contract(AccountAbi, AccountAddressSidechain),
      FT: new web3.eth.Contract(FTAbi, FTAddressSidechain),
      FTProxy: new web3.eth.Contract(FTProxyAbi, FTProxyAddressSidechain),
      NFT: new web3.eth.Contract(NFTAbi, NFTAddressSidechain),
      NFTProxy: new web3.eth.Contract(NFTProxyAbi, NFTProxyAddressSidechain),
    },
  };

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
    const _testFt = async () => {
      const address = web3.currentProvider.selectedAddress;
      
      // allow FT minting
      await Promise.all([
        contracts.main.FT.methods.addAllowedMinter(FTProxyAddress).send({
          from: address,
        }),
        contracts.sidechain.FT.methods.addAllowedMinter(FTProxyAddressSidechain).send({
          from: address,
        }),
      ]);

      // mint on main
      const amount = {
        t: 'uint256',
        v: new web3.utils.BN(1),
      };
      await contracts.main.FT.methods.mint(web3.currentProvider.selectedAddress, 1).send({
        from: address,
      });
      
      // deposit on main
      const receipt = await contracts.main.FT.methods.transfer(FTProxyAddress, 1).send({
        from: address,
      });

      // get receipt signature
      console.log('got receipt', receipt);
      const {transactionHash} = receipt;
      const timestamp = {
        t: 'uint256',
        // v: new web3.utils.BN(Date.now()),
        v: transactionHash,
      };
      const chainId = {
        t: 'uint256',
        v: new web3.utils.BN(3),
      };
      const message = web3.utils.encodePacked(address, amount, timestamp, chainId);
      const hashedMessage = web3.utils.sha3(message);
      const sgn = await web3.eth.personal.sign(hashedMessage, address);
      const r = sgn.slice(0, 66);
      const s = '0x' + sgn.slice(66, 130);
      const v = '0x' + sgn.slice(130, 132);
      console.log('got', JSON.stringify({r, s, v}, null, 2));

      // withdraw receipt signature on sidechain
      await contracts.sidechain.FTProxy.methods.withdraw(address, amount.v, timestamp.v, r, s, v).send({
        from: address,
      });
    };
    await _testFt();
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