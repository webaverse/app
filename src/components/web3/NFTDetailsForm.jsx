import React, {useEffect, useState} from 'react';

import styles from './nft-details-form.module.css';

export default function NFTDetailsForm({initialName = '', initialDetails = '', onChange = () => {}}) {
  const [name, setName] = useState(initialName);
  const [details, setDetails] = useState(initialDetails);

  useEffect(() => {
    onChange({name, details});
  }, [name, details, onChange]);

  return <div className={styles.detailsForm}>
    <label for="name"><span>Name:</span></label>
    <input type="text" name="name" placeholder={initialName} value={name} onChange={e => setName(e.target.value)} />
    <br/>
    <label for="details"><span>Details:</span></label>
    <textarea type="text" name="details" placeholder={initialDetails} value={details} onChange={e => setDetails(e.target.value)} />
    <br/>
  </div>;
}
