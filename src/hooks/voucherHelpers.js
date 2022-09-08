import {useEffect, useState, useContext} from 'react';
import { ethers } from 'ethers';
import { AppContext } from '../components/app';
import { AccountContext } from './web3AccountProvider';
import Web3 from '../../web3.min.js';
import useNFTContract from './useNFTContract';

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
            'Content-Type': 'application/json',
            'x-api-key' : "dXNlcm5hbWU6MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA"
        },
        body: JSON.stringify({ 
            signData: {tokenId, metadataurl, balance, nonce, expiry}
        })
    });
    const voucher = await response.json();
    return voucher;
}

export async function getVoucherFromUser(tokenId, signer, WebaversecontractAddress) {
    const metadataurl = "https://ipfs.webaverse.com/"  // temp url - not used
    const expiry = Math.round(new Date().getTime() / 1000) + 1000; // timestamp
    const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
    const balance = 1;

    const msgParams = JSON.stringify({
        domain: {
        // Defining the chain aka Rinkeby testnet or Ethereum Main Net
        chainId: 137,
        // Give a user friendly name to the specific contract you are signing for.
        name: 'Webaverse-voucher',
        // If name isn't enough add verifying contract to make sure you are establishing contracts with the proper entity
        verifyingContract: WebaversecontractAddress,
        // Just let's you know the latest version. Definitely make sure the field name is correct.
        version: '1',
        },

        // Defining the message signing data content.
        message: {
            tokenId, metadataurl, balance, nonce, expiry
        },
        // Refers to the keys of the *types* object below.
        primaryType: 'NFTVoucher',
        types: {
            // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' },
            ],
            // PrimaryType
            NFTVoucher: [
                { name: "tokenId", type: "uint256" },
                { name: "metadataurl", type: "string" },
                { name: "balance", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "expiry", type: "uint256" },
            ]
        },
    });

    const web3 = new Web3(window.ethereum);
    var params = [signer, msgParams];
    var method = 'eth_signTypedData_v4';
    return await new Promise((accept, reject) => {
        web3.currentProvider.sendAsync(
        {
            method,
            params,
            from: signer
        }, (err, { result }) => {
            const voucher = {
                tokenId, metadataurl, balance, nonce, expiry, signature: result
            }
            accept(voucher);
        })
    });
}

