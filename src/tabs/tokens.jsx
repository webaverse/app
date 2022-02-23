/* eslint-disable camelcase */
/* eslint-disable no-useless-escape */
import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {MetamaskWallet} from '../../blockchain/metamask';

export const Tokens = ({userOpen, loginFrom, address, chain, setChain}) => {
  const [nftPreviews, setNftPreviews] = useState({});
  const [nfts, setNfts] = useState(null);
  const [fetchPromises, setFetchPromises] = useState([]);

  useEffect(() => {
    if (address && loginFrom) {
      setNfts([]);
      if (loginFrom === 'metamask') {
        console.log('fetching tokens');
        (async () => {
          const {chainName} = await new MetamaskWallet().getChainInfo();
          if (chainName && chainName !== 'unknown') {
            const res = await fetch(
              `https://nft.webaverse.com/nft?chainName=${chainName}&owner=${address}`,
            );
            const nfts = await res.json();
            setNfts(nfts);
          } else {
            console.log('Network not supported: ', chainName);
          }
        })();
      } else if (loginFrom === 'discord') {
        (async () => {
          const res = await fetch(
            `https://nft.webaverse.com/nft?chainName=sidechain&owner=${address}`,
          );
          const nfts = await res.json();
          setNfts(nfts);
        })();
      }
    }
  }, [address, loginFrom]);

  useEffect(() => {
    if (nfts) {
      nfts.map(async nft => {
        nftPreviews[nft.metadata.image] = 'images/object.jpg';
        try {
          if (!nft.metadata || !nft.metadata.image) {
            throw new Error('No image use the default one');
          }
          const blob = await (await fetch(nft.metadata.image.replace('ipfs://', 'https://ipfs.webaverse.com/'))).blob();
          nftPreviews[nft.metadata.image] = URL.createObjectURL(blob);
        } catch (error) {
          console.warn(error);
        }
      });
      setNftPreviews(nftPreviews);
    }
  }, [nfts]);
  if (Array.isArray(nfts) && nfts.length > 0) {
    return (
      <section
        className={classnames(styles.sidebar, userOpen ? styles.open : null)}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {(nfts || []).map((nft, i) => {
          const {token_id, asset_contract, metadata} = nft;
          return (
            <div
              className={styles.nft}
              onDragStart={e => {
                e.dataTransfer.setData('application/json', JSON.stringify(nft));
              }}
              draggable
              key={i}
            >
              <img
                src={nftPreviews[nft.metadata.image] || 'images/object.jpg'}
                className={styles.preview}
              />
              <div className={styles.wrap}>
                <div className={styles.name}>{metadata.name}</div>
                <div className={styles.description}>{metadata.description}</div>
                <div className={styles.tokenid}>
                  {asset_contract.address} / {token_id}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    );
  } else {
    return (
      <section
        className={classnames(styles.sidebar, userOpen ? styles.open : null)}
        onClick={e => {
          e.preventDefault();
          e.stopPropagation();
        } } > <h2>No NFTs found</h2> </section>
    );
  }
};
