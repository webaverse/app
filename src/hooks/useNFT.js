import {useEffect, useState} from 'react';

import {ethers} from 'ethers';

import {DEFAULT_CHAIN, CONTRACT, CONTRACT_ABIS} from '../constants';

const FILE_ADDRESS = 'https://ipfs.webaverse.com/';

const contractAddress = CONTRACT[DEFAULT_CHAIN.contract_name].NFT;
const contractAddressFT = CONTRACT[DEFAULT_CHAIN.contract_name].FT;
const contractABI = CONTRACT_ABIS.NFT;
const contractABIFT = CONTRACT_ABIS.FT;

const DEFAULT_GAS_LIMIT = 50000;
const DEFAULT_MINT_VALUE = 1000000000000000;

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

export default function useNFT(currentAccount) {
  const [minting, setMinting] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [minted, setMinted] = useState([]);
  const [connectedContract, setConnectedContract] = useState();
  const [connectedContractFT, setConnectedContractFT] = useState();

  useEffect(() => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        const provider = new ethers.getDefaultProvider(
          DEFAULT_CHAIN.rpcUrls[0], // TODO: change to use the selected chain
        );
        const signer = provider.getSigner();
        setConnectedContract(
          new ethers.Contract(contractAddress, contractABI, signer),
        );
      }
    } catch (error) {
      console.error(error);
    }
  }, [currentAccount]);

  useEffect(() => {
    try {
      const {ethereum} = window;

      if (ethereum) {
        const provider = new ethers.getDefaultProvider(
          DEFAULT_CHAIN.rpcUrls[0], // TODO: change to use the selected chain
        );
        const signer = provider.getSigner();
        setConnectedContract(
          new ethers.Contract(contractAddressFT, contractABIFT, signer),
        );
      }
    } catch (error) {
      console.error(error);
    }
  }, [connectedContractFT]);
    };

    if (connectedContract) {
      connectedContract.on(CONTRACT_EVENTS.MINT_COMPLETE, mintHandler);
    }

    return () => {
      if (connectedContract) {
        connectedContract.removeListener(mintHandler);
      }
    };
  }, [connectedContract]);

  async function mintNFT(name, description, numbers = []) {
    setMinting(true);
    try {
      if (connectedContract) {
        setShowWallet(true);
        const nftTxn = await connectedContract.GenNFT(
          name,
          description,
          numbers,
          {
            value: DEFAULT_MINT_VALUE,
            gasLimit: DEFAULT_GAS_LIMIT,
          },
        );
        setShowWallet(false);

        console.log('Mining...please wait.');
        await nftTxn.wait();

        console.log(
          `Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`,
        );
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setShowWallet(false);
      setMinting(false);
    }
  }

  async function getToken(tokenId) {
    try {
      if (connectedContract) {
        const rawToken = await connectedContract.tokenURI(tokenId);
        const token = await fetch(rawToken).then(r => r.json());
        return token;
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
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
    getToken,
  };
}
