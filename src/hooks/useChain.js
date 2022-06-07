import React, {useState} from 'react';
import {DEFAULT_CHAIN, CHAINS} from './web3-constants';

export default function useChain(network = DEFAULT_CHAIN) {
  const [selectedChain, setSelectedChain] = useState(network);

  return {
    selectedChain,
    setSelectedChain,
    chains: CHAINS,
  };
}
