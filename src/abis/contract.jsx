import NFT from "./WebaverseERC721.json"
import NFTProxy from "./WebaverseERC721Proxy.json"
import FT from "./WebaverseERC20.json"
import FTProxy from "./WebaverseERC20Proxy.json"
import Trade from "./WebaverseTrade.json"
import Account from "./WebaverseAccount.json"

const NFTABI = NFT.abi;
const NFTProxyABI = NFTProxy.abi;
const FTABI = FT.abi;
const FTProxyABI = FTProxy.abi;
const TradeABI = Trade.abi;
const AccountABI = Account.abi;

/////////// mumbai.polygon testnet (mintfee = 10) ////////////////////
// const AccountcontractAddress = "0xF0118e4e3d2074a0621C5C8e4A5Cf761ef1eFc7b";
// const FTcontractAddress = "0xf1C659696598647a0544c61D24b360e740D62634";
// const FTProxycontractAddress = "0xEeA97406Ce6154e3b189D5FA53790c81ecf1cBD3";
// const NFTcontractAddress = "0x9140B5A048C03A22861E7b4c380cA68A5A3Ee98F";
// const NFTProxycontractAddress = "0xE5a15065b0E8446c2E35879713EBBf339b004a67";
// const LANDcontractAddress = "0xcfb59Be415BC927bacf781d7Ed7B74a0Cb4aCE11";
// const LANDProxycontractAddress= "0x142B0a5F708D399b77349563F273Ad6C03EC28D2";
// const TradecontractAddress= "0x4D9486D6FBb53234616C9b1997BC31C649336948";
/////////////////////////////////////////////////////////////////////////

/////////// mumbai.polygon testnet (mintfee = 0) ////////////////////
const AccountcontractAddress = "0xF0118e4e3d2074a0621C5C8e4A5Cf761ef1eFc7b";
const FTcontractAddress = "0xf1C659696598647a0544c61D24b360e740D62634";
const FTProxycontractAddress = "0xEeA97406Ce6154e3b189D5FA53790c81ecf1cBD3";
const NFTcontractAddress = "0x9140B5A048C03A22861E7b4c380cA68A5A3Ee98F";
const NFTProxycontractAddress = "0xE5a15065b0E8446c2E35879713EBBf339b004a67";
const LANDcontractAddress = "0xcfb59Be415BC927bacf781d7Ed7B74a0Cb4aCE11";
const LANDProxycontractAddress= "0x142B0a5F708D399b77349563F273Ad6C03EC28D2";
const TradecontractAddress= "0x4D9486D6FBb53234616C9b1997BC31C649336948";
//////////////////////////////////////////////////////////////////////

export { 
    NFTABI, 
    NFTProxyABI,
    FTABI, 
    FTProxyABI,
    TradeABI,
    AccountABI,
    AccountcontractAddress, 
    FTcontractAddress, 
    FTProxycontractAddress, 
    NFTcontractAddress, 
    NFTProxycontractAddress, 
    LANDcontractAddress, 
    LANDProxycontractAddress,
    TradecontractAddress 
}
