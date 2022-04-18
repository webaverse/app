import WebaverseABI from "../abi/Webaverse.json";
import WebaverseERC1155ABI from "../abi/WebaverseERC1155.json";
import WebaverseERC20ABI from "../abi/WebaverseERC20.json";
import WebaverseAccountsABI from "../abi/Accounts.json";

export const config = {
  sidechainURL: "http://13.57.177.184:8545",
  authServerURL: "http://auth.webaverse.com",
  webaWalletURL: "http://auth.webaverse.com/weba-wallet",
  contracts: {
    erc1155: {
      abi: WebaverseERC1155ABI.abi,
      address: {
        1: "", // not deployed to eth
        137: "0x983F70fB1378b04089EF37344077FAb812F1B4e5", // polygon
        1338: "0x06bd28FBc5181dc24D2cD00d64FC12291626c2a2", // webaverse sidechain
      },
    },
    erc20: {
      abi: WebaverseERC20ABI.abi,
      address: {
        1: "", // not deployed to eth
        137: "0x55F34c8112c2aC8958d0E6CfD50D077A00aa62b7",
        1338: "0x18Cfbb0f0c298C7D4566254109D21A06BBED6bb2",
      },
    },
    webaverse: {
      abi: WebaverseABI.abi,
      address: {
        1: "", // not deployed to eth
        137: "0x458F0Ea512dd4dAb86475662FB4d0FDC6423d9CE",
        1338: "0x79df968029112B6c0bbc3Ed130f937D97ABA5126",
      },
    },
    accounts: {
      abi: WebaverseAccountsABI.abi,
      address: "0xEE64CB0278f92a4A20cb8F2712027E89DE0eB85e", // Only deployed to sidechain
    },
  },
};
