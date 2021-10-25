import { ethers } from "ethers";
import ABI from "./artifacts/WebaverseERC721.json";
import config from "./config";
const { ClaimableVoucher } = require("./lib");

if (localStorage.getItem("mintedIDs") === null) {
    localStorage.setItem("mintedIDs", JSON.stringify([]));
}

const contractAddress = config.networks.rinkeby.contractAddress;
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, ABI.abi, signer);
let voucher;

async function mint(tokenURI) {
    const tokenID = ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    try {
        console.log(tokenID);
        await contract.mint(await signer.getAddress(), tokenID, tokenURI);
        localStorage.setItem(
            "mintedIDs",
            JSON.stringify([...JSON.parse(localStorage.getItem("mintedIDs")), tokenID])
        );
        console.log(JSON.parse(localStorage.getItem("mintedIDs")));
    } catch (err) {
        console.log(err.error);
    }
}

async function drop(localStorageSlotIndex) {
    const claimableVoucher = new ClaimableVoucher({ contract: contract, signer: signer });
    const tokenID = localStorageSlotIndex;

    const timestamp = Math.round(new Date().getTime() / 1000) + 1000;
    const nonce = await ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    const balance = 0;

    try {
        voucher = await claimableVoucher.createVoucher(tokenID, balance, nonce, timestamp);
    } catch (err) {
        console.log(err);
    }

    console.log(voucher);

    localStorage.setItem("latestvoucher", JSON.stringify(voucher));
    let mintedIDs = JSON.parse(localStorage.getItem("mintedIDs"));
    mintedIDs.splice(mintedIDs.indexOf(tokenID), 1);
    await localStorage.setItem("mintedIDs", JSON.stringify(mintedIDs));
    console.log(JSON.parse(localStorage.getItem("mintedIDs")));
    return Promise.resolve(JSON.stringify(voucher));
}

async function redeem(voucher) {
    try {
        await contract.claim(await signer.getAddress(), voucher);
        contract.on("Transfer", (from, to, tokenId) => {
            if (from != ethers.constants.AddressZero)
                console.log("From : ", from, "To :", to, "Token ID :", tokenId.toNumber());
        });
    } catch (err) {
        console.log(err);
    }
}

window.onload = async () => {
    await window.ethereum.enable();

    document.getElementById("mint").addEventListener("click", async () => {
        await mint(
            "https://gateway.pinata.cloud/ipfs/QmRpBLJEG6HkqokZhHAAKfBsJpGB58d3rMqFPHBCsH5VDv"
        );
    });

    document.getElementById("drop").addEventListener("click", async () => {
        await drop(JSON.parse(localStorage.getItem("mintedIDs")).shift());
    });

    document.getElementById("redeem").addEventListener("click", async () => {
        await redeem(JSON.parse(localStorage.getItem("latestvoucher")));
    });
};
