import storage from './storage.js';
import {loginEndpoint} from './constants.js';
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
  main: {Account: AccountAddress, FT: FTAddress, NFT: NFTAddress, FTProxy: FTProxyAddress, NFTProxy: NFTProxyAddress, Trade: TradeAddress},
  sidechain: {Account: AccountAddressSidechain, FT: FTAddressSidechain, NFT: NFTAddressSidechain, FTProxy: FTProxyAddressSidechain, NFTProxy: NFTProxyAddressSidechain, Trade: TradeAddressSidechain},
} = addresses;
let {Account: AccountAbi, FT: FTAbi, FTProxy: FTProxyAbi, NFT: NFTAbi, NFTProxy: NFTProxyAbi, Trade: TradeAbi} = abis;

// const web3Endpoint = 'http://13.56.80.83:8545';
const web3Endpoint = 'https://ethereum.exokit.org';
const storageHost = 'https://storage.exokit.org';
const discordOauthUrl = `https://discord.com/api/oauth2/authorize?client_id=684141574808272937&redirect_uri=https%3A%2F%2Fapp.webaverse.com%2Fdiscordlogin.html&response_type=code&scope=identify`;

(async () => {
  const web3 = {
    main: new Web3(window.ethereum),
    sidechain: new Web3(new Web3.providers.HttpProvider(web3Endpoint)),
  };
  
  const networkType = await web3['main'].eth.net.getNetworkType();
  if (networkType !== 'rinkeby') {
    document.write(`network is ${networkType}; switch to Rinkeby`);
    return;
  }
  const openSeaUrlPrefix = `https://${networkType === 'main' ? '' : networkType + '.'}opensea.io/assets`;
  const openSeaUrl = `${openSeaUrlPrefix}/m3-v7`;

  const contracts = {
    main: {
      Account: new web3['main'].eth.Contract(AccountAbi, AccountAddress),
      FT: new web3['main'].eth.Contract(FTAbi, FTAddress),
      FTProxy: new web3['main'].eth.Contract(FTProxyAbi, FTProxyAddress),
      NFT: new web3['main'].eth.Contract(NFTAbi, NFTAddress),
      NFTProxy: new web3['main'].eth.Contract(NFTProxyAbi, NFTProxyAddress),
      Trade: new web3['main'].eth.Contract(TradeAbi, TradeAddress),
    },
    sidechain: {
      Account: new web3['sidechain'].eth.Contract(AccountAbi, AccountAddressSidechain),
      FT: new web3['sidechain'].eth.Contract(FTAbi, FTAddressSidechain),
      FTProxy: new web3['sidechain'].eth.Contract(FTProxyAbi, FTProxyAddressSidechain),
      NFT: new web3['sidechain'].eth.Contract(NFTAbi, NFTAddressSidechain),
      NFTProxy: new web3['sidechain'].eth.Contract(NFTProxyAbi, NFTProxyAddressSidechain),
      Trade: new web3['sidechain'].eth.Contract(TradeAbi, TradeAddressSidechain),
    },
  };

  let address, loginToken, sidechainAddress;

  const getTransactionSignature = async (chainName, contractName, transactionHash) => {
    const u = `https://sign.exokit.org/${chainName}/${contractName}/${transactionHash}`;
    for (let i = 0; i < 10; i++) {
      const signature = await fetch(u).then(res => res.json());
      // console.log('got sig', u, signature);
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

    const {mnemonic} = loginToken;
    const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
    const privateKey = wallet.getPrivateKeyString();
    const privateKeyBytes = Uint8Array.from(web3['sidechain'].utils.hexToBytes(privateKey));

    const txData = contracts['sidechain'][contractName].methods[method](...args);
    const data = txData.encodeABI();
    const gas = await txData.estimateGas({
      from: sidechainAddress,
    });
    let gasPrice = await web3['sidechain'].eth.getGasPrice();
    gasPrice = parseInt(gasPrice, 10);
    const nonce = await web3['sidechain'].eth.getTransactionCount(sidechainAddress);
    let tx = Transaction.fromTxData({
      to: contracts['sidechain'][contractName]._address,
      nonce: '0x' + new web3['sidechain'].utils.BN(nonce).toString(16),
      gas: '0x' + new web3['sidechain'].utils.BN(gasPrice).toString(16),
      gasPrice: '0x' + new web3['sidechain'].utils.BN(gasPrice).toString(16),
      gasLimit: '0x' + new web3['sidechain'].utils.BN(8000000).toString(16),
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
    }).sign(privateKeyBytes);
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
      const receipt = await contracts.main.FTProxy.methods.deposit(sidechainAddress, ftAmount.v).send({
        from: address,
      });
      console.log('got sig 2', receipt);

      const signature = await getTransactionSignature('main', 'FT', receipt.transactionHash);
      const {amount, timestamp, r, s, v} = signature;

      // withdraw receipt signature on sidechain
      console.log('run withdraw', [sidechainAddress, amount, timestamp, r, s, v]);
      const receipt2 = await runSidechainTransaction('FTProxy', 'withdraw', sidechainAddress, amount, timestamp, r, s, v);
      
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

      const receipt = await runSidechainTransaction('NFT', 'mint', sidechainAddress, hash.v, filename, count.v);

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
  const checkMainFtApproved = async amt => {
    const receipt0 = await contracts.main.FT.methods.allowance(address, FTProxyAddress).call();
    
    if (receipt0 < amt) {
      window.alert('First you have to approve the FT contract to handle funds. This will only happen once.');
      
      const fullAmount = {
        t: 'uint256',
        v: new web3['main'].utils.BN(1e9)
          .mul(new web3['main'].utils.BN(1e9))
          .mul(new web3['main'].utils.BN(1e9)),
      };
      const receipt1 = await contracts.main.FT.methods.approve(FTProxyAddress, fullAmount.v).send({
        from: address,
      });
      return receipt1;
    } else {
      return null;
    }
  };
  const checkMainNftApproved = async () => {
    const approved = await contracts.main.NFT.methods.isApprovedForAll(address, NFTProxyAddress).call();
    
    if (!approved) {
      window.alert('First you have to approve the NFT contract to handle tokens. This will only happen once.');
      
      const receipt1 = await contracts.main.NFT.methods.setApprovalForAll(NFTProxyAddress, true).send({
        from: address,
      });
      return receipt1;
    } else {
      return null;
    }
  };

  const ethFtForm = document.getElementById('eth-ft-form');
  const ethFtAmountInput = document.getElementById('eth-ft-amount');
  const ethFtButton = document.getElementById('eth-ft-button');
  ethFtForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    ethFtButton.disabled = true;

    const amt = parseInt(ethFtAmountInput.value, 10);
    if (!isNaN(amt)) {
      const ftAmount = {
        t: 'uint256',
        v: new web3['main'].utils.BN(amt),
      };
      
      // approve on main chain
      await checkMainFtApproved(amt);
      
      // deposit on main chain
      console.log('deposit', sidechainAddress, amt);
      const receipt = await contracts.main.FTProxy.methods.deposit(sidechainAddress, ftAmount.v).send({
        from: address,
      });
      console.log('got receipt', receipt);

      // get main chain deposit receipt signature
      const signature = await getTransactionSignature('main', 'FT', receipt.transactionHash);
      const {amount, timestamp, r, s, v} = signature;

      // withdraw receipt signature on sidechain
      const receipt2 = await runSidechainTransaction('FTProxy', 'withdraw', sidechainAddress, amount, timestamp, r, s, v);
      
      console.log('OK');
    } else {
      console.log('failed to parse', JSON.stringify(ethFtAmountInput.value));
    }
    
    ethFtButton.disabled = false;
  });
  
  const ethNftForm = document.getElementById('eth-nft-form');
  const ethNftIdInput = document.getElementById('eth-nft-id');
  const ethNftButton = document.getElementById('eth-nft-button');
  ethNftForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    ethNftButton.disabled = true;

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
      await checkMainNftApproved();
      
      // deposit on main chain
      const receipt = await contracts.main.NFTProxy.methods.deposit(sidechainAddress, tokenId.v).send({
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
      await runSidechainTransaction('NFTProxy', 'withdraw', sidechainAddress, tokenId.v, hash.v, filename.v, timestamp, r, s, v);
      
      console.log('OK');
    } else {
      console.log('failed to parse', JSON.stringify(ethNftIdInput.value));
    }
    
    ethNftButton.disabled = false;
  });
  
  const sidechainFtForm = document.getElementById('sidechain-ft-form');
  const sidechainFtAmountInput = document.getElementById('sidechain-ft-amount');
  const sidechainFtButton = document.getElementById('sidechain-ft-button');
  sidechainFtForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    sidechainFtButton.disabled = true;

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
    
    sidechainFtButton.disabled = false;
  });
  
  const sidechainNftForm = document.getElementById('sidechain-nft-form');
  const sidechainNftIdInput = document.getElementById('sidechain-nft-id');
  const sidechainNftButton = document.getElementById('sidechain-nft-button');
  sidechainNftForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    sidechainNftButton.disabled = true;
    
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
    
    sidechainNftButton.disabled = false;
  });
  
  const sidechainMetadataIdInput = document.getElementById('sidechain-metadata-id');
  const sidechainMetadataKeyInput = document.getElementById('sidechain-metadata-key');
  const sidechainMetadataValueInput = document.getElementById('sidechain-metadata-value');
  const sidechainMetadataGetButton = document.getElementById('sidechain-metadata-get-button');
  const sidechainMetadataSetButton = document.getElementById('sidechain-metadata-set-button');
  sidechainMetadataGetButton.addEventListener('click', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    sidechainMetadataGetButton.disabled = true;
    sidechainMetadataSetButton.disabled = true;
    
    const id = sidechainMetadataIdInput.value;
    const key = sidechainMetadataKeyInput.value;
    const hash = await contracts.sidechain.NFT.methods.getHash(id).call();
    const value = await contracts.sidechain.NFT.methods.getMetadata(hash, key).call();
    sidechainMetadataValueInput.value = value;
    
    sidechainMetadataGetButton.disabled = false;
    sidechainMetadataSetButton.disabled = false;
  });
  sidechainMetadataSetButton.addEventListener('click', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    sidechainMetadataGetButton.disabled = true;
    sidechainMetadataSetButton.disabled = true;
    
    const id = sidechainMetadataIdInput.value;
    const key = sidechainMetadataKeyInput.value;
    const value = sidechainMetadataValueInput.value;
    const hash = await contracts.sidechain.NFT.methods.getHash(id).call();
    await runSidechainTransaction('NFT', 'setMetadata', hash, key, value);
    
    sidechainMetadataGetButton.disabled = false;
    sidechainMetadataSetButton.disabled = false;
  });
  
  const sidechainCollaboratorsIdInput = document.getElementById('sidechain-collaborators-id');
  const sidechainCollaboratorsAddressInput = document.getElementById('sidechain-collaborators-address');
  const sidechainCollaboratorsAddButton = document.getElementById('sidechain-collaborators-add-button');
  const sidechainCollaboratorsRemoveButton = document.getElementById('sidechain-collaborators-remove-button');
  sidechainCollaboratorsAddButton.addEventListener('click', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    sidechainCollaboratorsAddButton.disabled = true;
    sidechainCollaboratorsRemoveButton.disabled = true;

    try {    
      const id = sidechainCollaboratorsIdInput.value;
      const address = sidechainCollaboratorsAddressInput.value;
      const hash = await contracts.sidechain.NFT.methods.getHash(id).call();
      await runSidechainTransaction('NFT', 'addCollaborator', hash, address);
    } catch(err) {
      console.warn(err.stack);
    }
    
    sidechainCollaboratorsAddButton.disabled = false;
    sidechainCollaboratorsRemoveButton.disabled = false;
  });
  sidechainCollaboratorsRemoveButton.addEventListener('click', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    sidechainCollaboratorsAddButton.disabled = true;
    sidechainCollaboratorsRemoveButton.disabled = true;

    try {
      const id = sidechainCollaboratorsIdInput.value;
      const address = sidechainCollaboratorsAddressInput.value;
      const hash = await contracts.sidechain.NFT.methods.getHash(id).call();
      await runSidechainTransaction('NFT', 'removeCollaborator', hash, address);
    } catch(err) {
      console.warn(err.stack);
    }
    
    sidechainCollaboratorsAddButton.disabled = false;
    sidechainCollaboratorsRemoveButton.disabled = false;
  });
  
  const sidechainMintForm = document.getElementById('sidechain-mint-form');
  const sidechainMintFileInput = document.getElementById('sidechain-mint-file');
  const sidechainMintCount = document.getElementById('sidechain-mint-count');
  const sidechainMintButton = document.getElementById('sidechain-mint-button');
  sidechainMintForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    sidechainMintButton.disabled = true;

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
        v: new web3['sidechain'].utils.BN(sidechainMintCount.value),
      };
      
      const receipt = await runSidechainTransaction('NFT', 'mint', sidechainAddress, hash.v, filename.v, count.v);
      sidechainNftIdInput.value = new web3['sidechain'].utils.BN(receipt.logs[0].topics[3].slice(2), 16).toNumber();
    } else {
      console.log('no files');
    }
    
    sidechainMintButton.disabled = false;
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
          const {image, properties: {filename, hash, ext}} = j;
          if (!tokens.some(token => token.hash === hash)) {
            const balance = await contracts['main'].NFT.methods.balanceOfHash(address, hash).call();
            const totalSupply = await contracts['sidechain'].NFT.methods.totalSupplyOfHash(hash).call();
            tokens.push({
              id,
              image,
              filename,
              hash,
              ext,
              balance,
              totalSupply,
            });
          }
        }
        ethTokensEl.innerHTML = '';
        for (const token of tokens) {
          const el = document.createElement('div');
          el.classList.add('token');
          if (ethNftIdInput.value === token.id) {
            el.classList.add('selected');
          }
          el.setAttribute('tokenid', token.id);
          el.innerHTML = `
            <img src="${token.image}">
            <div class=wrap>
              <a href="https://storage.exokit.org/${token.hash.slice(2)}/${token.filename}" class=filename>${escape(token.filename)}</a>
              <a href="${openSeaUrlPrefix}/${NFTAddress}/${token.id}/" class=hash>${token.id}. ${token.hash} (${token.balance}/${token.totalSupply})</a>
              <div class=ext>${escape(token.ext || '')}</div>
            </div>
          `;
          el.addEventListener('click', e => {
            ethNftIdInput.value = ethNftIdInput.value !== token.id ? token.id : '';
            ethNftIdInput.dispatchEvent(new KeyboardEvent('input'));
          });
          ethTokensEl.appendChild(el);
        }
        if (address && sidechainAddress) {
          Array.from(document.querySelectorAll('.token-forms')).forEach(formEl => {
            formEl.classList.remove('hidden');
          });
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };
  connectMetamaskButton.addEventListener('click', _connectMetamask);
  
  const connectButtons = document.getElementById('connect-buttons');
  const connectKeyButton = document.getElementById('connect-key-button');
  const connectEmailButton = document.getElementById('connect-email-button');
  const connectDiscordButton = document.getElementById('connect-discord-button');
  const disconnectButton = document.getElementById('disconnect-button');
  const ethKeyForm = document.getElementById('eth-key-form');
  const ethKeyInput = document.getElementById('eth-key-input');
  const ethKeyCancelButton = document.getElementById('eth-key-cancel-button');
  const ethEmailForm = document.getElementById('eth-email-form');
  const ethEmailInput = document.getElementById('eth-email-input');
  const ethEmailCancelButton = document.getElementById('eth-email-cancel-button');
  const ethCodeForm = document.getElementById('eth-code-form');
  const ethCodeInput = document.getElementById('eth-code-input');
  const ethCodeCancelButton = document.getElementById('eth-code-cancel-button');
  connectKeyButton.addEventListener('click', e => {
    connectButtons.classList.add('hidden');
    ethKeyForm.classList.remove('hidden');
  });
  connectEmailButton.addEventListener('click', e => {
    connectButtons.classList.add('hidden');
    ethEmailForm.classList.remove('hidden');
  });
  const _connectDiscord = () => {
    location.href = discordOauthUrl;
  };
  connectDiscordButton.addEventListener('click', _connectDiscord);
  const _disconnect = async () => {
    await storage.remove('loginToken');
    sidechainSection.classList.add('hidden');
    connectButtons.classList.remove('hidden');
    disconnectButton.classList.add('hidden');
    
    Array.from(document.querySelectorAll('.token-forms')).forEach(formEl => {
      formEl.classList.add('hidden');
    });
  };
  disconnectButton.addEventListener('click', _disconnect);
  ethKeyForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    if (bip39.validateMnemonic(ethKeyInput.value)) {
      const mnemonic = ethKeyInput.value;
      await storage.set('loginToken', {mnemonic});
      ethKeyForm.classList.add('hidden');
      await _absorbSidechain();
    } else {
      console.warn('invalid mnemonic');
    }
  });
  ethEmailForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(ethEmailInput.value)}`, {
      method: 'POST',
    });
    if (res.status >= 200 && res.status < 300) {
      ethEmailForm.classList.add('hidden');
      ethCodeForm.classList.remove('hidden');
    } else {
      console.warn('invalid status code: ' + res.status);
    }
  });
  ethCodeForm.addEventListener('submit', async e => {
    e.preventDefault();
    e.stopPropagation();
    
    const res = await fetch(loginEndpoint + `?email=${encodeURIComponent(ethEmailInput.value)}&code=${encodeURIComponent(ethCodeInput.value)}`, {
      method: 'POST',
    });
    if (res.status >= 200 && res.status < 300) {
      const j = await res.json();
      const {mnemonic} = j;
      await storage.set('loginToken', {mnemonic});
      ethCodeForm.classList.add('hidden');
      await _absorbSidechain();
    } else {
      console.warn('invalid status code: ' + res.status);
    }
  });
  ethKeyCancelButton.addEventListener('click', e => {
    ethKeyForm.classList.add('hidden');
    connectButtons.classList.remove('hidden');
  });
  ethEmailCancelButton.addEventListener('click', e => {
    ethEmailForm.classList.add('hidden');
    connectButtons.classList.remove('hidden');
  });
  ethCodeCancelButton.addEventListener('click', e => {
    ethCodeForm.classList.add('hidden');
    connectButtons.classList.remove('hidden');
  });
  const _absorbSidechain = async () => {
    loginToken = await storage.get('loginToken') || null;
    if (loginToken) {
      {
        const {mnemonic} = loginToken;
        const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
        sidechainAddress = wallet.getAddressString();

        sidechainAddressEl.innerText = sidechainAddress;
        sidechainSection.classList.remove('hidden');
        connectButtons.classList.add('hidden');
        disconnectButton.classList.remove('hidden');
      }
      {
        const ftBalance = await contracts['sidechain'].FT.methods.balanceOf(sidechainAddress).call();
        sidechainBalanceEl.innerText = ftBalance;
      }
      {
        const nftBalance = await contracts['sidechain'].NFT.methods.balanceOf(sidechainAddress).call();
        const tokens = [];
        for (let i = 0; i < nftBalance; i++) {
          const id = await contracts['sidechain'].NFT.methods.tokenOfOwnerByIndex(sidechainAddress, i).call();
          const url = await contracts['sidechain'].NFT.methods.tokenURI(id).call();
          const res = await fetch(url);
          const j = await res.json();
          const {image, properties: {filename, hash, ext}} = j;
          if (!tokens.some(token => token.hash === hash)) {
            const balance = await contracts['sidechain'].NFT.methods.balanceOfHash(sidechainAddress, hash).call();
            const totalSupply = await contracts['sidechain'].NFT.methods.totalSupplyOfHash(hash).call();
            tokens.push({
              id,
              image,
              filename,
              hash,
              ext,
              balance,
              totalSupply,
            });
          }
        }
        sidechainTokensEl.innerHTML = '';
        for (const token of tokens) {
          const el = document.createElement('div');
          el.classList.add('token');
          if (sidechainNftIdInput.value === token.id) {
            el.classList.add('selected');
          }
          el.setAttribute('tokenid', token.id);
          el.innerHTML = `
            <img src="${token.image}">
            <div class=wrap>
              <a href="https://storage.exokit.org/${token.hash.slice(2)}" class=filename>${escape(token.filename)}</a>
              <div class=hash>${token.id}. ${token.hash} (${token.balance}/${token.totalSupply})</div>
              <div class=ext>${escape(token.ext || '')}</div>
            </div>
          `;
          el.addEventListener('click', e => {
            sidechainNftIdInput.value = token.id;
            sidechainNftIdInput.dispatchEvent(new KeyboardEvent('input'));
          });
          sidechainTokensEl.appendChild(el);
        }
      }
      if (address && sidechainAddress) {
        Array.from(document.querySelectorAll('.token-forms')).forEach(formEl => {
          formEl.classList.remove('hidden');
        });
      }
    }
  };

  ethNftIdInput.addEventListener('input', e => {
    const els = Array.from(document.querySelectorAll('#eth-tokens .token'));
    for (const el of els) {
      el.classList.remove('selected');
    }
    const el = document.querySelector('#eth-tokens .token[tokenid="' + e.target.value + '"]');
    el && el.classList.add('selected');
    // console.log('eth nft change 1', e.target.value, !!el);
  });
  sidechainNftIdInput.addEventListener('input', e => {
    const els = Array.from(document.querySelectorAll('#sidechain-tokens .token'));
    for (const el of els) {
      el.classList.remove('selected');
    }
    const el = document.querySelector('#sidechain-tokens .token[tokenid="' + e.target.value + '"]');
    el && el.classList.add('selected');
    // console.log('eth nft change 2', e.target.value, !!el);
  });
  
  const ethAddressEl = document.getElementById('eth-address');
  const ethBalanceEl = document.getElementById('eth-balance');
  const ethTokensEl = document.getElementById('eth-tokens');
  const sidechainAddressEl = document.getElementById('sidechain-address');
  const sidechainBalanceEl = document.getElementById('sidechain-balance');
  const sidechainTokensEl = document.getElementById('sidechain-tokens');
  const ftContractAddressLink = document.getElementById('ft-contract-address-link');
  const nftContractAddressLink = document.getElementById('nft-contract-address-link');
  const nftContractOpenSeaLink = document.getElementById('nft-contract-opensea-link');
  ftContractAddressLink.innerText = FTAddress;
  ftContractAddressLink.href = `https://${networkType === 'main' ? '' : networkType + '.'}etherscan.io/address/${FTAddress}`;
  nftContractAddressLink.innerText = NFTAddress;
  nftContractAddressLink.href = `https://${networkType === 'main' ? '' : networkType + '.'}etherscan.io/address/${NFTAddress}`;
  nftContractOpenSeaLink.href = openSeaUrl;
  _connectMetamask().catch(console.warn);
  _absorbSidechain().catch(console.warn);

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