import React, {useEffect, useState} from 'react';
import {switchChain} from './rpcHelpers';
import {DEFAULT_CHAIN, CHAINS, CONTRACTS} from './web3-constants';

export function isChainSupported(chain) {
  return CONTRACTS[chain.contract_name] !== undefined;
}

export default function useChain(network = DEFAULT_CHAIN) {
  const [selectedChain, setSelectedChain] = useState(network);


  function selectChain(chain) {
    if (isChainSupported(chain)) {
      switchChain(selectedChain.chainId).then(() => {
        setSelectedChain(chain);
      }).catch(console.warn);
    }
  }

  return {
    isChainSupported,
    selectedChain,
    selectChain,
    chains: CHAINS,
  };
}
