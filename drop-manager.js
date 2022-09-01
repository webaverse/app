import * as THREE from 'three';
import metaversefile from 'metaversefile';
import generateStats from './procgen/stats.js';
import { getVoucherFromServer, getVoucherFromUser } from './src/hooks/voucherHelpers'
// import { uploadMetadata } from './util.js';
// import {registerLoad} from './src/LoadingBox.jsx';
// const FILE_ADDRESS = 'https://ipfs.webaverse.com/ipfs/';

const r = () => -1 + Math.random() * 2;

class DropManager extends EventTarget {
  constructor() {
    super();

    this.claims = [];
  }
  async createDropApp({
    start_url,
    tokenId = null,
    components = [],
    type = 'major', // 'minor', 'major', 'key'
    position,
    quaternion,
    scale,
    velocity = new THREE.Vector3(r(), 1 + Math.random(), r())
      .normalize()
      .multiplyScalar(5),
    angularVelocity = new THREE.Vector3(0, 0.001, 0),
    voucher = 'fakeVoucher', // XXX should really throw if no voucher
    signerAddress = null,
    WebaversecontractAddress = null,
  }) {
    let serverDrop = false;
    if (voucher == 'fakeVoucher') {
        voucher = await getVoucherFromServer(start_url); 
        serverDrop = true;
        components = [...components, {
            key: 'voucher',
            value: voucher
        }]
    } else if (voucher == 'hadVoucher') {
        serverDrop = false;
    }
    const dropComponent = {
      key: 'drop',
      value: {
        type,
        serverDrop,
        voucher,
        velocity: velocity.toArray(),
        angularVelocity: angularVelocity.toArray(),
      },
    };
    components.push(dropComponent);
    
    const trackedApp = metaversefile.addTrackedApp(
      start_url,
      position,
      quaternion,
      scale,
      components
    );
    return trackedApp;
  }
  addClaim(name, type, serverDrop, contentId, voucher) {
    const result = generateStats(contentId);
    const {/*art, */stats} = result;
    const {level} = stats;
    const start_url = contentId;
    const claim = {
      name,
      type,
      serverDrop,
      start_url,
      level,
      voucher,
      pickupTime: Date.now()
    };
    this.claims.push(claim);

    this.dispatchEvent(new MessageEvent('claimschange', {
      data: {
        claims: this.claims,
      },
    }));
  }
  removeClaim(claimedDrop) {
    this.claims = this.claims.filter((each) => JSON.stringify(each) !== JSON.stringify(claimedDrop))
    this.dispatchEvent(new MessageEvent('claimschange', {
      data: {
        claims: this.claims,
      },
    }));
  }
  pickupApp(app) {
    this.addClaim(app.name, app.type, app.getComponent('drop').serverDrop, app.contentId, app.getComponent('voucher'));
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