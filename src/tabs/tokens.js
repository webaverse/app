/* eslint-disable camelcase */
/* eslint-disable no-useless-escape */
import React, {useEffect, useState} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import {tokensHost} from '../../constants';
import {preview} from '../../preview.js';

export const Tokens = ({userOpen, loginFrom, hacks, address}) => {
  const [nftPreviews, setNftPreviews] = useState({});
  const [nfts, setNfts] = useState(null);
  const [fetchPromises, setFetchPromises] = useState([]);

  useEffect(() => {
    console.log('Login From', loginFrom);
    if (address && !nfts && loginFrom) {
      setNfts([]);
      console.log('Setting NFTS');
      (async () => {
        if (loginFrom === 'metamask') {
          const res = await fetch(`https://api.opensea.io/api/v1/assets?owner=0x08e242bb06d85073e69222af8273af419d19e4f6&limit=${50}`, {
            headers: {
              'X-API-KEY': '6a7ceb45f3c44c84be65779ad2907046',
            },
          });

          const j = await res.json();
          const {assets} = j;
          setNfts(assets);
        } else if (loginFrom === 'discord') {
          const res = await fetch(`${tokensHost}/${address}`);
          let j = await res.json();
          console.log(j);
          j = j.map(j => {
            j.image_preview_url = j.hash;
            return j;
          });
          setNfts(j);
        }
        // console.log('got assets', assets);
      })();
    }
  }, [address, nfts, loginFrom]);

  useEffect(() => {
    if (nfts) {
      for (const nft of nfts) {
        if (!nftPreviews[nft.image_preview_url]) {
          nftPreviews[nft.image_preview_url] = 'images/loader.gif';
          if (loginFrom === 'metamask') {
            fetch(nft.image_preview_url).then(response => response.blob())
              .then(imageBlob => {
                const imageObjectURL = URL.createObjectURL(imageBlob);
                nftPreviews[nft.image_preview_url] = imageObjectURL;
                setNftPreviews(nftPreviews);
              });
          } else if (loginFrom === 'discord') {
            preview(nft.image_preview_url, nft.ext, 'png', 100, 100).then(res => {
              const imageObjectURL = URL.createObjectURL(res.blob);
              nftPreviews[nft.image_preview_url] = imageObjectURL;
              setNftPreviews(nftPreviews);
            });
          }
        }
      }
      setNftPreviews(nftPreviews);
    }
  });
  return (

    <section className={classnames(styles.sidebar, userOpen ? styles.open : null)}

      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
      }}>
      {(nfts || []).map((nft, i) => {
        const {id, asset_contract, hash, name, description} = nft;
        // const image_preview_url = hacks.getNftImage(nft);
        /* if (!image_preview_url) {
                    console.log('got nft', {nft, hacks, image_preview_url});
                    debugger;
                  } */
        // "https://storage.opensea.io/files/099f7815733ba38b897f892a750e11dc.svg"
        // console.log(nft);
        return <div className={styles.nft} onDragStart={e => {
          e.dataTransfer.setData('application/json', JSON.stringify(nft));
        }} draggable key={i}>
          <img src={nftPreviews[nft.image_preview_url] || 'images/loader.gif'} className={styles.preview} />
          <div className={styles.wrap}>
            <div className={styles.name}>{name}</div>
            <div className={styles.description}>{description}</div>
            <div className={styles.tokenid}>{asset_contract ? asset_contract.address : hash} / {id}</div>
          </div>
        </div>;
      })}
    </section>
  );
};
