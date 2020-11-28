import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import CreatorCard from './CreatorCard'

const html = htm.bind(React.createElement)

const CreatorCardGrid = (
  creatorData
) => {
    return html`
      <div class="creatorGrid">
      ${creatorData.map(creator => html`
        <${CreatorCard}
            key="${creatorAddress}"
            creatorName="${creator.creatorName}"
            creatorXp="${creator.creatorXp}"
            creatorAddress="${creator.creatorAddress}"
            creatorAvatarImage="${creator.creatorAvatarImage}"
        />
        `)}
      </div>
    `;
  };

  export default CreatorCardGrid;
