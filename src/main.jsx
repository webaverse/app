import React from 'react';
import ReactDOM from 'react-dom/client';

import {App} from './components/app';
import {ErrorPage} from './components/general/error-page';

//

const WebWorkerSupport = !navigator.userAgent.match(/(Firefox|MSIE)/);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    {
      WebWorkerSupport
        ? (
        <App />
          )
        : (
        <ErrorPage errors={['WebWorker modules']} />
          )
    }
  </React.StrictMode>
);
