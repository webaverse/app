import React, {useEffect, useState} from 'react';

import styles from './nft-details-form.module.css';

export default function NFTDetailsForm({initialName = '', initialDetails = '', previewImage, onChange = () => {}}) {
  const [name, setName] = useState(initialName);
  const [details, setDetails] = useState(initialDetails);

  useEffect(() => {
    onChange({name, details});
  }, [name, details, onChange]);
  useEffect(() => {
    setName('');
    setDetails('');
  }, [previewImage]);

  return <div className={styles.detailsForm}>
    {previewImage && <img crossOrigin="true" src={previewImage} />}
    <label htmlFor="name"><span>Name:</span></label>
    <input type="text" name="name" placeholder={initialName} value={name} onChange={e => setName(e.target.value)} />
    <br/>
    <label htmlFor="details"><span>Details:</span></label>
    <input type="text" name="details" placeholder={initialDetails} value={details} onChange={e => setDetails(e.target.value)} />
    <br/>
  </div>;
}
