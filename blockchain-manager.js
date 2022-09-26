import * as ethers from 'ethers';
// window.ethers = ethers;

const infuraProjectId = 'f6d37ed423e143feb2b0a331e7899aaf';
const infuraProjectSecret = '';

class BlockchainManager {
  constructor() {
    // this.provider = ethers.getDefaultProvider();
    this.provider = new ethers.providers.InfuraProvider('homestead', {
      projectId: infuraProjectId,
      // projectSecret: infuraProjectSecret
    });
  }

  async getEnsName(address) {
    return await this.provider.lookupAddress(address);
  }

  async getAvatarUrl(ensName) {
    const resolver = await this.provider.getResolver(ensName);
    const avatar = await resolver.getAvatar();
    if (avatar) {
      return avatar.url;
    } else {
      return null;
    }
  }
}
const blockchainManager = new BlockchainManager();
export default blockchainManager;
