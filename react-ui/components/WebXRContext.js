import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const WebXRContext = () => {
  return html`
    <p>WebXR frame can go here</p>
  `;
  
  };

  export default WebXRContext;
