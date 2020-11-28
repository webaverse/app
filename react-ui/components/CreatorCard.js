import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const Creator = (
  name,
  avatarUrl,
  avatarFileName,
  avatarPreview,
  ftu = 0,
  address
) => {
    return html`
      <div class="creator">
        <div class="avatarPreview"><img src=${avatarPreview}></div>
        <div class="creatorName">${name}</div>
        <div class="creatorFtu">${ftu}</div>
        <div class="creatorAddress">${address}</div>
      </div>
    `;
  };

  export default Creator;
