import { React, useEffect } from '/web_modules/es-react.js';
import htm from '/web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid';
import MockUserCardData from '../mock/UserCardData'
import MockUserProfileData from '../mock/UserProfileData'

const html = htm.bind(React.createElement)

const Profile = () => {
  
  // TODO: Remove mocks and use real data
  const avatarImage = MockUserProfileData.avatarImage;
  const homespaceImage = MockUserProfileData.homespaceImage;
  const userName = MockUserProfileData.userName;
  const userAddress = MockUserProfileData.userAddress;
  const userGrease = MockUserProfileData.userGrease;

  const cardData = MockUserCardData;

  return html`yes`
  
    return html`
      <div>
        <div class="profileHeader">
          <div class="homespaceBannerImage"><img src=${homespaceImage}</div>
          <div class="avatarImage"><img src=${avatarImage}</div>
          <div class="userName">${userName}</div>
          <div class="userAddress">${userAddress}</div>
          <div class="userGrease">${userGrease}Ψ</div>
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
