import NFT from './WebaverseERC721.json';
import NFTProxy from './WebaverseERC721Proxy.json';
import FT from './WebaverseERC20.json';
import FTProxy from './WebaverseERC20Proxy.json';
import Trade from './WebaverseTrade.json';
import Account from './WebaverseAccount.json';

const NFTABI = NFT.abi;
const NFTProxyABI = NFTProxy.abi;
const FTABI = FT.abi;
const FTProxyABI = FTProxy.abi;
const TradeABI = Trade.abi;
const AccountABI = Account.abi;

export {
  NFTABI,
  NFTProxyABI,
  FTABI,
  FTProxyABI,
  TradeABI,
  AccountABI,
};
