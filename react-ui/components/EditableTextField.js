import { React, useState } from 'https://unpkg.com/es-react@16.13.1/dev';
import htm from '../web_modules/htm.js';

export const html = htm.bind(React.createElement)

export const EditableTextField = ({ className, callback }) => {
  const [textFieldInput, setTextFieldInput] = useState(state.name);

  const handleSetText = (e) => {
    e.preventDefault();
    callback(textFieldInput);
    setEditTextField(false);
  };
  
  return html`
    <div className="${className} editableTextField editableTextFieldInner">
      <input type="text" value=${textFieldInput} maxLength=16 onChange=${(e) => { console.log(e.target.value); setTextFieldInput(e.target.value)}}/>
      <div>
        <button className="button settingsBoxButton userInfoButton" onClick=${handleSetText}>Set Name</button>
      </div>
    </div>
  `;
};
