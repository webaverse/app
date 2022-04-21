
import { ethers } from "ethers";
import detectEthereumProvider from "@metamask/detect-provider";
import { config } from "../config/config";

//

class EventEmitter {

    constructor () {

        this.listeners = {};

    };

    addListener ( name, callback ) {

        this.listeners[ name ] = this.listeners[ name ] ?? [];

    };

    removeListener ( name, callback ) {

        const listeners = this.listeners[ name ] ?? [];
        const newListeners = [];

        listeners.forEach( ( listener ) => {

            if ( listener !== callback ) newListeners.push( listener );

        });

        this.listeners[ name ] = newListeners;

    };

    emit ( name, params ) {

        const listeners = this.listeners[ name ] ?? [];

        listeners.forEach( ( listener ) => {

            listener( params );

        });

    };

};

export class WalletManager extends EventEmitter {

  constructor() {

    super();
    this.iframe = document.createElement("iframe");
    this.iframe.src = config.webaWalletURL;
    this.iframe.width = "0px";
    this.iframe.height = "0px";

    this.address = null;
    this.chainId = null;
    this.erc1155Contract = null;
    this.profile = {};
    this.webaWalletConnected = false;

    this.supportedChains = {
      137: "polygon",
      1: "eth",
      1338: "sidechain",
    };

    this.events = {
      webaWalletInited: "webawallet_inited",
      webaWalletLoaded: "webawallet_loaded",
      webaWalletConnected: "webawallet_connected",
      profile: "profile",
      nft: "nft",
      notification: "notification",
    };

    this.signer = null;
    this.provider = null;

    //

    document.body.appendChild(this.iframe);

    this.iframe.onload = () => {

      this.emit(this.events.webaWalletInited, {
        error: false,
        data: this.webaWalletConnected,
      });

    };

  };

  async connectMetamask() {

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
                chainId: "0x89",
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
          throw new Error("Please connect Metamask to Ethereum or Polygon mainnet.");
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
      this.provider = new ethers.providers.Web3Provider( providerMetamask );

      this.address = await this.provider.getSigner().getAddress();
      this.chainId = Number.parseInt(providerMetamask.chainId, 16);

      window.addEventListener("message", (ev) => {
        this.receiveMessage(ev);
      });
      this.sendMessage("check_auth", {});
    } else {
      throw new Error("Metamask not installed");
    }
  };

  checkAuthenticated() {
    this.sendMessage("check_auth", {});
  };

  async authenticate() {
    let fetchRes = await fetch( `${config.authServerURL}/metamask-login?address=${this.address}`);
    let fetchResJson = await fetchRes.json();
    if (fetchRes.status >= 400) {
      throw new Error(fetchResJson.message);
    }
    const messageToSign = fetchResJson.message;
    const signedMessage = await this.provider
      .getSigner()
      .signMessage(messageToSign);
    this.sendMessage("initiate_wallet_metamask", {
      signedMessage,
      address: this.address,
    });
  };

  getProfile() {
    this.sendMessage("get_profile", {});
    return this.profile;
  };

  async getNFTs() {
    let chain = this.supportedChains[`${this.chainId}`];
    if (!chain) {
      throw new Error(
        "Connected chain not supported. Please connect through ethereum, polygon or webaverse sidechain"
      );
    }
    this.nft = await fetch(
      `https://nft.webaverse.com/nft?chainName=${chain}&owner=${this.address}`
    ).then((res) => res.json());
    this.emit(this.events.nft, { error: false, data: this.nft });
  };

  setProfile(key, value) {
    this.sendMessage("set_profile", {
      key,
      value,
    });
  };

  sendMessage(method, data = {}) {
    const message = {
      method,
      data,
    };
    console.log("Sending message", message);
    if (!this.iframe.contentWindow) {
      throw new Error("iframe not loaded");
    }
    this.iframe.contentWindow.postMessage(JSON.stringify(message), "*");
  };

  receiveMessage(event) {
    // console.log("Received message", event);
    // if (event.origin !== config.authServerURL) {
    //   return;
    // }
    // console.log(event);
    const res = ( typeof event.data === 'string' ? JSON.parse(event.data) : event.data );
    if (res.type === "event") {
      if (res.method === "wallet_launched") {
        console.log('Webawallet launched');
        this.emit(this.events.webaWalletLoaded, {
          error: null,
        });
      }
    }

    if (res.type === "response") {
      if (res.method === "check_auth") {
        if (!res.data.auth) {
        //   this.authenticate();
          this.emit('user_not_auth', {
            error: null,
            success: "User not autintificated.",
          });
        } else {
          this.emit(this.events.notification, {
            error: null,
            success: "Webawallet initialized and ready to use now.",
          });
          this.webaWalletConnected = true;
          this.emit(this.events.webaWalletConnected, {
            error: false,
            data: this.webaWalletConnected,
          });
          this.emit('user_auth', {
            error: null,
            success: "User autintificated.",
          });
          this.getProfile();
          this.getNFTs();
        }
      } else if (res.method === "initiate_wallet_metamask") {
        this.emit(this.events.notification, {
          error: null,
          success: "Webawallet initialized and ready to use now.",
        });
        this.emit(this.events.webaWalletConnected, {
          error: false,
          data: this.webaWalletConnected,
        });
        this.emit('user_auth', {
          error: null,
          success: "User autintificated.",
        });
        this.getProfile();
        this.getNFTs();
      } else if (res.method === "get_profile") {
        console.log("Got profile");
        if (!res.error) {
          this.profile = res.data;
          this.emit(this.events.profile, {
            error: false,
            data: this.profile,
          });
        } else {
          this.emit(this.events.profile, {
            error: res.error,
            data: [],
          });
        }
      } else if (res.method === "set_profile") {
        if (!res.error) {
          this.emit(this.events.notification, {
            error: null,
            success: "Edit profile transaction created",
          });

          // Setting a 2 second timeout to make sure our sync server is updated
          // Given the transactions are slow this is negligible
          setTimeout(() => {
            this.sendMessage("get_profile", {});
          }, 2000);
        } else {
          console.error(res.error);
          this.emit(this.events.notification, {
            error: res.error,
            success: null,
          });
        }
      }
    }
  };

  async getEnsName(address) {
    return await this.provider.lookupAddress(address);
  };

  async getAvatarUrl(ensName) {
    const resolver = await this.provider.getResolver(ensName);
    const avatar = await resolver.getAvatar();
    if (avatar) {
      return avatar.url;
    } else {
      return null;
    }
  };

};
