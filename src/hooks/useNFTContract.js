import {useEffect, useState} from 'react';

import {ethers, BigNumber} from 'ethers';

import {DEFAULT_CHAIN, CONTRACTS, CONTRACT_ABIS, NFTcontractAddress, FTcontractAddress} from './web3-constants.js';
import { FTABI, NFTABI } from '../abis/contract.jsx';

const FILE_ADDRESS = 'https://ipfs.webaverse.com/';

const contractAddress = NFTcontractAddress; //CONTRACTS[DEFAULT_CHAIN.contract_name].NFT;
const contractAddressFT = FTcontractAddress; //CONTRACTS[DEFAULT_CHAIN.contract_name].FT;
const contractABI = NFTABI; // CONTRACT_ABIS.NFT;
const contractABIFT = FTABI; //CONTRACT_ABIS.FT;


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

export default function useNFTContract(currentAccount, notifymessage = () => {}, setCurrentApp = () => {}, setIsLoading = () => {}) {
  const [minting, setMinting] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [minted, setMinted] = useState([]);
  const [connectedContract, setConnectedContract] = useState();
  const [connectedContractFT, setConnectedContractFT] = useState();

  useEffect(() => {
    const mintHandler = (from, tokenId, name) => {
      // interact with game world here.
      notifymessage(from, tokenId, name);
      // interact with game world here.
      setMinting(false);
    };

    // if (connectedContract) {
    //   connectedContract.on(CONTRACT_EVENTS.MINT_COMPLETE, mintHandler);
    // }

    return () => {
      // if (connectedContract) {
      //   connectedContract.removeListener(mintHandler);
      // }
    };
  }, [connectedContract]);

  async function mintNFT(currentApp) {
    const {ethereum} = window;
    setMinting(true);

    try {
      const provider = new ethers.getDefaultProvider(
        DEFAULT_CHAIN.rpcUrls[0], // TODO: change to use the selected chain
      );
      const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
      // const signer = provider.getSigner(NFTcontractAddress);

      const connectedContract = new ethers.Contract(contractAddress, contractABI, signer);
      setConnectedContract(connectedContract);
      
      const connectedContractFT = new ethers.Contract(contractAddressFT, contractABIFT, signer);
      setConnectedContractFT(connectedContractFT);
      
      if (connectedContract) {
        setShowWallet(true);

        const name = currentApp.name;
        const ext = currentApp.contentId.split('.').pop();
        const hash = currentApp.contentId.split(FILE_ADDRESS)[1].split('/' + name + '.' + ext)[0];
        const description = currentApp.description;

        const contractMintFee = await connectedContract.mintFee();
        const mintfee = BigNumber.from(contractMintFee).toNumber();

        if (mintfee > 0) { // webaverse side chain mintfee != 0
            const silkAapproval = await connectedContractFT.approve(connectedContract.address, mintfee); // mintfee = 0 default
            const approval = await silkAapproval.wait();
            if (approval.transactionHash) {
                try {
                    const minttx = await connectedContract.mint(ethereum.selectedAddress, hash, name, ext, description, 1);
                    setCurrentApp(null);
                    setIsLoading(false);
                    let mintres = await minttx.wait()
                    if (mintres.transactionHash) {
                    notifymessage("Mint Complete!","success")
                    } else {
                    notifymessage("Mint failed!","error")
                    }
                } catch (err) {
                    console.log(err);
                    notifymessage("Mint failed!","error")
                }
            }
        } else { // mintfee = 0 for Polygon not webaverse sidechain
            try {
                const minttx = await connectedContract.mint(ethereum.selectedAddress, hash, name, ext, description, 1);
                setCurrentApp(null);
                setIsLoading(false);
                let mintres = await minttx.wait()
                if (mintres.transactionHash) {
                  notifymessage("Mint Complete!","success")
                } else {
                  notifymessage("Mint failed!","error")
                }
              } catch (err) {
                notifymessage("Mint failed!","error")
                console.log(err);
              }
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
      setShowWallet(false);
      setMinting(false);
    }
  }

  return {
    minting,
    mintNFT,
    minted,
    showWallet,
    setShowWallet,
    // getToken,
    // getNFTTotalSupply
  };
}

export function useStaticNFTContract() {
    const simpleRpcProvider = new ethers.providers.StaticJsonRpcProvider(DEFAULT_CHAIN.rpcUrls[0]);
    const contract = new ethers.Contract(contractAddress, contractABI, simpleRpcProvider);

    async function getNFTTotalSupply() {
        try {
            const BigtotalMintedToken = await contract.totalSupply();
            const totalMintedToken = BigNumber.from(BigtotalMintedToken).toNumber();
            return totalMintedToken;
        } catch (error) {
            
        }
    }

    async function getTokenURI(tokenId) {
        try {
            const rawToken = await contract.tokenURI(tokenId);
            // const token = await fetch(rawToken).then(r => r);
            // console.log("token",token)
            return rawToken;
        } catch (error) {
          
        }
      }

    return {
        getNFTTotalSupply,
        getTokenURI
    };

}
