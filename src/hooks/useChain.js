import React, {useEffect, useState} from 'react';
import {switchChain} from './rpcHelpers';
import {DEFAULT_CHAIN, CHAINS} from './web3-constants';

export default function useChain(network = DEFAULT_CHAIN) {
  const [selectedChain, setSelectedChain] = useState(network);

  useEffect(() => {
    switchChain(selectedChain.chainId);
  }, [selectedChain]);

  return {
    selectedChain,
    setSelectedChain,
    chains: CHAINS,
  };
}
