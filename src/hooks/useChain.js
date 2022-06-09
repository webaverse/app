import React, {useEffect, useState} from 'react';
import {switchChain} from './rpcHelpers';
import {DEFAULT_CHAIN, CHAINS, CONTRACTS} from './web3-constants';

export default function useChain(network = DEFAULT_CHAIN) {
  const [selectedChain, setSelectedChain] = useState(network);

  function isSupported(chain) {
    return CONTRACTS[chain.contract_name] !== undefined;
  }

  function selectChain(chain) {
    if (isSupported(chain)) {
      switchChain(selectedChain.chainId).then(() => {
        setSelectedChain(chain);
      }).catch(console.warn);
    }
  }

  return {
    isSupported,
    selectedChain,
    selectChain,
    chains: CHAINS,
  };
}
