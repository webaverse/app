import { Contract, ethers, Signer } from "ethers";
import { config } from "../config/config";

export class ProfileManager {

  constructor(provider) {
    this.provider = provider;
    this.signer = provider.getSigner();
    this.accountsContract = new ethers.Contract(
      config.contracts.accounts.address,
      config.contracts.accounts.abi,
      this.signer
    );
  }

  async getProfile() {
    const address = await this.signer.getAddress();
    const profile = await fetch(
      `https://nft.webaverse.com/account/${address}`
    ).then((res) => res.json());
    return profile;
  }

  async updateProfile(key, value) {
    const address = await this.signer.getAddress();
    const tx = await this.accountsContract.setMetadata(address, key, value, {
      gasLimit: 1000000,
    });
    await tx.wait();
  }
};
