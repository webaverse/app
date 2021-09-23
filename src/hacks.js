const loomlockNftAddress = '0x1D20A51F088492A0f1C57f047A9e30c9aB5C07Ea'.toLowerCase();
export function getNftImage(nft) {
  const {token_id, asset_contract, image_preview_url} = nft;
  if (asset_contract.address === loomlockNftAddress) {
    return `https://arweave.net/ABckdetHKeV8VgUoIZ53TMDKkTi56LhTf-Gb1Mdqx9c/${token_id}.png`;
  } else {
    if (!image_preview_url) {
      console.log('got', {asset_contract, loomlockNftAddress, image_preview_url, token_id, nft});
      debugger;
    }
    return image_preview_url;
  }
}