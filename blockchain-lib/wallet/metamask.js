import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import { NFTManager } from "../nft/nft";
import { config } from "../config/config";

//

export class MetamaskManager {

  constructor() {
    this.nft = null;
    this.provider = null;
  }

  async connect() {
    const providerMetamask = await detectEthereumProvider();

    if (providerMetamask) {
      // This is an experimental function and might change in future therefore checking if it exists first.
      if (
        providerMetamask._metamask &&
        typeof providerMetamask._metamask.isUnlocked
      ) {
        const unlocked = await providerMetamask._metamask.isUnlocked();
        if (!unlocked) {
          // Throwing error for locked metamask wallet because requesting
          // accounts sometimes do not show pop-up and the promise gets stuck.
          throw new Error("Please unlock your metamask wallet");
        }
      }
      if (
        Number.parseInt(providerMetamask.chainId, 16) !==
          137 /* Polygon's Chain ID */ &&
        Number.parseInt(providerMetamask.chainId, 16) !==
          1 /* Ethereum's Chain ID */
      ) {
        try {
          await providerMetamask.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: 137,
                rpcUrls: ["https://polygon-rpc.com/"],
                chainName: "Polygon Mainnet",
                nativeCurrency: {
                  name: "MATIC",
                  symbol: "MATIC",
                  decimals: 18,
                },
                blockExplorerUrls: ["https://explorer.matic.network"],
              },
            ],
          });
        } catch (error) {
          throw new Error(
            "Please connect Metamask to Ethereum or Polygon mainnet."
          );
        }
      }
      try {
        const accounts = await providerMetamask.request({
          method: "eth_requestAccounts",
        });
        if (!accounts || accounts.length < 1) {
          throw new Error("No address connected");
        }
      } catch (error) {
        throw new Error("User cancelled the connection request.");
      }
      this.provider = new ethers.providers.Web3Provider(providerMetamask);

      const address = await this.provider.getSigner().getAddress();

      let fetchRes = await fetch(`${config.authServerURL}/metamask-login?address=${address}`);
      let fetchResJson = await fetchRes.json();

      if (fetchRes.status >= 400) {
        throw new Error(fetchResJson.message);
      }
      const messageToSign = fetchResJson.message;

      const signedMessage = await this.provider
        .getSigner()
        .signMessage(messageToSign);
      return signedMessage;
    } else {
      throw new Error("Metamask not installed");
    }
  }

  async login(signedMessage) {
    const address = await this.provider.getSigner().getAddress();
    const fetchRes = await fetch(`${config.authServerURL}/metamask-login`, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address,
        signedMessage,
      }),
    });

    const fetchResJson = await fetchRes.json();

    if (fetchRes.status >= 400) {
      throw new Error(fetchResJson.message);
    }
    const jwtToken = fetchResJson.jwtToken;
    const network = await this.provider.getNetwork();
    this.nft = new NFTManager(this.provider, network.chainId);
    return jwtToken;
  }
};
