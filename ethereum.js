import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;
import addresses from 'https://contracts.webaverse.com/ethereum/address.js';
import abis from 'https://contracts.webaverse.com/ethereum/abi.js';
let {
  main: {Account: AccountAddress, FT: FTAddress, NFT: NFTAddress, FTProxy: FTProxyAddress, NFTProxy: NFTProxyAddress},
  sidechain: {Account: AccountAddressSidechain, FT: FTAddressSidechain, NFT: NFTAddressSidechain, FTProxy: FTProxyAddressSidechain, NFTProxy: NFTProxyAddressSidechain},
} = addresses;
let {Account: AccountAbi, FT: FTAbi, FTProxy: FTProxyAbi, NFT: NFTAbi, NFTProxy: NFTProxyAbi} = abis;

(async () => {
  const web3 = {
    main: new Web3(window.ethereum),
    sidechain: new Web3(new Web3.providers.HttpProvider('http://13.56.80.83:8545')),
  };
  await window.ethereum.enable();
  
  const networkType = await web3['main'].eth.net.getNetworkType();
  if (networkType !== 'rinkeby') {
    document.write('switch to Rinkeby');
    return;
  }

  const contracts = {
    main: {
      Account: new web3['main'].eth.Contract(AccountAbi, AccountAddress),
      FT: new web3['main'].eth.Contract(FTAbi, FTAddress),
      FTProxy: new web3['main'].eth.Contract(FTProxyAbi, FTProxyAddress),
      NFT: new web3['main'].eth.Contract(NFTAbi, NFTAddress),
      NFTProxy: new web3['main'].eth.Contract(NFTProxyAbi, NFTProxyAddress),
    },
    sidechain: {
      Account: new web3['sidechain'].eth.Contract(AccountAbi, AccountAddressSidechain),
      FT: new web3['sidechain'].eth.Contract(FTAbi, FTAddressSidechain),
      FTProxy: new web3['sidechain'].eth.Contract(FTProxyAbi, FTProxyAddressSidechain),
      NFT: new web3['sidechain'].eth.Contract(NFTAbi, NFTAddressSidechain),
      NFTProxy: new web3['sidechain'].eth.Contract(NFTProxyAbi, NFTProxyAddressSidechain),
    },
  };

  // const contract = new web3.eth.Contract(FTAbi, FTAddress);
  // const proxyContract = new web3.eth.Contract(FTProxyAbi, FTProxyAddress);
  const address = web3['main'].currentProvider.selectedAddress;
  
  // contract.methods.mint('0x08E242bB06D85073e69222aF8273af419d19E4f6', '0x1', 1).send({from: address})

  const sidechainSeedPhrase = 'fox acquire elite cave behave fine doll inch ride rely small pause';
  const sidechainWallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(sidechainSeedPhrase)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const sidechainAddress = sidechainWallet.getAddressString();
  const sidechainAddressInverse = '0x' + web3['main'].utils.padLeft(
    new web3['main'].utils.BN(sidechainAddress.slice(2), 16).xor(new web3['main'].utils.BN('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', 16)).toString(16),
    40
  );
  const sidechainPrivateKey = sidechainWallet.getPrivateKeyString();

  window.Web3 = Web3;
  window.bip39 = bip39;
  window.hdkey = hdkey;
  window.web3 = web3;
  window.contracts = contracts;
  window.test1 = async () => {
    try {
      const tx = contracts.sidechain.FT.methods.addAllowedMinter(FTProxyAddressSidechain);
      const data = tx.encodeABI();
      const gas = await tx.estimateGas({
        from: sidechainAddress,
      });
      console.log('got data gas', data, gas);
      const signedTransaction = web3['sidechain'].eth.accounts.signTransaction({
        // this could be provider.addresses[0] if it exists
        from: sidechainAddress, 
        // this encodes the ABI of the method and the arguements
        data,
        gas,
      }, sidechainPrivateKey);
      console.log('got signed', sidechainWallet);

      // web3[chainName].eth.accounts.sign(hashedMessage, wallet.getPrivateKeyString())
    } catch(err) {
      console.warn('could not enable FT minting');
    }
  };
  window.test = async () => {
    const address = web3['main'].currentProvider.selectedAddress;

    const _testFt = async () => {
      /* // allow FT minting
      await Promise.all([
        contracts.main.FT.methods.addAllowedMinter(FTProxyAddress).send({
          from: address,
        }),
        contracts.sidechain.FT.methods.addAllowedMinter(FTProxyAddressSidechain).send({
          from: address,
        }),
      ]); */

      // mint on main
      const ftAmount = {
        t: 'uint256',
        v: new web3['main'].utils.BN(1),
      };
      await contracts.main.FT.methods.mint(address, ftAmount.v).send({
        from: address,
      });
      
      // deposit on main
      const receipt = await contracts.main.FT.methods.transfer(sidechainAddressInverse, ftAmount.v).send({
        from: address,
      });

      const signature = await fetch(`https://sign.exokit.org/main/FT/${receipt.transactionHash}`).then(res => res.json());
      console.log('got sig', `https://sign.exokit.org/main/FT/${receipt.transactionHash}`, signature);
      debugger;
      const {amount, timestamp, r, s, v} = signature;

      /* // get main deposit receipt signature
      console.log('got main ft deposit receipt', receipt);
      const {transactionHash} = receipt;
      const timestamp = {
        t: 'uint256',
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
      console.log('got', JSON.stringify({r, s, v}, null, 2)); */

      // withdraw receipt signature on sidechain
      {
        const tx = contracts.sidechain.FTProxy.methods.withdraw(sidechainAddress, amount, timestamp, r, s, v);
        const data = tx.encodeABI();
        const gas = await tx.estimateGas({
          from: sidechainAddress,
        });
        // console.log('got data gas', data, gas);
        const signedTransaction = web3['sidechain'].eth.accounts.signTransaction({
          // this could be provider.addresses[0] if it exists
          from: sidechainAddress, 
          // this encodes the ABI of the method and the arguements
          data,
          gas,
        }, sidechainPrivateKey);
        console.log('got signed tx', signedTransaction);
      }
      /* await contracts.sidechain.FTProxy.methods.withdraw(sidechainAddress, amount, timestamp, r, s, v).send({
        from: address,
      }); */
      
      console.log('FT OK');
    };
    const _testNft = async () => {
      await Promise.all([
        contracts.main.NFT.methods.addAllowedMinter(NFTProxyAddress).send({
          from: address,
        }),
        contracts.sidechain.NFT.methods.addAllowedMinter(NFTProxyAddressSidechain).send({
          from: address,
        }),
        contracts.main.NFT.methods.setApprovalForAll(NFTProxyAddress, true).send({
          from: address,
        }),
        contracts.sidechain.NFT.methods.setApprovalForAll(NFTProxyAddressSidechain, true).send({
          from: address,
        }),
      ]);

      // mint on sidechain
      const hash = {
        t: 'uint256',
        v: new web3.utils.BN(Date.now()),
      };
      const filename = 'lol.png';
      console.log('nft', address, hash, filename, 1);
      const receipt = await contracts.sidechain.NFT.methods.mint(address, hash.v, filename, 1).send({
        from: address,
      });
      const tokenId = {
        t: 'uint256',
        v: new web3.utils.BN(receipt.events.Transfer.returnValues.tokenId),
      };
      // console.log('got receipt', [address, NFTProxyAddressSidechain, tokenId], {NFTAddress, NFTAddressSidechain, NFTProxyAddress, NFTProxyAddressSidechain});

      // deposit on sidechain
      const receipt2 = await contracts.sidechain.NFT.methods.transferFrom(address, NFTProxyAddressSidechain, tokenId.v).send({
        from: address,
      });
      console.log('got sidechain nft deposit receipt', receipt2);

      // get sidechain deposit receipt signature
      const {transactionHash} = receipt2;
      const timestamp = {
        t: 'uint256',
        // v: new web3.utils.BN(Date.now()),
        v: transactionHash,
      };
      const chainId = {
        t: 'uint256',
        v: new web3.utils.BN(2),
      };

      const filenameHash = web3.utils.sha3(filename);
      const message = web3.utils.encodePacked(address, tokenId, hash, filenameHash, timestamp, chainId);
      const hashedMessage = web3.utils.sha3(message);
      const sgn = await web3.eth.personal.sign(hashedMessage, address);
      const r = sgn.slice(0, 66);
      const s = '0x' + sgn.slice(66, 130);
      const v = '0x' + sgn.slice(130, 132);
      console.log('got', JSON.stringify({r, s, v}, null, 2));

      // withdraw receipt signature on sidechain
      // console.log('main withdraw', [address, tokenId.v.toString(10), hash.v.toString(10), filename, timestamp.v.toString(10), r, s, v]);
      await contracts.main.NFTProxy.methods.withdraw(address, tokenId.v, hash.v, filename, timestamp.v, r, s, v).send({
        from: address,
      });
      
      console.log('NFT OK');
    };
    await Promise.all([
      _testFt(),
      // _testNft(),
    ]);
    console.log('ALL OK');
  };

  const ethFtForm = document.getElementById('eth-ft-form');
  const ethFtAmountInput = document.getElementById('eth-ft-amount');
  ethFtForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();

    const amt = parseInt(ethFtAmountInput.value, 10);
    if (!isNaN(amt)) {
      const amount = {
        t: 'uint256',
        v: new web3.utils.BN(amt),
      };
      
      // deposit on main chain
      const receipt = await contracts.main.FT.methods.transfer(FTProxyAddress, amount.v).send({
        from: address,
      });

      // get main chain deposit receipt signature
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
    } else {
      console.log('failed to parse', JSON.stringify(ethFtAmountInput.value));
    }
  });
  
  const ethNftForm = document.getElementById('eth-nft-form');
  const ethNftIdInput = document.getElementById('eth-nft-id');
  ethNftForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();

    const id = parseInt(ethNftIdInput.value, 10);
    if (!isNaN(id)) {
      const tokenId = {
        t: 'uint256',
        v: new web3.utils.BN(id),
      };
      
      const hashSpec = await contracts.main.NFT.methods.getHash(tokenId.v).call();
      const hash = {
        t: 'uint256',
        v: new web3.utils.BN(hashSpec),
      };
      const filenameSpec = await contracts.main.NFT.methods.getMetadata(hashSpec, 'filename').call();
      const filename = {
        t: 'string',
        v: filenameSpec,
      };
      console.log('got filename hash', hash, filename);
      
      // deposit on main chain
      const receipt2 = await contracts.main.NFT.methods.transferFrom(address, NFTProxyAddress, tokenId.v).send({
        from: address,
      });
      console.log('got receipt', receipt2);

      // get main chain deposit receipt signature
      const {transactionHash} = receipt2;
      const timestamp = {
        t: 'uint256',
        // v: new web3.utils.BN(Date.now()),
        v: transactionHash,
      };
      const chainId = {
        t: 'uint256',
        v: new web3.utils.BN(4),
      };

      const filenameHash = web3.utils.sha3(filename.v);
      const message = web3.utils.encodePacked(address, tokenId, hash, filenameHash, timestamp, chainId);
      const hashedMessage = web3.utils.sha3(message);
      const sgn = await web3.eth.personal.sign(hashedMessage, address);
      const r = sgn.slice(0, 66);
      const s = '0x' + sgn.slice(66, 130);
      const v = '0x' + sgn.slice(130, 132);
      console.log('got', JSON.stringify({r, s, v}, null, 2));

      // withdraw receipt signature on sidechain
      // console.log('main withdraw', [address, tokenId.v.toString(10), hash.v.toString(10), filename, timestamp.v.toString(10), r, s, v]);
      await contracts.sidechain.NFTProxy.methods.withdraw(address, tokenId.v, hash.v, filename.v, timestamp.v, r, s, v).send({
        from: address,
      });
    } else {
      console.log('failed to parse', JSON.stringify(ethNftIdInput.value));
    }
  });
  
  const sidechainFtForm = document.getElementById('sidechain-ft-form');
  const sidechainFtAmountInput = document.getElementById('sidechain-ft-amount');
  sidechainFtForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();

    const amt = parseInt(sidechainFtAmountInput.value, 10);
    if (!isNaN(amt)) {
      const amount = {
        t: 'uint256',
        v: new web3.utils.BN(amt),
      };
      
      // deposit on sidechain
      const receipt = await contracts.sidechain.FT.methods.transfer(FTProxyAddress, amount.v).send({
        from: address,
      });

      // get sidechain deposit receipt signature
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

      // withdraw receipt signature on main chain
      await contracts.main.FTProxy.methods.withdraw(address, amount.v, timestamp.v, r, s, v).send({
        from: address,
      });
    } else {
      console.log('failed to parse', JSON.stringify(sidechainFtAmountInput.value));
    }
  });
  
  const sidechainNftForm = document.getElementById('sidechain-nft-form');
  const sidechainNftIdInput = document.getElementById('sidechain-nft-id');
  sidechainNftForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    const id = parseInt(sidechainNftIdInput.value, 10);
    if (!isNaN(id)) {
      const tokenId = {
        t: 'uint256',
        v: new web3.utils.BN(id),
      };
      
      const hashSpec = await contracts.sidechain.NFT.methods.getHash(tokenId.v).call();
      const hash = {
        t: 'uint256',
        v: new web3.utils.BN(hashSpec),
      };
      const filenameSpec = await contracts.sidechain.NFT.methods.getMetadata(hashSpec, 'filename').call();
      const filename = {
        t: 'string',
        v: filenameSpec,
      };
      console.log('got filename hash', hash, filename);
      
      // deposit on sidechain
      const receipt2 = await contracts.sidechain.NFT.methods.transferFrom(address, NFTProxyAddressSidechain, tokenId.v).send({
        from: address,
      });
      console.log('got receipt', receipt2);

      // get sidechain deposit receipt signature
      const {transactionHash} = receipt2;
      const timestamp = {
        t: 'uint256',
        // v: new web3.utils.BN(Date.now()),
        v: transactionHash,
      };
      const chainId = {
        t: 'uint256',
        v: new web3.utils.BN(2),
      };

      const filenameHash = web3.utils.sha3(filename.v);
      const message = web3.utils.encodePacked(address, tokenId, hash, filenameHash, timestamp, chainId);
      const hashedMessage = web3.utils.sha3(message);
      const sgn = await web3.eth.personal.sign(hashedMessage, address);
      const r = sgn.slice(0, 66);
      const s = '0x' + sgn.slice(66, 130);
      const v = '0x' + sgn.slice(130, 132);
      console.log('got', JSON.stringify({r, s, v}, null, 2));

      // withdraw receipt signature on sidechain
      // console.log('main withdraw', [address, tokenId.v.toString(10), hash.v.toString(10), filename, timestamp.v.toString(10), r, s, v]);
      await contracts.main.NFTProxy.methods.withdraw(address, tokenId.v, hash.v, filename.v, timestamp.v, r, s, v).send({
        from: address,
      });
    } else {
      console.log('failed to parse', JSON.stringify(ethNftIdInput.value));
    }
  });
  window.testAccount = seedPhrase => {
	  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(seedPhrase)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
	  console.log('got wallet', wallet);
	  const address = wallet.getAddressString();
	  const publicKey = wallet.getPublicKeyString();
	  const privateKey = wallet.getPrivateKeyString();
	  console.log('got address', {address, publicKey, privateKey});
  };
  /* window.testEvents = async () => {
    const events = await contract.getPastEvents('Transfer', {fromBlock: 0, toBlock: 'latest',})
    for (const event of events) {
      const {returnValues} = event;
      const {from, to, value} = returnValues;
      if (to === FTProxyAddress) {
        console.log('got event', {from, to, value});
      }
    }
  }; */
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