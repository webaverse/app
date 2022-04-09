/* eslint-disable camelcase */
/* eslint-disable no-useless-escape */

import React, { useContext, useEffect, useState } from 'react';
import classnames from 'classnames';

import { tokensHost } from '../../constants';
import { AppContext } from '../components/app';

import styles from '../Header.module.css';

//

export const Tokens = ({userOpen, loginFrom, hacks, address}) => {

    const { state } = useContext( AppContext );
    const [nftPreviews, setNftPreviews] = useState({});
    const [nfts, setNfts] = useState(null);
    const [fetchPromises, setFetchPromises] = useState([]);

    //

    useEffect( () => {

        if ( address && !nfts && loginFrom ) {

            setNfts([]);

            (async () => {

                if (loginFrom === 'metamask') {

                    const res = await fetch(`https://api.opensea.io/api/v1/assets?owner=${address}&limit=${50}`, { headers: { 'X-API-KEY': '6a7ceb45f3c44c84be65779ad2907046', } });
                    const j = await res.json();
                    const {assets} = j;
                    setNfts(assets);

                } else if (loginFrom === 'discord') {

                    let res = await fetch(`${tokensHost}/${address}`);
                    res = await res.json();

                    res = res.map(_nft => {

                        /** Modify the response recieved from the API-Backend to match standardise format */
                        _nft.image_preview_url = _nft.hash;
                        return _nft;

                    });

                    setNfts(res);

                }

            })();

        }

    }, [ address, nfts, loginFrom ] );

    useEffect( () => {

        if (nfts) {

            for (const nft of nfts) {

                if (!nftPreviews[nft.image_preview_url]) {

                    nftPreviews[nft.image_preview_url] = 'images/object.jpg';

                    if (loginFrom === 'metamask') {

                        fetch(nft.image_preview_url).then(response => response.blob()).then(imageBlob => {

                            const imageObjectURL = URL.createObjectURL(imageBlob);
                            nftPreviews[nft.image_preview_url] = imageObjectURL;
                            setNftPreviews(nftPreviews);

                        });

                    } else if (loginFrom === 'discord') {

                        /** Will be switched after Previews-Merge */
                        // preview(nft.image_preview_url, nft.ext, 'png', 100, 100).then(res => {
                        //   const imageObjectURL = URL.createObjectURL(res.blob);
                        //   nftPreviews[nft.image_preview_url] = imageObjectURL;
                        //   setNftPreviews(nftPreviews);
                        // });
                    }

                }

            }

            setNftPreviews(nftPreviews);

        }

    });

    //

    return (
        <section className={classnames(styles.sidebar, state.openedPanel === 'UserPanel' ? styles.open : null)}
            onClick={e => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
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
                    <img src={nftPreviews[nft.image_preview_url] || 'images/object.jpg'} className={styles.preview} />
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
