import Web3 from './web3.min.js';

export async function load() {
  const web3 = new Web3(new Web3.providers.HttpProvider('https://ethereum.exokit.org'));
  const [addresses, abis] = await Promise.all([
    fetch('https://contracts.webaverse.com/ethereum/address.js').then(res => res.text()).then(s => JSON.parse(s.replace(/^\s*export\s*default\s*/, '')).sidechain),
    fetch('https://contracts.webaverse.com/ethereum/abi.js').then(res => res.text()).then(s => JSON.parse(s.replace(/^\s*export\s*default\s*/, ''))),
  ]);
  // const chainIds = await fetch('https://contracts.webaverse.com/ethereum/chain-id.js').then(res => res.text()).then(s => JSON.parse(s.replace(/^\s*export\s*default\s*/, '')).sidechain);
  const contracts = {};
  [
    'Account',
    'FT',
    'NFT',
    'FTProxy',
    'NFTProxy',
    'Trade',
  ].forEach(contractName => {
    contracts[contractName] = new web3.eth.Contract(abis[contractName], addresses[contractName]);
  });
  // const wallet = hdkey.fromMasterSeed(bip39.mnemonicToSeedSync(mnemonic)).derivePath(`m/44'/60'/0'/0/0`).getWallet();
  // const address = wallet.getAddressString();

  return {
    web3,
    addresses,
    abis,
    contracts,
  };
}