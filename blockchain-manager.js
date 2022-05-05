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
  async getContractItemsTotal ( address ) {

    const abi = [
        "function totalSupply() view returns (uint256)",
        "function ownerOf(uint256 tokenId) external view returns (address owner)"
    ];
    const contract = new ethers.Contract( address, abi, this.provider );
    return await contract.totalSupply();

  }
  async getNFTContent ( address, tokenId ) {

    const abi = [
        "function tokenURI(uint256 _tokenId) public view returns (string)"
    ];
    const contract = new ethers.Contract( address, abi, this.provider );
    return await contract.tokenURI( tokenId );

  }
}
const blockchainManager = new BlockchainManager();
// await blockchainManager.getContract();
export default blockchainManager;
