import React, {Fragment, useContext, useState} from 'react';
import {ChainContext} from '../../hooks/chainProvider';
import {isChainSupported} from '../../hooks/useChain';
import {CHAIN_TYPE} from '../../hooks/web3-constants';

import styles from './chains.module.css';

function UpArrow() {
  return <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 330 330">
    <path fill="white" d="M325.606,229.393l-150.004-150C172.79,76.58,168.974,75,164.996,75c-3.979,0-7.794,1.581-10.607,4.394 l-149.996,150c-5.858,5.858-5.858,15.355,0,21.213c5.857,5.857,15.355,5.858,21.213,0l139.39-139.393l139.397,139.393 C307.322,253.536,311.161,255,315,255c3.839,0,7.678-1.464,10.607-4.394C331.464,244.748,331.464,235.251,325.606,229.393z"/>
  </svg>;
}

function DownArrow() {
  return <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 330 330">
    <path fill="white" d="M325.607,79.393c-5.857-5.857-15.355-5.858-21.213,0.001l-139.39,139.393L25.607,79.393 c-5.857-5.857-15.355-5.858-21.213,0.001c-5.858,5.858-5.858,15.355,0,21.213l150.004,150c2.813,2.813,6.628,4.393,10.606,4.393 s7.794-1.581,10.606-4.394l149.996-150C331.465,94.749,331.465,85.251,325.607,79.393z"/>
  </svg>;
}

function Supported({chain}) {
  return <Fragment>{!isChainSupported(chain) && '❌' } {chain.type === CHAIN_TYPE.TEST && '🧪'}</Fragment>;
}

export default function Chains() {
  const {chains, selectedChain, selectChain} = useContext(ChainContext);
  const {brandColor} = selectedChain;

  const [open, setOpen] = useState(false);
  return (<div className={styles.chainSelector}>
    <div style={{background: brandColor || 'black'}} className={styles.selectedChain} onClick={() => setOpen(!open)}>{open ? <UpArrow /> : <DownArrow />} <Supported chain={selectedChain} /> {selectedChain.name}</div>
    <div className={[styles.chainDropDown, open ? styles.showChainSelector : styles.hideChainSelector].join(' ')}>
      <ul id="chains" className={styles.chains}>
        {Object.keys(chains)
          .map(key => chains[key])
          .filter(isChainSupported)
          .map(c => (
            <li key={c.chainId} className={selectedChain.chainId === c.chainId ? styles.selected : undefined}><button onClick={() => {
              selectChain(c);
              setOpen(false);
            }}>
              <Supported chain={c} /> {c.name}</button></li>
          ))}
      </ul>
    </div>
  </div>
  );
}