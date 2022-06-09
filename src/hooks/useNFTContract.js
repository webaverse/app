import {useEffect, useState} from 'react';

import {ethers, BigNumber} from 'ethers';

import {
  DEFAULT_CHAIN,
  CONTRACTS,
  CONTRACT_ABIS,
} from './web3-constants.js';
import {FTABI, NFTABI} from '../abis/contract.jsx';

const FILE_ADDRESS = 'https://ipfs.webaverse.com/';

const CONTRACT_EVENTS = {
  MINT_COMPLETE: 'MintComplete',
  METADATA_SET: 'MetadataSet',
  SINGLE_METADATA_SET: 'SingleMetadataSet',
  HASH_UPDATE: 'HashUpdate',
  COLLABORATOR_ADDED: 'CollaboratorAdded',
  COLLABORATOR_REMOVED: 'CollaboratorRemoved',
  SINGLE_COLLABORATOR_ADDED: 'SingleCollaboratorAdded',
  SINGLE_COLLABORATOR_REMOVED: 'SingleCollaboratorRemoved',
};

export default function useNFTContract(currentAccount, chain = DEFAULT_CHAIN) {
  const NFTcontractAddress = CONTRACTS[chain.contract_name].NFT;
  const FTcontractAddress = CONTRACTS[chain.contract_name].FT;

  const [minting, setMinting] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [error, setError] = useState('');

  async function getSigner() {
    var provider = new ethers.providers.Web3Provider(window.ethereum);
    return provider.getSigner(currentAccount);
  }

  const getContract = async () => {
    const simpleRpcProvider = new ethers.providers.StaticJsonRpcProvider(chain.rpcUrls[0]);
    const contract = new ethers.Contract(NFTcontractAddress, NFTABI, simpleRpcProvider);
    return contract;
  };

  async function mintNFT(currentApp, callback = () => {}) {
    setMinting(true);
    setError('');
    try {
      const signer = await getSigner();

      const name = currentApp.name;
      const ext = currentApp.contentId.split('.').pop();
      const hash = currentApp.contentId.split(FILE_ADDRESS)[1].split('/' + name + '.' + ext)[0];
      const description = currentApp.description;

      const NFTcontract = new ethers.Contract(NFTcontractAddress, NFTABI, signer);
      const FTcontract = new ethers.Contract(FTcontractAddress, FTABI, signer);
      const Bigmintfee = await NFTcontract.mintFee();
      const mintfee = BigNumber.from(Bigmintfee).toNumber();
      if (mintfee > 0) { // webaverse side chain mintfee != 0
        const FTapprovetx = await FTcontract.approve(NFTcontractAddress, mintfee); // mintfee = 10 default
        const FTapproveres = await FTapprovetx.wait();
        if (FTapproveres.transactionHash) {
          try {
            const NFTmintres = await NFTcontract.mint(currentAccount, hash, name, ext, description, 1);
            // after mint transaction, refresh the website
            onMint(NFTmintres);
            } catch (err) {
            setError(err.message);
          }
          setMinting(false);
        }
      } else { // mintfee = 0 for Polygon not webaverse sidechain
        try {
          const NFTmintres = await NFTcontract.mint(currentAccount, hash, name, ext, description, 1);
          onMint(NFTmintres);
          // after mint transaction, refresh the website
        } catch (err) {
          setError(error.message);
          setMinting(false);
        }
      }
    } catch (error) {
      setError(error.message);
      setMinting(false);
    }
  }

  async function totalSupply() {
    const contract = await getContract();
    const totalSupply = await contract.totalSupply();
    return BigNumber.from(totalSupply).toNumber();
  }

  async function getTokenIdsOf() {
    const contract = await getContract();
    const tokenIdsOf = await contract.getTokenIdsOf(currentAccount);
    return tokenIdsOf;
  }

  async function getToken(tokenId) {
    const contract = await getContract();
    if (contract) {
      return await contract.tokenURI(tokenId);
    } else {
      return {};
    }
  }

  async function getTokens() {
    const tokenIdsOf = await getTokenIdsOf();
    return await Promise.all(tokenIdsOf.map(async (tokenId) => {
      const token = await getToken(tokenId);
      return token;
    }));
  }

  return {
    totalSupply,
    minting,
    mintNFT,
    getContract,
    showWallet,
    setShowWallet,
    getToken,
    getTokens,
    getTokenIdsOf,
    error,
    setError,
  };
}