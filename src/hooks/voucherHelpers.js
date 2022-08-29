import {useEffect, useState, useContext} from 'react';
import { ethers } from 'ethers';
import { AppContext } from '../components/app';
import { AccountContext } from './web3AccountProvider';


export async function getVoucherFromServer(metadataurl) {
    const tokenId = 1;

    const expiry = Math.round(new Date().getTime() / 1000) + 1000;//timestamp
    // const expiry = 1657335995;//timestamp
    const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    // const nonce = 552311376;
    const balance = 1;

    const response = await fetch("http://localhost:8081/getServerDropVoucher", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            signData: {tokenId, metadataurl, balance, nonce, expiry}
        })
    });
    const voucher = await response.json();
    return voucher;
}

export async function getVoucherFromUserAccount(tokenId, signer) {
    console.log("signer", signer)
    
    // const tokenId = 1;
    const metadataurl = "https://ipfs.webaverse.com/"  // temp url - not used
    const expiry = Math.round(new Date().getTime() / 1000) + 1000; // timestamp
    // const expiry = 1657335995;//timestamp
    const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    // const nonce = 552311376;
    const balance = 1;

    const response = await fetch("http://localhost:8081/getUserDropVoucher", {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            signData: {tokenId, metadataurl, balance, nonce, expiry},
            signer
        })
    });
    const voucher = await response.json();
    return voucher;
}
