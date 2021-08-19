export const baseUnit = 4;
export const previewExt = 'jpg';
export const maxGrabDistance = 1.5;

export const rarityColors = {
  common: [0xdcdcdc, 0x373737],
  uncommon: [0xff8400, 0x875806],
  rare: [0x00ce21, 0x00560e],
  epic: [0x00b3db, 0x003743],
  legendary: [0xad00ea, 0x32002d],
};

const chainName = (() => {
  if (typeof window !== 'undefined' && /^test\./.test(location.hostname)) {
    return 'testnet';
  } else if (
    typeof window !== 'undefined' &&
    /^polygon\./.test(location.hostname)
  ) {
    return 'polygon';
  } else {
    return 'mainnet';
  }
})();
const otherChainName = /sidechain/.test(chainName)
  ? chainName.replace(/sidechain/, '')
  : chainName + 'sidechain';
export {chainName, otherChainName};
export const polygonVigilKey = '0937c004ab133135c86586b55ca212a6c9ecd224';

export const storageHost = 'https://ipfs.exokit.org';
export const previewHost = 'https://preview.exokit.org';
export const worldsHost = 'https://worlds.exokit.org';
export const accountsHost = `https://${chainName}sidechain-accounts.webaverse.com`;
export const contractsHost = 'https://contracts.webaverse.com';
export const localstorageHost = 'https://localstorage.webaverse.com';
export const loginEndpoint = 'https://login.exokit.org';
export const tokensHost = `https://${chainName}all-tokens.webaverse.com`;
export const landHost = `https://${chainName}sidechain-land.webaverse.com`;
export const web3MainnetSidechainEndpoint =
  'https://mainnetsidechain.exokit.org';
export const web3TestnetSidechainEndpoint =
  'https://testnetsidechain.exokit.org';
export const homeScnUrl = 'https://webaverse.github.io/street/street.scn';

// Setup dialog URL, use hash if on githubpreview and its an okay hash
const rGithub = /.githubpreview.dev$/;
const isGH = rGithub.test(window.location.hostname);

let hashHost = '';

try {
  hashHost = new URL(window.location.hash).hostname;
} catch (e) {
  // invalid URL
}
const isOKHASH = rGithub.test(hashHost);

export const dialogUrl =
  isGH && isOKHASH ? hashHost : 'https://dialog.webaverse.com';
