import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './components/app';
import { ErrorPage } from './components/general/error-page';
import { ChainProvider } from './hooks/chainProvider';
import { AccountProvider } from './hooks/web3AccountProvider';

//

const WebWorkerSupport = !navigator.userAgent.match(/(Firefox|MSIE)/);
const Providers = ({children}) => {
    return (
        <AccountProvider>
            <ChainProvider>
                {children}
            </ChainProvider>
        </AccountProvider>
    );
};

//

ReactDOM.render(
  <React.StrictMode>
    {
        WebWorkerSupport ? (
            <Providers>
                <App />
            </Providers>
        ) : (
            <ErrorPage errors={[ 'WebWorker modules' ]} />
        )
    }
    </React.StrictMode>,
    document.getElementById('root'),
);
