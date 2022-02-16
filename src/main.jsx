import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './new-components/app';
import { ErrorPage } from './new-components/general/error-page';

//

const WebWorkerSupport = !navigator.userAgent.match(/(Firefox|MSIE)/);

ReactDOM.render(
  <React.StrictMode>
    {
        WebWorkerSupport ? (
            <App />
        ) : (
            <ErrorPage errors={[ 'WebWorker modules' ]} />
        )
    }
    </React.StrictMode>,
    document.getElementById('root'),
);
