/* eslint-disable camelcase */
/* eslint-disable no-useless-escape */
import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import {tokensHost} from '../../constants';
import {preview} from '../../preview.js';

export const Tokens = ({userOpen, hacks, address}) => {
  const [nftPreviews, setNftPreviews] = useState({});
  const [nfts, setNfts] = useState(null);
  const [fetchPromises, setFetchPromises] = useState([]);

  useEffect(() => {
    if (address && !nfts) {
      setNfts([]);

      (async () => {
        const res = await fetch(`https://api.opensea.io/api/v1/assets?owner=${address}&limit=${50}`, {
          headers: {
            'X-API-KEY': '6a7ceb45f3c44c84be65779ad2907046',
          },
        });
        const j = await res.json();
        const {assets} = j;
        setNfts(assets);
        // console.log('got assets', assets);
      })();
    }
  }, [address, nfts]);

  return (
    <section className={classnames(styles.sidebar, userOpen ? styles.open : null)} onClick={e => {
      e.preventDefault();
      e.stopPropagation();
    }}>
      {(nfts || []).map((nft, i) => {
        const {id, asset_contract, name, description} = nft;
        const image_preview_url = hacks.getNftImage(nft);
        /* if (!image_preview_url) {
            console.log('got nft', {nft, hacks, image_preview_url});
            debugger;
          } */
        // "https://storage.opensea.io/files/099f7815733ba38b897f892a750e11dc.svg"
        // console.log(nft);
        return <div className={styles.nft} onDragStart={e => {
          e.dataTransfer.setData('application/json', JSON.stringify(nft));
        }} draggable key={i}>
          <img src={image_preview_url} className={styles.preview} />
          <div className={styles.wrap}>
            <div className={styles.name}>{name}</div>
            <div className={styles.description}>{description}</div>
            <div className={styles.tokenid}>{asset_contract.address} / {id}</div>
          </div>
        </div>;
      })}
    </section>
  );
};
