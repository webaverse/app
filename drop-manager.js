// import * as THREE from "three";
// import metaversefile from "metaversefile";

class DropManager extends EventTarget {
  constructor() {
    super();

    this.claims = [];
  }
  pickupApp(app) {
    this.claims.push(app);

    this.dispatchEvent(new MessageEvent('claimschange', {
      data: {
        claims: this.claims,
      },
    }));
  }
  dropToken(contractAddress, tokenId, voucher) {
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