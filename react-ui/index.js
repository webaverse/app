import { React, ReactDOM, useEffect, useContext, useReducer } from 'https://unpkg.com/es-react/dev';
import NavBar from './components/NavBar.js';
import CreatorsPage from './pages/CreatorsPage.js';
import Gallery from './pages/GalleryPage.js';
import MintPage from './pages/MintPage.js';
import MyProfile from './pages/MyProfilePage.js';
import NotFoundPage from './pages/NotFoundPage.js';
import htm from './web_modules/htm.js';
import Router, { Route } from './web_modules/react-es-router.js';
import { Context, initialState } from './constants/Context.js';
import { Reducer } from './reducers/Reducer.js';
import ActionTypes from './constants/ActionTypes.js';

window.html = htm.bind(React.createElement);

const myProfile = html`<${MyProfile} />`;
const gallery = html`<${Gallery} />`;
const mint = html`<${MintPage} />`;
const creators = html`<${CreatorsPage} />`;
const notFound = html`<${NotFoundPage} />`;

const Application = () => {
  const [state, dispatch] = useReducer(Reducer, initialState);


useEffect(() => {
  dispatch({type: ActionTypes.InitializeUserObject});
}, []);
  return html`
  <${Context.Provider} value=${[state, dispatch]}>
    <${Router}>
        <${NavBar} />
            <${Route} path="/" component=${myProfile} />
            <${Route} path="/profile" component=${myProfile} />
            <${Route} path="/gallery" component=${gallery} />
            <${Route} path="/mint" component=${mint} />
            <${Route} path="/creators" component=${creators} />
            <${Route} path="/notFound" component=${notFound} />
            <${Route} path="*" component=${notFound} />
            </${Router}>
    </ ${Context.Provider}>
`
}

ReactDOM.render(html`<${Application} />`,
  document.getElementById('root')
)

