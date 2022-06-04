import React from 'react';
import {CHAIN} from '../../hooks/web3-constants';

export default function Chains() {

  return (
    <ul id="CHAINS">
      {Object.keys(CHAIN)
        .map(key => CHAIN[key])
        .map(c => (
          <li>{c.name}</li>
        ))}
    </ul>
  );
}
