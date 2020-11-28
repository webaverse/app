import { React } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'

const html = htm.bind(React.createElement)

const Profile = ({userAddress, userData}) => {
  
  const avatarPreview = userData.avatarPreview;
  const homeSpacePreview = userData.homeSpacePreview;
  const username = userData.username;
  const balance = userData.balance;
  const cardData = userData.tokens;
  
    return html`
      <div>
        <div class="profileHeader">
          <div class="homespaceBannerImage"><img src="${homeSpacePreview}" /></div>
          <div class="avatarImage"><img src="${avatarPreview}" /></div>
          <div class="username">${username}</div>
          <div class="userAddress">${userAddress}</div>
          <div class="userGrease">${balance}Ψ</div>
        </div>
        <div class="profileBody">
          <div class="profileBodyNav">
            <span class="profileLoadout"><a href="#">Loadout</a></span>
            <span class="profileForSale"><a href="#">For Sale</a></span>
            <span class="profileInventory"><a href="#">Inventory</a></span>
          </div>
          <div class="profileBodyAssets">
            <${AssetCardGrid} data=${cardData} />
          </div>
        </div>
      </div>
    `;
  };

  export default Profile;
