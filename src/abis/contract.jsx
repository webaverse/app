import NFT from "./WebaverseERC721.json"
import FT from "./WebaverseERC20.json"

const NFTABI = NFT.abi;
const FTABI = FT.abi;

const AccountcontractAddress = "0x3077E2a272fDF73Df414d0017B3280F143587094";
const FTcontractAddress = "0x3243338940ECdD49448AD66baFbBf2E169f3D3c6";
const FTProxycontractAddress = "0x08E7f3d5F8836d9E4Da3f28aFCB1Be6Af1c90476";
const NFTcontractAddress = "0xc043479003b5d338A8a632E05C5868540837BA44";
const NFTProxycontractAddress = "0x6d345d4cB6e93FFb10260a321978088968363257";
const LANDcontractAddress = "0x0755af05B2B378FD682b53d8eb05F6039C5EA56C";
const LANDProxy= "0xE3C83C5669584D7A0F0179A99FAb18d27c96B009";

export { NFTABI, FTABI, AccountcontractAddress, FTcontractAddress, FTProxycontractAddress, NFTcontractAddress, NFTProxycontractAddress, LANDcontractAddress, LANDProxy }
