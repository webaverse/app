import * as ethers from 'ethers';
// window.ethers = ethers;

const infuraProjectId = '9962763ddd1a453795d5ad09f10bb818';
const infuraProjectSecret = 'c1c6c5227c13423fbba1c977e25352e1';

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