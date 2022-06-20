import {useEffect, useState, useContext} from 'react';
import {Buffer} from 'buffer';
import {ethers, BigNumber} from 'ethers';

import {
  CONTRACTS,
} from './web3-constants.js';
import {FTABI, NFTABI, WebaverseABI} from '../abis/contract.jsx';
import {ChainContext} from './chainProvider.jsx';

const FILE_ADDRESS = 'https://ipfs.webaverse.com/';

// const CONTRACT_EVENTS = {
//   MINT_COMPLETE: 'MintComplete',
//   METADATA_SET: 'MetadataSet',
//   SINGLE_METADATA_SET: 'SingleMetadataSet',
//   HASH_UPDATE: 'HashUpdate',
//   COLLABORATOR_ADDED: 'CollaboratorAdded',
//   COLLABORATOR_REMOVED: 'CollaboratorRemoved',
//   SINGLE_COLLABORATOR_ADDED: 'SingleCollaboratorAdded',
//   SINGLE_COLLABORATOR_REMOVED: 'SingleCollaboratorRemoved',
// };

export default function useNFTContract(currentAccount) {
  const {selectedChain} = useContext(ChainContext);
  const [WebaversecontractAddress, setWebaversecontractAddress] = useState(null);
  const [NFTcontractAddress, setNFTcontractAddress] = useState(null);
  const [FTcontractAddress, setFTcontractAddress] = useState(null);

  useEffect(() => {
    try {
      const WebaversecontractAddress = CONTRACTS[selectedChain.contract_name].webaverse;
      const NFTcontractAddress = CONTRACTS[selectedChain.contract_name].NFT;
      const FTcontractAddress = CONTRACTS[selectedChain.contract_name].FT;
      setWebaversecontractAddress(NFTcontractAddress);
      setNFTcontractAddress(NFTcontractAddress);
      setFTcontractAddress(FTcontractAddress);
    } catch (error) {
      console.log(error);
    }
  }, [selectedChain]);

  const [minting, setMinting] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [error, setError] = useState('');

  async function getSigner() {
    var provider = new ethers.providers.Web3Provider(window.ethereum);
    return provider.getSigner(currentAccount);
  }

  const getContract = async () => { //NFTcontract
    const simpleRpcProvider = new ethers.providers.StaticJsonRpcProvider(selectedChain.rpcUrls[0]);
    const contract = new ethers.Contract(NFTcontractAddress, WebaverseABI, simpleRpcProvider);
    return contract;
  };

  async function mintNFT(currentApp, previewImage, callback = () => {}) {
    setMinting(true);
    setError('');
    try {
      let imageURI;
      let avatarURI;

      const signer = await getSigner();
      const name = currentApp.name;
      const ext = currentApp.appType;
      const hash = currentApp.contentId.split(FILE_ADDRESS)[1].split('/')[0];
      const description = currentApp.description;

      if (previewImage) { // 3D object
        imageURI = previewImage;
        avatarURI = currentApp.contentId;
      } else { // image object
        imageURI = currentApp.contentId;
        avatarURI = '';
      }

      const Webaversecontract = new ethers.Contract(WebaversecontractAddress, NFTABI, signer);
      const NFTcontract = new ethers.Contract(NFTcontractAddress, NFTABI, signer);
      const FTcontract = new ethers.Contract(FTcontractAddress, FTABI, signer);
      const Bigmintfee = await Webaversecontract.mintFee();
      const mintfee = BigNumber.from(Bigmintfee).toNumber();
      console.log("mintfee", mintfee)

      if (mintfee > 0) { // webaverse side chain mintfee != 0
        const FTapprovetx = await FTcontract.approve(NFTcontractAddress, mintfee); // mintfee = 10 default
        const FTapproveres = await FTapprovetx.wait();
        if (FTapproveres.transactionHash) {
          try {
            const Webaversemintres = await Webaversecontract.mint(currentAccount, 1, hash, "");
            callback(Webaversemintres);
          } catch (err) {
            setError(err.message);
          }
          setMinting(false);
        }
      } else { // mintfee = 0 for Polygon not webaverse sidechain
        try {
          const Webaversemintres = await Webaversecontract.mint(currentAccount, 1, hash, "");
        //   const Webaversemintres = await Webaversecontract.mint(currentAccount, hash, name, ext, imageURI, avatarURI, description, 1);
          callback(Webaversemintres);
        } catch (err) {
          setError('Mint Failed');
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
    const tokenIdsOf = await contract.getTokenIdsByOwner(currentAccount);
    return tokenIdsOf;
  }

  async function getToken(tokenId) {
    const contract = await getContract();
    if (contract) {
      return await contract.uri(tokenId);
    } else {
      return {};
    }
  }

  async function getTokens() {
    const tokenIdsOf = await getTokenIdsOf();
    return await Promise.all(tokenIdsOf.map(async tokenId => {
      const token = await getToken(tokenId);
      const Base64str = token.split('data:application/json;base64,')[1];
      const Jsonstr = Buffer.from(Base64str, 'base64').toString();
      const tokenData = JSON.parse(Jsonstr);
      const {name, image, animation_url} = tokenData;

      const url = animation_url || image;

      return {
        url,
        name,
      };
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
