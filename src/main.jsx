import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Error from './Error';

const WebWorkerSupport = !navigator.userAgent.match(/(Firefox|MSIE)/);

ReactDOM.render(
  <React.StrictMode>
    {WebWorkerSupport ? (
      <App />
    ) : (
      <Error />
    )}
  </React.StrictMode>,
  document.getElementById('root'),
);