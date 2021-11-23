import * as THREE from "three";
import metaversefile from "metaversefile";
import blockchain from './integration/web3/app.mjs';

class DropManager extends EventTarget {
  constructor() {
    super();
  }
  async dropToken(tokenId) {
    var voucher = await blockchain.drop(tokenId);
    console.log('voucher', voucher);
    // XXX engine implements this
  }
  claimVoucher(contractAddress, tokenId, voucher) {
    // ui handles this
    this.dispatchEvent(new MessageEvent('claimvoucher', {
      data: {
        contractAddress,
        tokenId,
        voucher,
      },
    }));
  }
}
const dropManager = new DropManager();

export default dropManager;