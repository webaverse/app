import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';

const html = htm.bind(React.createElement)

const Creator = (
  creatorName,
  creatorAvatarImage,
  creatorXp = 0,
  creatorAddress
) => {
    return html`
      <div class="creator">
        <div class="creatorAvatarImage"><img src=${creatorAvatarImage}></div>
        <div class="creatorName">${creatorName}</div>
        <div class="creatorXp">${creatorXp}</div>
        <div class="creatorAddress">${creatorAddress}</div>
      </div>
    `;
  };

  export default Creator;
