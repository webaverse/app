import React, {useState, useEffect, useRef} from 'react';
import classnames from 'classnames';
import styles from './Footer.module.css';
import { Loadout } from './tabs/loadout';
import { Controls } from './tabs/controls';

export default () => {
  return (
    <footer>
      <Loadout />
      <Controls />
    </footer>
  );
};