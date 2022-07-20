import * as THREE from 'three';
import metaversefile from 'metaversefile';
import generateStats from './procgen/stats.js';
import { getVoucherFromServer } from './src/hooks/voucherHelpers'
import {handleBlobUpload} from './util.js';
import {registerLoad} from './src/LoadingBox.jsx';
const FILE_ADDRESS = 'https://ipfs.webaverse.com/ipfs/';

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
    // const r = () => (-0.5+Math.random())*2;
    // if(voucher == 'fakeVoucher') voucher = await getVoucherFromServer();
    // const ipfshash = await this.uploadMetadata(components[0].value, components[1].value)
    // if(voucher == 'fakeVoucher') voucher = await getVoucherFromServer(ipfshash);

    const dropComponent = {
      key: 'drop',
      value: {
        type,
        voucher,
        velocity: velocity.toArray(),
        angularVelocity: angularVelocity.toArray(),
      },
    };
    const newVoucher = {
        key: 'voucher',
        value: voucher
    }
    components = [...components, newVoucher]
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
  addClaim(name, contentId, voucher) {
    const result = generateStats(contentId);
    const {/*art, */stats} = result;
    const {level} = stats;
    const start_url = contentId;
    const claim = {
      name,
      start_url,
      level,
      voucher,
    };
    console.log("voucher", voucher)
    this.claims.push(claim);

    this.dispatchEvent(new MessageEvent('claimschange', {
      data: {
        claims: this.claims,
      },
    }));
  }
  pickupApp(app) {
    console.log("app", app)
    this.addClaim(app.name, app.contentId, app.getComponent('voucher'));
  }
  dropToken(contractAddress, tokenId, voucher) {
    // XXX engine implements this
  }
    async uploadMetadata(name, url) {
    const description = "Webaverse drops"
    const metadataFileName = `${name}-metadata.json`;
      let metadata = {
          name,
          description,
          image: url
        }

      const type = 'upload';
      let load = null;
      // const json_hash = await handleBlobUpload(metadataFileName, JSON.stringify(metadata) )
      // handleBlobUpload
      // new Blob([JSON.stringify(metadata)], {type: 'text/plain'});
      const json_hash = await handleBlobUpload(metadataFileName, new Blob([JSON.stringify(metadata)], {type: 'text/plain'}), {
        onTotal(total) {
          load = registerLoad(type, metadataFileName, 0, total);
        },
        onProgress(e) {
          if (load) {
            load.update(e.loaded, e.total);
          } else {
            load = registerLoad(type, metadataFileName, e.loaded, e.total);
          }
        },
      });

      if (load) {
        load.end();
      }

      const metadatahash = json_hash.split(FILE_ADDRESS)[1].split('/')[0];
      return metadatahash;
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