import React, {createContext} from 'react';
import useWeb3Account from './useWeb3Account';

const AccountContext = createContext();

function AccountProvider({currentAccount = '', address = '', children}) {
  const nft = useWeb3Account(currentAccount, address);

  return <AccountContext.Provider value={nft}>
    {children}
  </AccountContext.Provider>;
}

export {AccountContext, AccountProvider};
