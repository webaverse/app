import React, {useEffect, useState} from 'react';
import {switchChain} from './rpcHelpers';
import {DEFAULT_CHAIN, CHAINS, CONTRACTS} from './web3-constants';

export default function useChain(network = DEFAULT_CHAIN) {
  const [selectedChain, setSelectedChain] = useState(network);

  useEffect(() => {
    switchChain(selectedChain.chainId);
  }, [selectedChain]);
  function isSupported(chain) {
    return CONTRACTS[chain.contract_name] !== undefined;
  }

  return {
    isSupported,
    selectedChain,
    setSelectedChain,
    chains: CHAINS,
  };
}
