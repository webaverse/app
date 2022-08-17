import {useEffect, useState, useContext} from 'react';
import {ethers, BigNumber} from 'ethers';

import {
  CONTRACTS,
} from './web3-constants.js';
import {FTABI, NFTABI, WebaverseABI} from '../abis/contract.jsx';
import {ChainContext} from './chainProvider.jsx';
import {handleBlobUpload} from '../../util.js';
import {registerLoad} from '../LoadingBox.jsx';

const FILE_ADDRESS = 'https://ipfs.webaverse.com/ipfs/';

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

  const [minting, setMinting] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (CONTRACTS[selectedChain.contract_name]) {
        const WebaversecontractAddress = CONTRACTS[selectedChain.contract_name].Webaverse;
        const NFTcontractAddress = CONTRACTS[selectedChain.contract_name].NFT;
        const FTcontractAddress = CONTRACTS[selectedChain.contract_name].FT;
        setWebaversecontractAddress(WebaversecontractAddress);
        setNFTcontractAddress(NFTcontractAddress);
        setFTcontractAddress(FTcontractAddress);
      } else {
        throw new Error('unsupported chain');
      }
    } catch (error) {
      console.warn('tried to use contract for unsupported chain');
    }
  }, [selectedChain]);

  async function getSigner() {
    var provider = new ethers.providers.Web3Provider(window.ethereum);
    return provider.getSigner(currentAccount);
  }

  const getContract = async () => { // NFTcontract
    const simpleRpcProvider = new ethers.providers.StaticJsonRpcProvider(selectedChain.rpcUrls[0]);
    const contract = new ethers.Contract(NFTcontractAddress, NFTABI, simpleRpcProvider);
    return contract;
  };

  async function mintNFT(currentApp, previewImage, callback = () => {}, afterminting = () => {}) {
    setMinting(true);
    setError('');
    try {
      let imageURI;
      let avatarURI;

      const signer = await getSigner();
      const name = currentApp.name;
      const ext = currentApp.appType;
      //   const hash = currentApp.contentId.split(FILE_ADDRESS)[1].split('/')[0];
      const description = currentApp.description;

      const metadataFileName = `${name}-metadata.json`;
      let metadata;
      if (previewImage) { // 3D object
        imageURI = previewImage;
        avatarURI = currentApp.contentId;

        metadata = {
          name,
          description,
          image: imageURI,
          animation_url: avatarURI,
        };
      } else { // image object
        imageURI = currentApp.contentId;
        avatarURI = '';

        metadata = {
          name,
          description,
          image: imageURI,
        };
      }

      const type = 'upload';
      let load = null;
      // const json_hash = await handleBlobUpload(metadataFileName, JSON.stringify(metadata) )
      // handleBlobUpload
      // new Blob([JSON.stringify(metadata)], {type: 'text/plain'});
      const json_hash = await handleBlobUpload(metadataFileName, new Blob([JSON.stringify(metadata)], {type: 'text/plain'}), {
        onTotal(total) {
          load = registerLoad(type, metadataFileName, 0, total);
        },
        onProgress(e) {
          if (load) {
            load.update(e.loaded, e.total);
          } else {
            load = registerLoad(type, metadataFileName, e.loaded, e.total);
          }
        },
      });
      if (load) {
        load.end();
      }

      const metadatahash = json_hash.split(FILE_ADDRESS)[1].split('/')[0];
      const Webaversecontract = new ethers.Contract(WebaversecontractAddress, WebaverseABI, signer);
      // const NFTcontract = new ethers.Contract(NFTcontractAddress, NFTABI, signer);
      const FTcontract = new ethers.Contract(FTcontractAddress, FTABI, signer);

      const Bigmintfee = await Webaversecontract.mintFee();
      const mintfee = BigNumber.from(Bigmintfee).toNumber();

      if (mintfee > 0) { // webaverse side chain mintfee != 0
        const FTapprovetx = await FTcontract.approve(NFTcontractAddress, mintfee); // mintfee = 10 default
        const FTapproveres = await FTapprovetx.wait();
        if (FTapproveres.transactionHash) {
          try {
            const minttx = await Webaversecontract.mint(currentAccount, 1, metadatahash, '0x');
            const res = await minttx.wait();
            if (res.transactionHash) {
              callback();
            }
          } catch (err) {
            console.warn('minting to webaverse contract failed');
            setError('Mint Failed');
          }
        }
      } else { // mintfee = 0 for Polygon not webaverse sidechain
        try {
          const minttx = await Webaversecontract.mint(currentAccount, 1, metadatahash, '0x');
          //   callback(minttx);
          callback();
          const res = await minttx.wait();
          if (res.transactionHash) {
            afterminting();
          }
        } catch (err) {
          console.warn('minting to webaverse contract failed');
          setError('Mint Failed');
        }
      }
      setMinting(false);
    } catch (err) {
      console.warn('minting to webaverse contract failed');
      setError('Mint Failed');
      setMinting(false);
    }
  }

  async function mintfromVoucher(app, callback = () => {}) { //server drop
    setMinting(true);
    setError('');
    if(app.type === "major") {
        try {
        const signer = await getSigner();
        const webaverseContract = new ethers.Contract(
            WebaversecontractAddress,
            WebaverseABI,
            signer
        );
        const FTcontract = new ethers.Contract(FTcontractAddress, FTABI, signer);

        const bigMintFee = await webaverseContract.mintFee();
        const mintfee = BigNumber.from(bigMintFee).toNumber();
        if (mintfee > 0) {
            // webaverse side chain mintfee != 0
            const FTapprovetx = await FTcontract.approve(
            WebaversecontractAddress,
            mintfee
            ); // mintfee = 10 default
            const FTapproveres = await FTapprovetx.wait();
            if (FTapproveres.transactionHash) {
                if(app.serverDrop === true) {
                    try {
                    const res = await webaverseContract.claimServerDropNFT(
                        currentAccount,
                        app.name,
                        app.level.toString(),
                        "0x",
                        app.voucher
                    );
                    callback(res);
                    } catch (err) {
                    console.warn("NFT minting to webaverse contract failed");
                    setError("NFT Mint Failed");
                    }
                } else {
                    try {
                    const res = await webaverseContract.claim_NFT(
                        currentAccount,
                        "0x",
                        app.voucher
                    );
                    callback(res);
                    } catch (err) {
                    console.warn("NFT claiming to webaverse contract failed");
                    setError("NFT Mint Failed");
                    }
                }
            }
        } else {
            if (app.serverDrop === true) {
                try {
                const res = await webaverseContract.claimServerDropNFT(
                    currentAccount,
                    app.name,
                    app.level.toString(),
                    "0x",
                    app.voucher
                );
                callback(res);
                } catch (err) {
                console.warn("NFT minting to webaverse contract failed");
                setError("NFT Mint Failed");
                }
            } else {
                try {
                const res = await webaverseContract.claim_NFT(
                    currentAccount,
                    "0x",
                    app.voucher
                );
                callback(res);
                } catch (err) {
                console.warn("NFT claiming to webaverse contract failed");
                setError("NFT Mint Failed");
                }
            }
            }
        setMinting(false);
        } catch (err) {
        console.warn("NFT minting to webaverse contract failed");
        setError("NFT Mint Failed");
        setMinting(false);
        }
    }
    if (app.type === "minor") {
        try {
            const signer = await getSigner();
            const webaverseContract = new ethers.Contract(
            WebaversecontractAddress,
            WebaverseABI,
            signer
            );

            if (app.serverDrop === true) {
            try {
                const res = await webaverseContract.claimServerDropFT(
                currentAccount,
                app.voucher
                );
                callback(res);
            } catch (err) {
                console.warn("FT minting to webaverse contract failed");
                setError("Mint Failed");
            }
            } else {
            try {
                const res = await webaverseContract.claim_FT(
                currentAccount,
                app.voucher
                );
                callback(res);
            } catch (err) {
                console.warn("FT claiming to webaverse contract failed");
                setError("Mint Failed");
            }
            }
            setMinting(false);
        } catch (err) {
            console.warn("FT minting to webaverse contract failed");
            setError("FT Failed");
            setMinting(false);
        }
    }

  }

  async function totalSupply() {
    const contract = await getContract();
    const totalSupply = await contract.totalSupply();
    return BigNumber.from(totalSupply).toNumber();
  }

  async function getTokenIdsOf() {
    const contract = await getContract();
    const tokenData = await contract.getTokenIdsByOwner(currentAccount);
    const tokenCount = BigNumber.from(tokenData[1]).toNumber();
    const tokenIds = [...Array(tokenCount)].map((_, index) => BigNumber.from(tokenData[0][index]).toNumber());
    return tokenIds;
  }

  async function getToken(tokenId) {
    const contract = await getContract();
    if (contract) {
    //   return await contract.uri(tokenId);
    const tokenData = await contract.getTokenAttr(tokenId);
    return tokenData;
    } else {
      return {};
    }
  }

  async function getTokens() {
    const tokenIdsOf = await getTokenIdsOf();
    return await Promise.all(tokenIdsOf.map(async tokenId => {
      const token = await getToken(tokenId);
      const [url, name, level] = token;

      return {
        url,
        name,
        level
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
    mintfromVoucher,
    getTokenIdsOf,
    error,
    setError,
  };
}
