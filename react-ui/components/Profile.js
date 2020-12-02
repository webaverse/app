import { React } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'
import csz from '../web_modules/csz.js'

const styles = csz`/components/Profile.css`

const html = htm.bind(React.createElement)

const Profile = ({userAddress, userData}) => {
  console.log("userData is ", userData);
  
  const avatarPreview = userData.avatarPreview;
  const homeSpacePreview = userData.homeSpacePreview;
  const username = userData.username;
  const balance = userData.balance;
  const cardData = userData.tokens;
  
    return html`
      <div className=${styles}>
        <div className="profileHeader">
          <div className="homespaceBannerImage"><img src="${homeSpacePreview}" /></div>
          <div className="avatarImage"><img src="${avatarPreview}" /></div>
          <div className="username">${username}</div>
          <div className="userAddress">${userAddress}</div>
          <div className="userGrease">${balance}Ψ</div>
        </div>
        <div className="profileBody">
          <div className="profileBodyNav">
            <span className="profileLoadout"><a href="#">Loadout</a></span>
            <span className="profileForSale"><a href="#">For Sale</a></span>
            <span className="profileInventory"><a href="#">Inventory</a></span>
          </div>
          <div className="profileBodyAssets">
            <${AssetCardGrid} data=${cardData} cardSize='medium' />
          </div>
        </div>
      </div>
    `;
  };

  export default Profile;
