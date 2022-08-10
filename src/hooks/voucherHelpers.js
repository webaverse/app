import { ethers } from 'ethers';

export async function getVoucherFromServer(metadataurl) {
    const tokenId = 1;

    const expiry = Math.round(new Date().getTime() / 1000) + 1000;//timestamp
    // const expiry = 1657335995;//timestamp
    const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    // const nonce = 552311376;
    const balance = 1;

    const response = await fetch("http://localhost:8081/claim", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({tokenId, metadataurl, balance, nonce, expiry})
    });
    const voucher = await response.json();
    return voucher;
}