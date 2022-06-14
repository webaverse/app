import React, {useCallback, useEffect, useState} from 'react';
import {switchChain} from './rpcHelpers';
import {DEFAULT_CHAIN, CHAINS, CONTRACTS, WEB3_EVENTS, CHAIN_ID_MAP, isLocal} from './web3-constants';

export function isChainSupported(chain) {
  return CONTRACTS[chain.contract_name] !== undefined || isLocal;
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

  useEffect(() => {
    const handleChainChanged = async chainId => {
      if (!CHAIN_ID_MAP[chainId]) return;

      const newChain = CHAINS[CHAIN_ID_MAP[chainId]];
      setSelectedChain(newChain);
    };

    if (window.ethereum) {
      window.ethereum.on(WEB3_EVENTS.CHAIN_CHANGED, handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener(
          WEB3_EVENTS.CHAIN_CHANGED,
          handleChainChanged,
        );
      }
    };
  }, []);

  const selectChain = useCallback(chain => {
    if (isChainSupported(chain)) {
      switchChain(chain.chainId).then(() => {
        console.log('chain', chain.chainId);
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
