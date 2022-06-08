import React, {useContext} from 'react';
import {ChainContext} from '../../hooks/chainProvider';
import { CONTRACTS } from '../../hooks/web3-constants';

export default function Chains() {
  const {chains, selectedChain, selectChain, isSupported} = useContext(ChainContext);
  return (<div style={{position: 'absolute', zIndex: 10, background: 'grey'}}>
    <h1>{selectedChain.name}</h1>

    <ul id="CHAINS" >
      {Object.keys(chains)
        .map(key => chains[key])
        .filter(isSupported)
        .map(c => (
          <li key={c.contract_name} onClick={() => setSelectedChain(c)}>{c.name}</li>
        ))}
    </ul>
  </div>
  );
}
