import * as THREE from 'three';
import metaversefile from 'metaversefile';
import generateStats from './procgen/stats.js';
import { getVoucherFromServer } from './src/hooks/voucherHelpers'
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
    components = [],
    type = 'minor', // 'minor', 'major', 'key'
    position,
    quaternion,
    scale,
    velocity = new THREE.Vector3(r(), 1 + Math.random(), r())
      .normalize()
      .multiplyScalar(5),
    angularVelocity = new THREE.Vector3(0, 0.001, 0),
    voucher = 'fakeVoucher', // XXX should really throw if no voucher
  }) {
    let serverDrop = false;
    if(voucher == 'fakeVoucher') {
        voucher = await getVoucherFromServer(components[1].value); //current components[0] => name. components[1] => url
        serverDrop = true;
    }
    // const r = () => (-0.5+Math.random())*2;
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
    components = [...components, {
        key: 'voucher',
        value: voucher
    }]
    
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
    };
    this.claims.push(claim);

    this.dispatchEvent(new MessageEvent('claimschange', {
      data: {
        claims: this.claims,
      },
    }));
  }
  pickupApp(app) {
    console.log("pcikyo", app)
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