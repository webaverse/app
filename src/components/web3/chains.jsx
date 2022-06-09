import React, {useContext, useState} from 'react';
import {ChainContext} from '../../hooks/chainProvider';

import styles from './chains.module.css';

export default function Chains() {
  const {chains, selectedChain, selectChain, isSupported} = useContext(ChainContext);

  const [open, setOpen] = useState(false);
  return (<div style={{background: selectedChain.brandColor || 'black'}} className={styles.chainSelector}>
    <div className={styles.selectedChain} onClick={() => setOpen(!open)}>{selectedChain.name}:</div>
    <div className={[styles.chainDropDown, open ? styles.showChainSelector : styles.hideChainSelector].join(' ')}>
      <ul id="chains" className={styles.chains}>
        {Object.keys(chains)
          .map(key => chains[key])
          .filter(isSupported)
          .map(c => (
            <li key={c.contract_name} className={selectedChain.chainId === c.chainId ? styles.selected : undefined}><button onClick={() => {
              setOpen(false);
              selectChain(c);
            }}>{c.name}</button></li>
          ))}
      </ul>
    </div>
  </div>
  );
}
