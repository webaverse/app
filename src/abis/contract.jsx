import NFT from "./WebaverseERC1155.json"
import FT from "./WebaverseERC20.json"
import Webaverse from "./Webaverse.json"
import Voucher from "./WebaverseVoucher.json"

const NFTABI = NFT.abi;
const FTABI = FT.abi;
const WebaverseABI = Webaverse.abi;
const VoucherABI = Voucher.abi;

export { 
    NFTABI, 
    FTABI, 
    WebaverseABI,
    VoucherABI
}
