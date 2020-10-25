import storage from './storage.js';
import Web3 from './web3.min.js';
import bip39 from './bip39.js';
import hdkeySpec from './hdkey.js';
const hdkey = hdkeySpec.default;
import ethereumJsTx from './ethereumjs-tx.js';
// import ethereumJsTx from './ethereumjs-tx2.js';
const {Transaction, Common} = ethereumJsTx;
// Transaction.prototype.getChainId = () => 1337;
import addresses from 'https://contracts.webaverse.com/ethereum/address.js';
import abis from 'https://contracts.webaverse.com/ethereum/abi.js';
let {
  main: {Account: AccountAddress, FT: FTAddress, NFT: NFTAddress, FTProxy: FTProxyAddress, NFTProxy: NFTProxyAddress},
  sidechain: {Account: AccountAddressSidechain, FT: FTAddressSidechain, NFT: NFTAddressSidechain, FTProxy: FTProxyAddressSidechain, NFTProxy: NFTProxyAddressSidechain},
} = addresses;
let {Account: AccountAbi, FT: FTAbi, FTProxy: FTProxyAbi, NFT: NFTAbi, NFTProxy: NFTProxyAbi} = abis;

const web3Endpoint = 'http://13.56.80.83:8545';
const storageHost = 'https://storage.exokit.org';
const discordOauthUrl = `https://discord.com/api/oauth2/authorize?client_id=684141574808272937&redirect_uri=https%3A%2F%2Fapp.webaverse.com%2Fdiscordlogin.html&response_type=code&scope=identify`;

(async () => {
  const web3 = {
    main: new Web3(window.ethereum),
    sidechain: new Web3(new Web3.providers.HttpProvider(web3Endpoint)),
  };
  
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

  let address, loginToken;

  const sidechainSeedPhrase = 'fox acquire elite cave behave fine doll inch ride rely small pause';
  const sidechainWallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(sidechainSeedPhrase)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  const testAddress = sidechainWallet.getAddressString();
  const testPrivateKey = sidechainWallet.getPrivateKeyString();

  const getTransactionSignature = async (chainName, contractName, transactionHash) => {
    const u = `https://sign.exokit.org/${chainName}/${contractName}/${transactionHash}`;
    for (let i = 0; i < 10; i++) {
      const signature = await fetch(u).then(res => res.json());
      console.log('got sig', u, signature);
      if (signature) {
        return signature;
      } else {
        await new Promise((accept, reject) => {
          setTimeout(accept, 1000);
        });
      }
    }
    return null;
  };
  const runSidechainTransaction = async (contractName, method, ...args) => {
    // console.log('run tx', contracts['sidechain'], [contractName, method]);
    const txData = contracts['sidechain'][contractName].methods[method](...args);
    const data = txData.encodeABI();
    const gas = await txData.estimateGas({
      from: testAddress,
    });
    let gasPrice = await web3['sidechain'].eth.getGasPrice();
    gasPrice = parseInt(gasPrice, 10);
    const nonce = await web3['sidechain'].eth.getTransactionCount(testAddress);
    const testPrivateKeyBytes = Uint8Array.from(web3['sidechain'].utils.hexToBytes(testPrivateKey));
    let tx = Transaction.fromTxData({
      to: contracts['sidechain'][contractName]._address,
      nonce: '0x' + new web3['sidechain'].utils.BN(nonce).toString(16),
      gas: '0x' + new web3['sidechain'].utils.BN(gasPrice).toString(16),
      gasPrice: '0x' + new web3['sidechain'].utils.BN(gasPrice).toString(16),
      gasLimit: '0x' + new web3['sidechain'].utils.BN(1000000).toString(16),
      data,
    }, {
      common: Common.forCustomChain(
        'mainnet',
        {
          name: 'geth',
          networkId: 1,
          chainId: 1337,
        },
        'petersburg',
      ),
    }).sign(testPrivateKeyBytes);
    const rawTx = '0x' + tx.serialize().toString('hex');
    // console.log('signed tx', tx, rawTx);
    const receipt = await web3['sidechain'].eth.sendSignedTransaction(rawTx);
    // console.log('sent tx', receipt);
    return receipt;
  };

  window.Web3 = Web3;
  window.bip39 = bip39;
  window.hdkey = hdkey;
  window.web3 = web3;
  window.contracts = contracts;
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
      console.log('minted');
      
      // deposit on main
      const receipt0 = await contracts.main.FT.methods.approve(FTProxyAddress, ftAmount.v).send({
        from: address,
      });
      console.log('got sig 1', receipt0);
      const receipt = await contracts.main.FTProxy.methods.deposit(testAddress, ftAmount.v).send({
        from: address,
      });
      console.log('got sig 2', receipt);

      const signature = await getTransactionSignature('main', 'FT', receipt.transactionHash);
      const {amount, timestamp, r, s, v} = signature;

      // withdraw receipt signature on sidechain
      console.log('run withdraw', [testAddress, amount, timestamp, r, s, v]);
      const receipt2 = await runSidechainTransaction('FTProxy', 'withdraw', testAddress, amount, timestamp, r, s, v);
      
      console.log('FT OK');
    };
    const _testNft = async () => {
      /* await Promise.all([
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
      ]); */

      // mint on sidechain
      const hash = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(Date.now()),
      };
      const count = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(1),
      };
      const filename = 'lol.png';
      console.log('nft', address, hash, filename, 1);

      const receipt = await runSidechainTransaction('NFT', 'mint', testAddress, hash.v, filename, count.v);

      const tokenId = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(receipt.logs[0].topics[3].slice(2), 16),
      };
      console.log('got receipt 1', receipt.logs[0].topics[3].slice(2), tokenId);

      // approve sidechain
      const receipt2 = await runSidechainTransaction('NFT', 'setApprovalForAll', NFTProxyAddressSidechain, true);
      console.log('got receipt 2', receipt2);

      // deposit on sidechain
      const receipt3 = await runSidechainTransaction('NFTProxy', 'deposit', address, tokenId.v);
      console.log('got sidechain nft deposit receipt', [address, tokenId.v], receipt3);
      
      // get sidechain deposit receipt signature
      const signature = await getTransactionSignature('sidechain', 'NFT', receipt3.transactionHash);
      console.log('got signature', signature);

      const timestamp = {
        t: 'uint256',
        // v: new web3.utils.BN(Date.now()),
        v: new web3['main'].utils.BN(signature.timestamp.slice(2), 16),
      };
      const chainId = {
        t: 'uint256',
        v: new web3['main'].utils.BN(signature.chainId),
      };
      const {r, s, v} = signature;

      /* const filenameHash = web3.utils.sha3(filename);
      const message = web3.utils.encodePacked(address, tokenId, hash, filenameHash, timestamp, chainId);
      const hashedMessage = web3.utils.sha3(message);
      const sgn = await web3.eth.personal.sign(hashedMessage, address);
      const r = sgn.slice(0, 66);
      const s = '0x' + sgn.slice(66, 130);
      const v = '0x' + sgn.slice(130, 132);
      console.log('got', JSON.stringify({r, s, v}, null, 2)); */

      // withdraw receipt signature on sidechain
      console.log('main withdraw', [address, '0x' + tokenId.v.toString(16), '0x' + hash.v.toString(16), filename, '0x' + timestamp.v.toString(16), r, s, v]);
      await contracts.main.NFTProxy.methods.withdraw(address, tokenId.v, hash.v, filename, timestamp.v, r, s, v).send({
        from: address,
      });
      
      console.log('NFT OK');
    };
    await Promise.all([
      _testFt(),
      _testNft(),
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
      const ftAmount = {
        t: 'uint256',
        v: new web3['main'].utils.BN(amt),
      };
      
      // approve on main chain
      const receipt0 = await contracts.main.FT.methods.approve(FTProxyAddress, ftAmount.v).send({
        from: address,
      });
      
      // deposit on main chain
      console.log('deposit', testAddress, amt);
      const receipt = await contracts.main.FTProxy.methods.deposit(testAddress, ftAmount.v).send({
        from: address,
      });
      console.log('got receipt', receipt);

      // get main chain deposit receipt signature
      const signature = await getTransactionSignature('main', 'FT', receipt.transactionHash);
      const {amount, timestamp, r, s, v} = signature;

      // withdraw receipt signature on sidechain
      const receipt2 = await runSidechainTransaction('FTProxy', 'withdraw', testAddress, amount, timestamp, r, s, v);
      console.log('OK');
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
        v: new web3['main'].utils.BN(id),
      };
      
      const hashSpec = await contracts.main.NFT.methods.getHash(tokenId.v).call();
      const hash = {
        t: 'uint256',
        v: new web3['main'].utils.BN(hashSpec),
      };
      const filenameSpec = await contracts.main.NFT.methods.getMetadata(hashSpec, 'filename').call();
      const filename = {
        t: 'string',
        v: filenameSpec,
      };
      console.log('got filename hash', hash, filename);
      
      // approve on main chain
      const receipt0 = await contracts.main.NFT.methods.setApprovalForAll(NFTProxyAddress, true).send({
        from: address,
      });
      
      // deposit on main chain
      const receipt = await contracts.main.NFTProxy.methods.deposit(testAddress, tokenId.v).send({
        from: address,
      });
      console.log('got receipt', receipt);

      // get main chain deposit receipt signature
      const signature = await getTransactionSignature('main', 'NFT', receipt.transactionHash);
      console.log('got sig', signature);
      // debugger;
      const {timestamp, r, s, v} = signature;
      /* const {transactionHash} = receipt2;
      const timestamp = {
        t: 'uint256',
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
      console.log('got', JSON.stringify({r, s, v}, null, 2)); */

      // withdraw receipt signature on sidechain
      // console.log('main withdraw', [address, tokenId.v.toString(10), hash.v.toString(10), filename, timestamp.v.toString(10), r, s, v]);
      await runSidechainTransaction('NFTProxy', 'withdraw', testAddress, tokenId.v, hash.v, filename.v, timestamp, r, s, v);
      console.log('OK');
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
      const ftAmount = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(amt),
      };
      
      // approve on sidechain
      const receipt0 = await runSidechainTransaction('FT', 'approve', FTProxyAddressSidechain, ftAmount.v);
      
      // deposit on sidechain
      const receipt = await runSidechainTransaction('FTProxy', 'deposit', address, ftAmount.v);
      console.log('got receipt', receipt);

      // get sidechain deposit receipt signature
      const signature = await getTransactionSignature('sidechain', 'FT', receipt.transactionHash);
      const {amount, timestamp, r, s, v} = signature;
      /* const {transactionHash} = receipt;
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
      console.log('got', JSON.stringify({r, s, v}, null, 2)); */

      // withdraw receipt signature on main chain
      await contracts.main.FTProxy.methods.withdraw(address, amount, timestamp, r, s, v).send({
        from: address,
      });
      console.log('OK');
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
        v: new web3['sidechain'].utils.BN(id),
      };
      
      const hashSpec = await contracts.sidechain.NFT.methods.getHash(tokenId.v).call();
      const hash = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(hashSpec),
      };
      const filenameSpec = await contracts.sidechain.NFT.methods.getMetadata(hashSpec, 'filename').call();
      const filename = {
        t: 'string',
        v: filenameSpec,
      };
      console.log('got filename hash', hash, filename);

      // approve on sidechain
      const receipt0 = await runSidechainTransaction('NFT', 'setApprovalForAll', NFTProxyAddressSidechain, true);
      
      // deposit on sidechain
      const receipt = await runSidechainTransaction('NFTProxy', 'deposit', address, tokenId.v);
      console.log('got receipt', receipt);

      // get sidechain deposit receipt signature
      const signature = await getTransactionSignature('sidechain', 'NFT', receipt.transactionHash);
      console.log('got signature', signature);
      const timestamp = {
        t: 'uint256',
        v: signature.timestamp,
      };
      const {r, s, v} = signature;
      /* const chainId = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(2),
      };

      const filenameHash = web3.utils.sha3(filename.v);
      const message = web3.utils.encodePacked(address, tokenId, hash, filenameHash, timestamp, chainId);
      const hashedMessage = web3.utils.sha3(message);
      const sgn = await web3.eth.personal.sign(hashedMessage, address);
      const r = sgn.slice(0, 66);
      const s = '0x' + sgn.slice(66, 130);
      const v = '0x' + sgn.slice(130, 132);
      console.log('got', JSON.stringify({r, s, v}, null, 2)); */

      // withdraw receipt signature on sidechain
      // console.log('main withdraw', [address, tokenId.v.toString(10), hash.v.toString(10), filename, timestamp.v.toString(10), r, s, v]);
      await contracts.main.NFTProxy.methods.withdraw(address, tokenId.v, hash.v, filename.v, timestamp.v, r, s, v).send({
        from: address,
      });
      console.log('OK');
    } else {
      console.log('failed to parse', JSON.stringify(ethNftIdInput.value));
    }
  });
  const sidechainMintForm = document.getElementById('sidechain-mint-form');
  const sidechainMintFileInput = document.getElementById('sidechain-mint-file');
  sidechainMintForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();

    const {files} = sidechainMintFileInput;
    if (files.length > 0) {
    	const [file] = files;

    	const res = await fetch(storageHost, {
        method: 'POST',
        body: file,
    	});
    	const j = await res.json();
    
      const filename = {
        t: 'string',
        v: file.name,
      };
      const hash = {
        t: 'uint256',
        v: '0x' + web3['main'].utils.padLeft(j.hash, 32),
      };
      const count = {
        t: 'uint256',
        v: new web3['sidechain'].utils.BN(1),
      };
      
      const receipt = await runSidechainTransaction('NFT', 'mint', testAddress, hash.v, filename.v, count.v);
      sidechainMintFilenameInput.value = new web3['sidechain'].utils.BN(receipt.logs[0].topics[3].slice(2), 16).toNumber();
    } else {
      console.log('failed to parse', JSON.stringify(ethNftIdInput.value));
    }
  });
  
  const ethSection = document.getElementById('eth-section');
  const sidechainSection = document.getElementById('sidechain-section');

  const connectMetamaskButton = document.getElementById('connect-metamask-button');
  const _connectMetamask = async () => {
    try {
      await window.ethereum.enable();
      address = web3['main'].currentProvider.selectedAddress;
      ethSection.classList.remove('hidden');
      connectMetamaskButton.classList.add('hidden');
      
      {
        ethAddressEl.innerText = address;
      }
      {
        const ftBalance = await contracts['main'].FT.methods.balanceOf(address).call()
        ethBalanceEl.innerText = ftBalance;
      }
      {
        const nftBalance = await contracts['main'].NFT.methods.balanceOf(address).call();
        const tokens = [];
        for (let i = 0; i < nftBalance; i++) {
          const id = await contracts['main'].NFT.methods.tokenOfOwnerByIndex(address, i).call();
          const url = await contracts['main'].NFT.methods.tokenURI(id).call();
          const res = await fetch(url);
          const j = await res.json();
          tokens.push({
            id,
            image: j.image,
          });
        }
        // console.log('got main chain token ids', tokens);
        for (const token of tokens) {
          const el = document.createElement('div');
          el.classList.add('token');
          el.innerHTML = `<img src="${token.image}">`;
          el.addEventListener('click', e => {
            ethNftIdInput.value = token.id;
          });
          ethTokensEl.appendChild(el);
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };
  connectMetamaskButton.addEventListener('click', _connectMetamask);
  const connectDiscordButton = document.getElementById('connect-discord-button');
  const disconnectDiscordButton = document.getElementById('disconnect-discord-button');
  const _connectDiscord = () => {
    location.href = discordOauthUrl;
  };
  connectDiscordButton.addEventListener('click', _connectDiscord);
  const _disconnectDiscord = async () => {
    await storage.remove('loginToken');
    sidechainSection.classList.add('hidden');
    connectDiscordButton.classList.remove('hidden');
    disconnectDiscordButton.classList.add('hidden');
  };
  disconnectDiscordButton.addEventListener('click', _disconnectDiscord);
  const _absorbDiscord = async () => {
    loginToken = await storage.get('loginToken') || null;
    if (loginToken) {
      sidechainSection.classList.remove('hidden');
      connectDiscordButton.classList.add('hidden');
      disconnectDiscordButton.classList.remove('hidden');
    }

    {
      const {mnemonic} = loginToken;
      const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
      const address = wallet.getAddressString();
      sidechainAddressEl.innerText = address;
    }
    {
      const ftBalance = await contracts['sidechain'].FT.methods.balanceOf(testAddress).call();
      sidechainBalanceEl.innerText = ftBalance;
    }
    {
      const nftBalance = await contracts['sidechain'].NFT.methods.balanceOf(testAddress).call();
      const tokens = [];
      for (let i = 0; i < nftBalance; i++) {
        const id = await contracts['sidechain'].NFT.methods.tokenOfOwnerByIndex(testAddress, i).call();
        const url = await contracts['sidechain'].NFT.methods.tokenURI(id).call();
        const res = await fetch(url);
        const j = await res.json();
        tokens.push({
          id,
          image: j.image,
        });
      }
      // console.log('got sidechain token ids', tokens);
      for (const token of tokens) {
        const el = document.createElement('div');
        el.classList.add('token');
        el.innerHTML = `<img src="${token.image}">`;
        el.addEventListener('click', e => {
          sidechainNftIdInput.value = token.id;
        });
        sidechainTokensEl.appendChild(el);
      }
    }
  };
  
  const ethAddressEl = document.getElementById('eth-address');
  const ethBalanceEl = document.getElementById('eth-balance');
  const ethTokensEl = document.getElementById('eth-tokens');
  const sidechainAddressEl = document.getElementById('sidechain-address');
  const sidechainBalanceEl = document.getElementById('sidechain-balance');
  const sidechainTokensEl = document.getElementById('sidechain-tokens');
  (async () => {
    await _connectMetamask();
    await _absorbDiscord();
  })();

  /* window.testAccount = seedPhrase => {
	  const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(seedPhrase)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
	  console.log('got wallet', wallet);
	  const address = wallet.getAddressString();
	  const publicKey = wallet.getPublicKeyString();
	  const privateKey = wallet.getPrivateKeyString();
	  console.log('got address', {address, publicKey, privateKey});
  }; */
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