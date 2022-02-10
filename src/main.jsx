
import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './components/app';
import { Error } from './components/general/error-page';

//

const WebWorkerSupport = !navigator.userAgent.match(/(Firefox|MSIE)/);

ReactDOM.render(
    <React.StrictMode>
        {
            WebWorkerSupport ? (
                <App />
            ) : (
                <Error errors={[ 'WebWorker modules' ]} />
            )
        }
    </React.StrictMode>,
    document.getElementById('root'),
);
