import { React, useState } from 'https://unpkg.com/es-react/dev';
import htm from '/web_modules/htm.js';

export const html = htm.bind(React.createElement)

export const EditableTextField = ({ value, valueIfNull, className, callback }) => {
  const [editingTextField, setEditTextField] = useState(false);
  const [textFieldInput, setTextFieldInput] = useState(state.name);

  const editTextField = (e) => {
    e.preventDefault();
    setEditTextField(true);
    setTextFieldInput(state.name);
  };

  const handleSetText = (e) => {
    e.preventDefault();
    callback(textFieldInput);
    setEditTextField(false);
  };

  const cancelTextEdit = (e) => {
    e.preventDefault();
    setEditTextField(false);
  };
  
  return html`
  <${!editingTextField ? html`
    <span className="${className} editableTextField">
      ${value !== "" && value !== undefined ? value : valueIfNull} 
      <button className="button editableTextButton editTextFieldButton" onClick=${editTextField}>Set Name</button>
    </span>
  ` : html`
    <span className="${className} editableTextField">
      <input type="text" value=${textFieldInput} onChange=${(e) => { console.log(e.target.value); setTextFieldInput(e.target.value)}}/>
      <button className="button settingsBoxButton userInfoButton" onClick=${handleSetText}>Set Name</button>
      <button className="button settingsBoxButton userInfoButton" onClick=${cancelTextEdit}>Cancel</button>
    </span>
`}
  `;
};
