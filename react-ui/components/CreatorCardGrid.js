import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import CreatorCard from './CreatorCard.js'
import csz from '../web_modules/csz.js'

const styles = csz`./CreatorCardGrid.css`

const html = htm.bind(React.createElement)

const CreatorCardGrid = ({
  creatorData
}) => {
    return html`
    <div class=${styles}>
        <div class="creatorGrid">
        ${creatorData.map(creator => html`
          <${CreatorCard}
              key="${creator.address}"
              name="${creator.name}"
              ftu="${creator.ftu}"
              avatarPreview="${creator.avatarPreview}"
              avatarFileName="${creator.avatarFileName}"
              avatarUrl="${creator.avatarUrl}"
          />
          `)}
        </div>
      </div>
    `;
  };

  export default CreatorCardGrid;
