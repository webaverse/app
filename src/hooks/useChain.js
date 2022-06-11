import React, {useEffect, useState} from 'react';
import {switchChain} from './rpcHelpers';
import {DEFAULT_CHAIN, CHAINS, CONTRACTS} from './web3-constants';

export function isChainSupported(chain) {
  return CONTRACTS[chain.contract_name] !== undefined;
}

export default function useChain(network = DEFAULT_CHAIN) {
  const [selectedChain, setSelectedChain] = useState(network);
  const [supportedChain, setSupportedChain] = useState(false);

  useEffect(() => {
    if (isChainSupported(selectedChain)) {
      setSupportedChain(true);
    } else {
      setSupportedChain(false);
    }
  }, [selectedChain]);

  const selectChain = useCallback((chain) => {
    if (isChainSupported(chain)) {
      switchChain(selectedChain.chainId).then(() => {
        console.log('chain ', selectedChain.chainId);
        setSelectedChain(() => {
          return {...chain};
        });
      }).catch(console.warn);
    }
  }
  , [selectedChain]);

  return {
    isChainSupported,
    selectedChain,
    selectChain,
    supportedChain,
    chains: CHAINS,
  };
}
