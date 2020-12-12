import { React, useEffect, useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '/web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'
import csz from '../web_modules/csz.js'
import { Context } from '../constants/Context.js';
import ActionTypes from '../constants/ActionTypes.js';
import { EditableTextField } from './EditableTextField.js';
import { Link } from '/web_modules/@reach/router.js';
import { setName } from '../functions/UserFunctions.js';

const styles = csz`/components/Profile.css`
const defaultAvatarImage = "/images/defaultaccount.png";
const defaultHomespacePreview = "/images/defaulthomespace.png";

const html = htm.bind(React.createElement)

const Profile = (props) => {
  console.log("Profile Props are", props);
  const creatorAddress = props.creatorAddress;

  const { state, dispatch } = useContext(Context);
  const [currentPage, setCurrentPage] = useState(1);
  const [homespacePreview, setHomespacePreview] = useState(defaultHomespacePreview);
  const [avatarPreview, setAvatarPreview] = useState(defaultAvatarImage);

  const [ view, setView ] = useState(props.view );
  const [ storeAssets, setStoreAssets ] = useState([]);

  useEffect(() => {
    dispatch({ type: ActionTypes.GetProfileForCreator, payload: { address: creatorAddress } });
    const waitForResponse = setInterval(() => {
      if(state.creatorProfiles[creatorAddress] === undefined || state.creatorInventories[creatorAddress] === undefined) return;
      
      clearInterval(waitForResponse);

      const avatarPreviewCandidate = creatorAddress.toLowerCase() === state.address.toLowerCase() ? state.avatarPreview : state.creatorProfiles[creatorAddress].avatarPreview;
      setAvatarPreview(avatarPreviewCandidate !== "" &&
      avatarPreviewCandidate !== null ?
      avatarPreviewCandidate : defaultAvatarImage);

      const homespacePreviewCandidate = creatorAddress.toLowerCase() === state.address.toLowerCase() ? state.homespacePreview : state.creatorProfiles[creatorAddress].homespacePreview;
      setHomespacePreview(homespacePreviewCandidate !== "" &&
      homespacePreviewCandidate !== null ?
      homespacePreviewCandidate : defaultHomespacePreview);

      const newStoreAssets = state.creatorInventories[creatorAddress][currentPage].filter((asset) => asset.buyPrice !== null && asset.buyPrice > 0);
      setStoreAssets(newStoreAssets);
      let newView = ""
      if(view === null || view === "") newView = 'booth';
      else if(newStoreAssets.length === 0) newView = 'inventory';
      else newView = 'booth';
      console.log("Store assets are", newStoreAssets);
      setView(newView);
    }, 100)
  }, [])

  useEffect(() => {
    console.log("View");
    setView(props.view);
  }, [props.view]);

  const updateName = (textFieldInput) =>
  setName(textFieldInput, state, () => {
    console.log("Success");
  }, (error) => { console.log("Error", error)})

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
          <div className="username">${state.name || 'guest'}</div>
          ` : html`
            <div className="username">${state.creatorProfiles[creatorAddress].name}</div>
          `}
          <div className="userAddress">${state.creatorProfiles[creatorAddress].address}</div>
          <div className="userGrease">
            <div className="userGreaseArrow"></div>
            ${state.creatorProfiles[creatorAddress].balance}Ψ
          </div>
        </div>
        <div className="profileBody">
          <div className="profileBodyNav">
          ${storeAssets.length > 0 && html`
            <${Link} className='profileNavLink ${view === 'booth' || view === 'store' || view === 'onsale' ? 'active' : ''}' to='/creator/${creatorAddress}/booth'>For Sale</${Link}>
          `}
            <${Link} className='profileNavLink ${view === 'inventory' ? 'active' : ''}' to='/creator/${creatorAddress}/inventory'>Inventory</${Link}>
          </div>
          <div className="profileBodyAssets">
          ${view === 'booth' || view === 'store' || view === 'onsale' ? html`
            <${AssetCardGrid} data=${storeAssets} cardSize='medium' />
          ` : state.creatorInventories[creatorAddress] !== undefined ? html`
            <${AssetCardGrid} data=${state.creatorInventories[creatorAddress][currentPage]} cardSize='medium' />
          ` : state.creatorInventories[creatorAddress] === undefined || state.creatorInventories[creatorAddress][currentPage].length === 0 && html `
            <p>Your inventory is empty</p>
          `}
          </div>
        </div>
    </div>
        `}
        <//>
    `;
};

export default Profile;



{/* <div className=${styles}>
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
      ${storeAssets.length > 0 && html`
        <${Link} className='profileNavLink ${view === 'booth' || view === 'store' || view === 'onsale' ? 'active' : ''}' to='/creator/${creatorAddress}/booth'>For Sale</${Link}>
      `}
        <${Link} className='profileNavLink ${view === 'inventory' ? 'active' : ''}' to='/creator/${creatorAddress}/inventory'>Inventory</${Link}>
      </div>
      <div className="profileBodyAssets">
      ${view === 'booth' || view === 'store' || view === 'onsale' ? html`
        <${AssetCardGrid} data=${storeAssets} cardSize='medium' />
      ` : html`
        <${AssetCardGrid} data=${state.creatorInventories[creatorAddress][currentPage]} cardSize='medium' />
      `}
      ${state.creatorInventories[creatorAddress][currentPage].length === 0 && html `
        <p>Your inventory is empty</p>
      `}
      </div>
    </div> */}
