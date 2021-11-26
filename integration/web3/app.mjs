import config from './config';
import {ethers} from 'ethers';
import 'regenerator-runtime/runtime';
import ABI from './artifacts/WebaverseERC721.json';
import axios from 'axios';

import { ClaimableVoucher } from './lib/ClaimableVoucher';
const contractAddress = config.networks.rinkeby.contractAddress;
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, ABI.abi, signer);
let voucher;

async function fetchTokenIds(address) {
  const tokenIdsRes = await axios.get(`http://localhost:3000/tokenids?address=${address}`);
  const tokenIds = tokenIdsRes.data;
  return Object.values(tokenIds.Item);
}

async function mint(tokenURI) {
  try {
    await contract.mint(await signer.getAddress(), tokenURI, {gasLimit: 200000});
  } catch (err) {
    console.log(err);
  }
}

async function drop(tokenID) {
  const claimableVoucher = new ClaimableVoucher({contract: contract, signer: signer});
  const timestamp = Math.round(new Date().getTime() / 1000) + 1000;
  const nonce = await ethers.BigNumber.from(ethers.utils.randomBytes(4)).toNumber();
  const balance = 0;

  try {
    voucher = await claimableVoucher.createVoucher(tokenID, balance, nonce, timestamp);
  } catch (err) {
    console.log('err', err);
  }

  localStorage.setItem('latestvoucher', JSON.stringify(voucher));
  return Promise.resolve(voucher);
}

async function redeem(voucher) {
  try {
    await contract.claim(await signer.getAddress(), voucher);
    contract.on('Transfer', (from, to, tokenId) => {
      if (from !== ethers.constants.AddressZero) { console.log('From : ', from, 'To :', to, 'Token ID :', tokenId.toNumber()); }
    });
  } catch (err) {
    console.log(err);
  }
}

const e = {
  fetchTokenIds,
  mint,
  drop,
  redeem,
};

export default e;