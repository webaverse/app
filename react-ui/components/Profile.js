import { React, useEffect, useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'
import csz from '../web_modules/csz.js'
import { Context } from '../constants/Context.js';
import ActionTypes from '../constants/ActionTypes.js';
import { EditableTextField } from './EditableTextField.js';
import { Link } from '/web_modules/@reach/router.js';

const styles = csz`/components/Profile.css`
const defaultAvatarImage = "/images/defaultaccount.png";
const defaultHomespacePreview = "/images/defaulthomespace.png";

const html = htm.bind(React.createElement)

const ProfileNavLink = props => html`
  <${Link} to=${props.to} children=${props.children}
    getProps=${({ isCurrent }) => {
      return isCurrent ? { className: "profile-nav-link active" } : {className: 'profile-nav-link'}
    }}
  />
`;

const Profile = (props) => {
  console.log("Profile Props are", props);
  const creatorAddress = props.creatorAddress;
  const view = props.view ?? 'inventory';

  const { state, dispatch } = useContext(Context);
  const [currentPage, setCurrentPage] = useState(1);
  let homespacePreview = defaultHomespacePreview;
  let avatarPreview = defaultAvatarImage;

  const [ creatorInited, setCreatorInited ] = useState(false);
  const [ lastView, setLastView ] = useState(view);
  const [ storeAssets, setStoreAssets ] = useState([]);

  useEffect(() => {
    if(view !== lastView) {
      setCreatorInited(false);
      setLastView(view);
    }
    if(creatorInited) return;
    if(state.creatorProfiles[creatorAddress] !== undefined && state.creatorInventories[creatorAddress] !== undefined){
      setCreatorInited(true);
    } else return;
    console.log("User address is: ", state.address);
    console.log("Page address is: ", props.creatorAddress);
    console.log("View is", view);

    // // const homespacePreviewCandidate = isMyProfile ? state.homeSpacePreview : state.creatorProfiles[userAddress].homeSpacePreview;
    if(state.creatorProfiles[creatorAddress] !== undefined && state.creatorInventories[creatorAddress] !== undefined){
      const avatarPreviewCandidate = creatorAddress === state.address ? state.avatarPreview : state.creatorProfiles[creatorAddress].avatarPreview;
      avatarPreview = avatarPreviewCandidate !== "" &&
      avatarPreviewCandidate !== null ?
      avatarPreviewCandidate : defaultAvatarImage;
      setStoreAssets(state.creatorInventories[creatorAddress][currentPage].filter((asset) => asset.buyPrice !== null && asset.buyPrice > 0));
      console.log("Store assets are", storeAssets);
    }

    // homespacePreview = homespacePreviewCandidate !== "" &&
    // homespacePreviewCandidate !== null ?
    // homespacePreviewCandidate : defaultHomespacePreview;
  
  }, [state, currentPage]);

  useEffect(() => {

    console.log("Rendering my profile");
    console.log("State is", state);
    dispatch({ type: ActionTypes.GetProfileForCreator, payload: { address: creatorAddress } });
  }, [])

  const updateName = (textFieldInput) =>
    dispatch({ type: ActionTypes.SetName, payload: { name: textFieldInput } });


  //   ${userAddress === state.address ? html`
  //   <${EditableTextField} value=${state.name} valueIfNull=${'<Username>'} className=${`${styles} username settingsNameField`} callback=${updateName} />
  // ` : html`
  //   <div className="username">${state.creatorProfiles[userAddress].username}</div>
  // `}

  //             <span className="profileLoadout"><a href="#">Loadout</a></span>

  return html`
    <${React.Suspense} fallback=${html`<div>Loading...</div>`}>
    ${creatorAddress && state.creatorProfiles[creatorAddress] && html`
    <div className=${styles}>
        <div className="profileHeader">
          <div className="homespaceBannerImage"><img src="${homespacePreview}" /></div>
          <div className="avatarImage"><img src="${avatarPreview}" /></div>
          ${creatorAddress === state.address ? html`
          <div className="username">${state.name}</div>
          ` : html`
            <div className="username">${state.creatorProfiles[creatorAddress].name}</div>
          `}
          <div className="userAddress">${state.creatorProfiles[creatorAddress].address}</div>
          <div className="userGrease">${state.creatorProfiles[creatorAddress].balance}Ψ</div>
        </div>
        <div className="profileBody">
          <div className="profileBodyNav">
         <${ProfileNavLink} to='/creator/${creatorAddress}/booth'>For Sale</${ProfileNavLink}>
            <${ProfileNavLink} to='/creator/${creatorAddress}/inventory'>Inventory</${ProfileNavLink}>
          </div>
          <div className="profileBodyAssets">
          ${view === 'booth' || view === 'store' || view === 'onSale' ? html`
            <${AssetCardGrid} data=${storeAssets} cardSize='medium' />
          ` : html`
            <${AssetCardGrid} data=${state.creatorInventories[creatorAddress][currentPage]} cardSize='medium' />
          `}
          </div>
        </div>
    </div>
        `}
        <//>
    `;
};

export default Profile;
