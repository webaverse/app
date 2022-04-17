import { Contract, ethers, Signer } from "ethers";
import { config } from "../config/config";
import { ClaimableVoucher } from "./ClaimableVoucher";

export class NFTManager {

  supportedChains = {
    137: "polygon",
    1: "eth",
    1338: "sidechain",
  };

  constructor( provider, chainId) {
    this.provider = provider;
    this.chainId = chainId;
    this.signer = provider.getSigner();
    this.erc1155Contract = new ethers.Contract(
      config.contracts.erc1155.address[`${chainId}`],
      config.contracts.erc1155.abi,
      this.signer
    );
  }

  async getNFTs() {
    const address = await this.signer.getAddress();
    let chain = this.supportedChains[`${this.chainId}`];
    if (!chain) {
      throw new Error(
        "Connected chain not supported. Please connect through ethereum, polygon or webaverse sidechain"
      );
    }
    const nfts = await fetch(
      `https://nft.webaverse.com/nft?chainName=${chain}&owner=${address}`
    ).then((res) => res.json());
    return nfts;
  }

  async mintNFT(cid, ext, balance) {
    balance = balance ?? 1;
    const userAddress = await this.signer.getAddress();
    const uri = `${cid}.${ext}`;
    const tx = await this.erc1155Contract.mint(userAddress, balance, uri, [], {
      gasLimit: 3000000,
    });
    await tx.wait();
    return tx.hash;
  }

  async createVoucher(tokenId, balance, expiry) {
    const claimableVoucher = new ClaimableVoucher({
      contract: this.erc1155Contract,
      signer: this.signer,
      chainId: this.chainId,
    });
    const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    const voucher = await claimableVoucher.createVoucher(
      tokenId,
      balance,
      nonce,
      expiry,
      this.chainId
    );
    return voucher;
  }

  async redeemVoucher(voucher) {
    const userAddress = await this.signer.getAddress();
    const tx = await this.erc1155Contract.claim(userAddress, voucher);
    await tx.wait();
    return tx.hash;
  }
}
