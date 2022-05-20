import * as THREE from 'three';
import metaversefile from 'metaversefile';
import generateStats from './procgen/stats.js';

class DropManager extends EventTarget {
  constructor() {
    super();

    this.claims = [];
  }
  createDropApp({
    start_url,
    position,
    quaternion,
    scale,
  }) {      
    const r = () => (-0.5+Math.random())*2;
    const components = [
      {
        key: 'drop',
        value: {
          voucher: 'fakeVoucher',
          velocity: new THREE.Vector3(r(), 1+Math.random(), r())
            .normalize()
            .multiplyScalar(5)
            .toArray(),
          angularVelocity: new THREE.Vector3(0, 0.001, 0)
            .toArray(),
        },
      },
    ];
    
    // console.log('got loot components', srcUrl, components);
    const trackedApp = metaversefile.addTrackedApp(
      start_url,
      position,
      quaternion,
      scale,
      components
    );
    return trackedApp;
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