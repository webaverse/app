import { React, useEffect, useContext, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../web_modules/htm.js';
import AssetCardGrid from './AssetCardGrid.js'
import { Context } from '../constants/Context.js';
import ActionTypes from '../constants/ActionTypes.js';
import { EditableTextField } from './EditableTextField.js';
import { Link } from '../web_modules/@reach/router.js';
import { setName } from '../functions/UserFunctions.js';
import css from '../web_modules/csz.js'

const styles = css`${window.locationSubdirectory}/components/Profile.css`
const defaultAvatarImage = window.locationSubdirectory + "/images/defaultaccount.png";
const defaultHomespacePreview = window.locationSubdirectory+"/images/defaulthomespace.png";

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
      homespacePreviewCandidate !== null && homespacePreviewCandidate !== undefined ?
      homespacePreviewCandidate : defaultHomespacePreview);

      // Get store for creator

      console.log("Booths are ", state.creatorBooths);

      const newStoreAssets = state.creatorBooths[creatorAddress][currentPage];
      console.log(newStoreAssets);
      console.log(state);
      setStoreAssets(newStoreAssets);
      if((view === undefined || view === null || view === "") && newStoreAssets.length > 0) setView('booth');

    }, 100)
  }, [])

  useEffect(() => {
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
    <div className="profileHeaderWrapper ${styles}">
        <div className="profileHeader">
          <div className="homespaceBannerImage"><img src="${homespacePreview}" /></div>
          <div className="avatarImage"><img src="${avatarPreview}" /></div>
          ${creatorAddress === state.address ? html`
          <div className="username">${state.name || 'guest'}</div>
          ` : html`
            <div className="username"><span>${state.creatorProfiles[creatorAddress].name}</span></div>
          `}
          <div className="userAddress">
            <span className="userAddressValue">${state.creatorProfiles[creatorAddress].address}</span>
          </div>
          <div className="userGrease">
            <span className="userGreaseSing">$grease</span>
            <span className="userGreaseValue">${state.creatorProfiles[creatorAddress].balance}Ψ</span>
          </div>
        </div>
        <div className="profileBodyContainer">
          <div className="profileBodyClear"></div>
          <div className="profileBody">
            <div className="profileBodyNav">
              <div className="profileBodyNavContainer">
                ${storeAssets.length > 0 && html`
                  <${Link} className='profileNavLink ${view === 'booth' || view === 'store' || view === 'onsale' ? 'active' : ''}' to='${window.locationSubdirectory}/creator/${creatorAddress}/booth'>For Sale</${Link}>
                `}
                  <${Link} className='profileNavLink ${view === undefined || view === 'inventory' ? 'active' : ''}' to='${window.locationSubdirectory}/creator/${creatorAddress}/inventory'>Inventory</${Link}>
              </div>
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
          <div className="profileBodyClear"></div>
        </div>
    </div>
        `}
        <//>
    `;
};

export default Profile;
