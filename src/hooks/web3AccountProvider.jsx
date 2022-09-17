import React, {createContext} from 'react';
import useWeb3Account from './useWeb3Account';

const AccountContext = createContext();

function AccountProvider({ children }) {
  const account = useWeb3Account();
  console
  return <AccountContext.Provider value={account}>
    {children}
  </AccountContext.Provider>;
}

export {AccountContext, AccountProvider};
