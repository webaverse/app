import React, {useContext, useState} from 'react';
import {ChainContext} from '../../hooks/chainProvider';
import {isChainSupported} from '../../hooks/useChain';
import {CHAIN_TYPE} from '../../hooks/web3-constants';

import styles from './chains.module.css';

function Supported({chain}) {
  return <>{!isChainSupported(chain) && '❌' } {chain.type === CHAIN_TYPE.TEST && '🧪'}</>;
}

export default function Chains() {
  const {chains, selectedChain, selectChain} = useContext(ChainContext);
  const {brandColor} = selectedChain;

  const [open, setOpen] = useState(false);
  return (<div className={styles.chainSelector}>
    <div style={{background: '#C900C1' || 'black'}} className={styles.selectedChain} onClick={() => setOpen(!open)}>
        {/* <img src={open ? '/images/ui/chainUp.svg' : '/images/ui/chainDown.svg'} />
        <Supported chain={selectedChain} />  */}
    {selectedChain.name}</div>
    <div className={[styles.chainDropDown, open ? styles.showChainSelector : styles.hideChainSelector].join(' ')}>
      <ul id="chains" className={styles.chains}>
        {Object.keys(chains)
          .map(key => chains[key])
          .filter(isChainSupported)
          .map(c => (
            <li key={c.chainId} className={selectedChain.chainId === c.chainId ? styles.selected : undefined}>
                <button onClick={() => {
                    selectChain(c);
                    setOpen(false);
                }}>
                {/* <Supported chain={c} />  */}
                {c.name}
                </button>
            </li>
          ))}
      </ul>
    </div>
  </div>
  );
}
