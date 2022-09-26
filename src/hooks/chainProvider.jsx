import React, {createContext} from 'react';
import useChain from './useChain';
import {DEFAULT_CHAIN} from './web3-constants';

const ChainContext = createContext();

function ChainProvider({children}) {
  const account = useChain(DEFAULT_CHAIN);
  return <ChainContext.Provider value={account}>
    {children}
  </ChainContext.Provider>;
}

export {ChainContext, ChainProvider};
