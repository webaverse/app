import React, {useState} from 'react';
import {Loadout} from './tabs/loadout';
import {Controls} from './tabs/controls';
export default () => {
  return (
    <footer>
      <Loadout />
      <Controls />
    </footer>
  );
};
