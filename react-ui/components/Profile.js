import { React, useEffect, useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'
import csz from '../web_modules/csz.js'
import { Context } from '../constants/Context.js';
import ActionTypes from '../constants/ActionTypes.js';

const styles = csz`/components/Profile.css`

const html = htm.bind(React.createElement)

const Profile = ({userAddress}) => {
  const {state, dispatch} = useContext(Context);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    console.log("Rendering my profile");
    dispatch({ type: ActionTypes.GetProfileForCreator, payload: { address: userAddress } });
    console.log(state.creatorProfiles);
  }, [])

    return html`
    <${React.Suspense} fallback=${html`<div>Loading...</div>`}>
    ${userAddress && state.creatorProfiles[userAddress] && html`
    <div className=${styles}>
        <div className="profileHeader">
          <div className="homespaceBannerImage"><img src="${state.creatorProfiles[userAddress].homeSpacePreview}" /></div>
          <div className="avatarImage"><img src="${state.creatorProfiles[userAddress].avatarPreview}" /></div>
          <div className="username">${state.creatorProfiles[userAddress].username}</div>
          <div className="userAddress">${userAddress}</div>
          <div className="userGrease">${state.creatorProfiles[userAddress].balance}Ψ</div>
        </div>
        <div className="profileBody">
          <div className="profileBodyNav">
            <span className="profileLoadout"><a href="#">Loadout</a></span>
            <span className="profileForSale"><a href="#">For Sale</a></span>
            <span className="profileInventory"><a href="#">Inventory</a></span>
          </div>
          <div className="profileBodyAssets">
            <${AssetCardGrid} data=${state.creatorInventories[userAddress][currentPage]} cardSize='medium' />
          </div>
        </div>
        </div>
        `}
        <//>
    `;
  };

  export default Profile;
