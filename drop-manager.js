// import * as THREE from "three";
// import metaversefile from "metaversefile";
import generateStats from './procgen/stats.js';

class DropManager extends EventTarget {
  constructor() {
    super();

    this.claims = [];
  }
  pickupApp(app) {
    const result = generateStats(app.contentId);
    const {art, stats} = result;
    const {level} = stats;
    const {name} = app;
    const start_url = app.contentId;
    const claim = {
      name,
      start_url,
      level,
    };
    this.claims.push(claim);

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