import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import csz from '../web_modules/csz.js'

const styles = csz`/components/CreatorCard.css`

const html = htm.bind(React.createElement)

const Creator = ({
  name,
  avatarUrl,
  avatarFileName,
  avatarPreview,
  ftu = 0,
  address
}) => {
    return html`
      <div class=${styles}>
        <div className="creator">
          <div className="avatarPreview"><img src=${avatarPreview} /></div>
          <div className="creatorName">${name}</div>
          <div className="creatorFtu">${ftu}</div>
          <div className="creatorAddress">${address}</div>
        </div>
      </div>
    `;
  };

  export default Creator;
