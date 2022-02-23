import React, {useState} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';

export const Minting = () => {
  const [file, setFile] = useState(false);

  const handleSubmit = async event => {
    event.preventDefault();
    event.stopPropagation();
    if (file) {
      const formData = new FormData();
      formData.append(`/${file.name}`, file);
      const { cid } = await fetch('https://ipfs.webaverse.com/upload-folder', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
      
    } else {
      window.alert('No file uploaded.');
    }
  };
  const formStyle = {
    backgroundColor: 'black',
    position: 'relative',
    top: '200px',
    minHeight: '300px',
  };

  const btnStyle = {
    display: 'block',
  };

  return (
    <form style={formStyle} onSubmit={handleSubmit}>
      <input type="file" onChange={ev => setFile(ev.target.files[0])}></input>
      <button style={btnStyle}>Mint</button>
    </form>
  );
};
