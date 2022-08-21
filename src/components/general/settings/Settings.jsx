
import React, {useContext, useEffect, useState} from 'react';
import classNames from 'classnames';

import {TabGeneral} from './TabGeneral';
import {TabControls} from './TabControls';
import {TabAudio} from './TabAudio';
import {TabGraphics} from './TabGraphics';
import {TabAi} from './TabAi';
import {AppContext} from '../../app';
import {registerIoEventHandler, unregisterIoEventHandler} from '../io-handler';

import styles from './settings.module.css';

//

export const Settings = () => {
  const {state, setState} = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('general');

  //

  const stopPropagation = event => {
    event.stopPropagation();
  };

  const handleCloseBtnClick = () => {
    setState({openedPanel: null});
  };

  const handleTabClick = event => {
    const tabName = event.currentTarget.getAttribute('data-tab-name');
    setActiveTab(tabName);
  };

  //

  useEffect(() => {
    const handleKeyUp = event => {
      if (state.openedPanel === 'SettingsPanel' && event.which === 27) { // esc key
        setState({openedPanel: null});
      }
    };

    registerIoEventHandler('keyup', handleKeyUp);

    return () => {
      unregisterIoEventHandler('keyup', handleKeyUp);
    };
  }, [state.openedPanel]);

  //

  return (

    <div className={ classNames(styles.settings, state.openedPanel === 'SettingsPanel' ? styles.open : null) } onClick={ stopPropagation } >

      <div className={ styles.closeBtn } onClick={ handleCloseBtnClick } >X</div>

      <div className={ styles.wrapper } >
        <div className={ styles.title } >SETTINGS</div>

        <div className={ styles.tabs } >
          <div className={ classNames(styles.tab, activeTab === 'general' ? styles.active : null) } onClick={ handleTabClick } data-tab-name='general' >GENERAL</div>
          <div className={ classNames(styles.tab, activeTab === 'controls' ? styles.active : null) } onClick={ handleTabClick } data-tab-name='controls' >CONTROLS</div>
          <div className={ classNames(styles.tab, activeTab === 'audio' ? styles.active : null) } onClick={ handleTabClick } data-tab-name='audio' >AUDIO</div>
          <div className={ classNames(styles.tab, activeTab === 'graphics' ? styles.active : null) } onClick={ handleTabClick } data-tab-name='graphics' >GRAPHICS</div>
          <div className={ classNames(styles.tab, activeTab === 'ai' ? styles.active : null) } onClick={ handleTabClick } data-tab-name='ai' >AI</div>
          <div className={ styles.clearfix } />
        </div>

        <div className={ styles.tabContentWrapper }>
          <TabGeneral active={ activeTab === 'general' } />
          <TabControls active={ activeTab === 'controls' } />
          <TabAudio active={ activeTab === 'audio' } />
          <TabGraphics active={ activeTab === 'graphics' } />
          <TabAi active={ activeTab === 'ai' } />
        </div>

      </div>

    </div>

  );
};
