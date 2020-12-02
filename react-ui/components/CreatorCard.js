import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
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
        <div className="${styles} creator">
          <div className="avatarPreview"><img src="${avatarPreview}" /></div>
          <div className="creatorInfo">
            <div className="creatorName">${name}</div>
            <div className="creatorFtu">${ftu}</div>
            <div className="creatorAddress">${address}</div>
          </div>
        </div>
    `;
  };

  export default Creator;
