import { React, useEffect } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';

import MockCreatorData from '../mock/CreatorsData.js'
import CreatorCardGrid from '../components/CreatorCardGrid.js'

const html = htm.bind(React.createElement)
const creatorData = MockCreatorData

const CreatorsPage = () => {
    return html`
      <div>
        <${CreatorCardGrid} creatorData=${creatorData} />
      </div>
    `;
  };

  export default CreatorsPage;
