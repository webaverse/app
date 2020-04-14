import address from 'https://contracts.webaverse.com/address.js';
import abi from 'https://contracts.webaverse.com/abi.js';

const apiHost = `https://ipfs.exokit.org/ipfs`;
const network = 'rinkeby';
const infuraApiKey = '4fb939301ec543a0969f3019d74f80c2';
const rpcUrl = `https://${network}.infura.io/v3/${infuraApiKey}`;
let web3;
let contract;

function makePromise() {
  let accept, reject;
  const p = new Promise((a, r) => {
    accept = a;
    reject = r;
  });
  p.accept = accept;
  p.reject = reject;
  return p;
}

// load

{
  const keystoreString = localStorage.getItem('wallet');
  if (keystoreString) {
    header.classList.add('locked');
  }
}

// wallet

const builtinWalletButton = document.getElementById('builtin-wallet-button');
const extensionWalletButton = document.getElementById('extension-wallet-button');
builtinWalletButton.addEventListener('click', async e => {
  // builtinWalletButton.classList.add('selected');
  // extensionWalletButton.classList.remove('selected');
  const header = document.getElementById('header');
  header.classList.add('unlocking');
  header.classList.add('builtin');

  await Promise.all([
    `https://rawcdn.githack.com/ethereum/web3.js/a6ddec59e65116853435f203b25cb9c55824d084/dist/web3.min.js`,
    `https://rawcdn.githack.com/ethereumjs/browser-builds/c31acaf66608f8176828b974ab50f2ea6308e7e1/dist/ethereumjs-tx/ethereumjs-tx-1.3.3.js`,
    `https://rawcdn.githack.com/ConsenSys/eth-lightwallet/d21df74dd2d5e09632bf38309f147784668b1498/dist/lightwallet.js`,
  ].map(src => new Promise((accept, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = accept;
    script.onerror = reject;
    document.body.appendChild(script);
  })));
  web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
  contract = new web3.eth.Contract(abi, address);
  contract.doCall = function (method, ...args) {
    return this.methods[method].apply(this.methods, args).call();
  };
  contract.doSend = async function (method, ...args) {
    const address = `0x${keystore.addresses[0]}`;
    const privateKey = await keystore.getPrivateKey();
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    web3.eth.accounts.wallet.add(account);

    const nonce = await web3.eth.getTransactionCount(address);
    const gasPrice = await web3.eth.getGasPrice();
    // const value = '10000000000000000'; // 0.01 ETH

    const m = contract.methods.mint(1, 'hash', metadataHash);
    const opts = {
      gas: 0,
      from: address,
      nonce,
      // value,
    };
    opts.gas = await m.estimateGas(opts);
    const receipt = await m.send(opts);
    return receipt;
  };
});
extensionWalletButton.addEventListener('click', async e => {
  // builtinWalletButton.classList.remove('selected');
  // extensionWalletButton.classList.add('selected');
  const header = document.getElementById('header');
  header.classList.add('unlocking');
  header.classList.add('extension');

  if (window.ethereum) {
    web3 = new window.Web3(window.ethereum);
    try {
      // Request account access if needed
      const accounts = await window.ethereum.enable();
      // Acccounts now exposed
      // web3.eth.sendTransaction({/* ... */});

      if (accounts && accounts[0]) {
        web3.version.getNetwork((err, network) => {
          if (!err && network !== '4') {
            err = new Error('must be on rinkeby testnet!');
          }

          if (!err) {
            contract = web3.eth.contract(abi).at(address);
            contract.doCall = function (method, ...args) {
              return new Promise((accept, reject) => {
                args.push((error, result) => {
                  if (!error) {
                    accept(result);
                  } else {
                    reject(error);
                  }
                });
                this[method].apply(this, args);
              });
            };
            contract.doSend = async function (method, ...args) {
              const txHash = await new Promise((accept, reject) => {
                args.push({
                  from: accounts[0],
                }, (error, result) => {
                  if (!error) {
                    accept(result);
                  } else {
                    reject(error);
                  }
                });
                this[method].sendTransaction.apply(this[method], args);
              });
              const receipt = await new Promise((accept, reject) => {
                const _recurse = () => {
                  web3.eth.getTransactionReceipt(txHash, (error, result) => {
                    if (!error) {
                      if (result !== null) {
                        contract.doCall('getNonce').then(nonce => {
                          accept({
                            events: {
                              URI: {
                                returnValues: [null, nonce],
                              },
                            },
                          });
                        }).catch(reject);
                        // accept(result);
                      } else {
                        setTimeout(_recurse, 1000);
                      }
                    } else {
                      reject(error);
                    }
                  });
                };
                _recurse();
              });
              return receipt;
            };

            contractManager.dispatchEvent(new MessageEvent('change', {
              data: {
                contract,
                address: accounts[0],
              },
            }));
          } else {
            contractManager.dispatchEvent(new MessageEvent('error', {
              data: err,
            }));
          }
        });
      } else {
        throw new Error('could not connect to extension');
      }
    } catch (err) {
      // User denied account access...
      console.warn(err);
    }
  } else {
    console.warn('no ethereum!');
  }
});

let keystore = null;
const contractManager = new EventTarget();
const hdPathString = `m/44'/60'/0'/0`;
async function exportSeed(ks, password) {
  const p = makePromise();
  ks.keyFromPassword(password, function (err, pwDerivedKey) {
    if (!err) {
      const seed = ks.getSeed(pwDerivedKey);
      p.accept(seed);
    } else {
      p.reject(err);
    }
  });
  return await p;
}
async function signTx(ks, password, rawTx) {
  const p = makePromise();
  ks.keyFromPassword(password, function (err, pwDerivedKey) {
    if (!err) {
      const address = ks.addresses[0];
      console.log('sign tx', ks, pwDerivedKey, rawTx, address, hdPathString);
      const signed = lightwallet.signing.signTx(ks, pwDerivedKey, rawTx, `0x${address}`, hdPathString);
      p.accept(signed);
    } else {
      p.reject(err);
    }
  });
  return await p;
}
async function getPrivateKey(ks, password) {
  const p = makePromise();
  ks.keyFromPassword(password, function (err, pwDerivedKey) {
    if (!err) {
      const privateKey = ks.exportPrivateKey(ks.addresses[0], pwDerivedKey);
      p.accept(privateKey);
    } else {
      p.reject(err);
    }
  });
  return await p;
}
const _createKeystore = async (seedPhrase, password) => {
  // var seedPhrase = lightwallet.keystore.generateRandomSeed();

  const p = makePromise();
  lightwallet.keystore.createVault({
    password,
    seedPhrase, // Optionally provide a 12-word seed phrase
    // salt: fixture.salt,     // Optionally provide a salt.
                               // A unique salt will be generated otherwise.
    hdPathString,    // Optional custom HD Path String
  },
  (err, ks) => {
    // console.log('got keystore', err, ks);
    // window.ks = ks;

    if (!err) {
      ks.keyFromPassword(password, function (err, pwDerivedKey) {
        if (!err) {
          ks.generateNewAddress(pwDerivedKey, 1);

          p.accept(ks);
        } else {
          p.reject(err);
        }
      });
    } else {
      p.reject(err);
    }
  });
  const ks = await p;
  ks.exportSeed = exportSeed.bind(null, ks, password);
  ks.signTx = signTx.bind(null, ks, password);
  ks.getPrivateKey = getPrivateKey.bind(null, ks, password);
  return ks;
};
const _exportKeyStore = ks => ks.serialize();
const _importKeyStore = async (s, password) => {
  const ks = lightwallet.keystore.deserialize(s);

  const p = makePromise();
  ks.keyFromPassword(password, function (err, pwDerivedKey) {
    if (!err) {
      if (ks.isDerivedKeyCorrect(pwDerivedKey)) {
        p.accept();
      } else {
        p.reject(new Error('invalid password'));
      }
    } else {
      p.reject(err);
    }
  });
  await p;
  ks.exportSeed = exportSeed.bind(null, ks, password);
  ks.signTx = signTx.bind(null, ks, password);
  ks.getPrivateKey = getPrivateKey.bind(null, ks, password);
  return ks;
};
const _clearWalletClasses = () => {
  ['import', 'locked', 'unlocked'].forEach(c => {
    header.classList.remove(c);
  });
};
document.getElementById('import-key-button').addEventListener('click', async e => {
  document.getElementById('password-input').value = '';
  document.getElementById('seed-phrase-input').value = '';

  _clearWalletClasses();
  header.classList.add('import');
});
document.getElementById('create-wallet-button').addEventListener('click', e => {
  document.getElementById('password-input').value = '';
  document.getElementById('seed-phrase-input').value = lightwallet.keystore.generateRandomSeed();

  _clearWalletClasses();
  header.classList.add('import');
});
document.getElementById('import-button').addEventListener('click', async e => {
  // the seed is stored encrypted by a user-defined password
  const seedPhrase = document.getElementById('seed-phrase-input').value;
  const password = document.getElementById('password-input').value;
  // var seedPhrase = lightwallet.keystore.generateRandomSeed();

  keystore = await _createKeystore(seedPhrase, password);
  const address = keystore.accounts[0];
  contractManager.dispatchEvent(new MessageEvent('change', {
    data: {
      contract,
      address,
    },
  }));
  localStorage.setItem('wallet', _exportKeyStore(keystore));
  let balance = await web3.eth.getBalance(address);
  balance /= 1e18;

  document.getElementById('seed-phrase-input').value = '';
  document.getElementById('password-input').value = '';
  document.getElementById('address-text').innerText = `0x${address}`;
  document.getElementById('balance-text').innerText = `${balance} ETH`;

  _clearWalletClasses();
  header.classList.add('unlocked');
});
[
  'seed-phrase-input',
  'password-input',
].forEach(k => {
  document.getElementById(k).addEventListener('keydown', e => {
    if (e.which === 13) {
      document.getElementById('import-button').click();
    }
  });
});
document.getElementById('cancel-import-button').addEventListener('click', e => {
  _clearWalletClasses();
});
document.getElementById('unlock-wallet-button').addEventListener('click', async e => {
  const keystoreString = localStorage.getItem('wallet');
  const password = document.getElementById('password-unlock-input').value;

  keystore = await _importKeyStore(keystoreString, password);
  const address = keystore.addresses[0];
  contractManager.dispatchEvent(new MessageEvent('change', {
    data: {
      contract,
      address,
    },
  }));
  let balance = await web3.eth.getBalance(address);
  balance /= 1e18;

  document.getElementById('password-unlock-input').value = '';
  document.getElementById('address-text').innerText = `0x${address}`;
  document.getElementById('balance-text').innerText = `${balance} ETH`;

  _clearWalletClasses();
  header.classList.add('unlocked');
});
document.getElementById('password-unlock-input').addEventListener('keydown', e => {
  if (e.which === 13) {
    document.getElementById('unlock-wallet-button').click();
  }
});
document.getElementById('download-key-button').addEventListener('click', async e => {
  const seed = await keystore.exportSeed();
  const a = document.createElement('a');
  const b = new Blob([seed], {
    type: 'text/plain',
  });
  const u = URL.createObjectURL(b);
  a.href = u;
  a.download = 'seed.txt';
  a.click();
  URL.revokeObjectURL(u);
});
document.getElementById('forget-wallet-button').addEventListener('click', e => {
  localStorage.removeItem('wallet');
  _clearWalletClasses();
});
document.getElementById('lock-wallet-button').addEventListener('click', e => {
  keystore = null;
  const address = keystore.addresses[0];
  contractManager.dispatchEvent(new MessageEvent('change', {
    data: {
      contract: null,
      address: null,
    },
  }));

  _clearWalletClasses();
  header.classList.add('locked');
});

export {contractManager};
export function getContract() {
  return contract;
}