import { ethers } from 'ethers';

export async function getVoucherFromServer() {
    const tokenId = 1;

    const expiry = Math.round(new Date().getTime() / 1000) + 1000;//timestamp
    // const expiry = 1657335995;//timestamp
    const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    // const nonce = 552311376;
    const balance = 0;

    const response = await fetch("http://172.32.13.15:8081/claim", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({tokenId, balance, nonce, expiry})
    });
    const voucher = await response.json();
    return voucher;
}