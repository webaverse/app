import React, {useState, useEffect} from 'react';
import classNames from 'classnames';

import localStorageManager from '../../../../localStorage-manager.js';

import {KeyInput} from './key-input';

import styles from './settings.module.css';

//

const DefaultSettings = {
  moveForward: 'w',
  moveLeft: 'a',
  moveRight: 'd',
  moveBack: 's',
  jump: 'space',
  action: 'e',
  run: 'shift+w',
  narutoRun: 'shift+w+w',
  chat: 'enter',
  inventory: 'i',
};

export const TabControls = ({active}) => {
  const [appyingChanges, setAppyingChanges] = useState(false);
  const [changesNotSaved, setChangesNotSaved] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [moveForward, setMoveForward] = useState(null);
  const [moveLeft, setMoveLeft] = useState(null);
  const [moveRight, setMoveRight] = useState(null);
  const [moveBack, setMoveBack] = useState(null);
  const [jump, setJump] = useState(null);
  const [run, setRun] = useState(null);
  const [narutoRun, setNarutoRun] = useState(null);
  const [action, setAction] = useState(null);
  const [chat, setChat] = useState(null);
  const [inventory, setInventory] = useState(null);

  //

  function saveSettings() {
    const settings = {
      moveForward,
      moveLeft,
      moveRight,
      moveBack,
      jump,
      run,
      narutoRun,
      action,
      chat,
      inventory,
    };

    localStorageManager.setItem('ControlsSettings', JSON.stringify(settings));
  }

  function loadSettings() {
    const settingsString = localStorageManager.getItem('ControlsSettings');
    let settings;

    try {
      settings = JSON.parse(settingsString);
    } catch (err) {
      settings = DefaultSettings;
    }

    settings = settings ?? DefaultSettings;

    setMoveForward(settings.moveForward ?? DefaultSettings.moveForward);
    setMoveLeft(settings.moveLeft ?? DefaultSettings.moveLeft);
    setMoveRight(settings.moveRight ?? DefaultSettings.moveRight);
    setMoveBack(settings.moveBack ?? DefaultSettings.moveBack);
    setJump(settings.jump ?? DefaultSettings.jump);
    setRun(settings.run ?? DefaultSettings.run);
    setNarutoRun(settings.narutoRun ?? DefaultSettings.narutoRun);
    setAction(settings.action ?? DefaultSettings.action);
    setChat(settings.chat ?? DefaultSettings.chat);
    setInventory(settings.inventory ?? DefaultSettings.inventory);
  }

  function applySettings() {
    // todo

    //

    saveSettings();
    setChangesNotSaved(false);
    setTimeout(() => {
      setAppyingChanges(false);
    }, 1000);
  }

  function handleApplySettingsBtnClick() {
    setAppyingChanges(true);
    setTimeout(applySettings, 100);
  }

  //

  useEffect(() => {
    if (
      moveForward &&
      moveLeft &&
      moveRight &&
      moveBack &&
      jump &&
      run &&
      narutoRun &&
      action &&
      chat &&
      inventory
    ) {
      if (settingsLoaded) {
        setChangesNotSaved(true);
      } else {
        setSettingsLoaded(true);
        applySettings();
      }
    }
  }, [
    moveForward,
    moveLeft,
    moveRight,
    moveBack,
    jump,
    run,
    narutoRun,
    action,
    chat,
    inventory,
  ]);

  useEffect(() => {
    loadSettings();
  }, []);

  //

  return (
    <div
      className={classNames(
        styles.controlsTab,
        styles.tabContent,
        active ? styles.active : null,
      )}
    >
      <div className={styles.row}>
        <div className={styles.paramName}>Move forward</div>
        <KeyInput
          className={styles.keyInput}
          value={moveForward}
          setValue={setMoveForward}
        />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Move left</div>
        <KeyInput
          className={styles.keyInput}
          value={moveLeft}
          setValue={setMoveLeft}
        />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Move right</div>
        <KeyInput
          className={styles.keyInput}
          value={moveRight}
          setValue={setMoveRight}
        />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Move back</div>
        <KeyInput
          className={styles.keyInput}
          value={moveBack}
          setValue={setMoveBack}
        />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Jump</div>
        <KeyInput className={styles.keyInput} value={jump} setValue={setJump} />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Run</div>
        <KeyInput className={styles.keyInput} value={run} setValue={setRun} />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Naruto run</div>
        <KeyInput
          className={styles.keyInput}
          value={narutoRun}
          setValue={setNarutoRun}
        />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Action</div>
        <KeyInput
          className={styles.keyInput}
          value={action}
          setValue={setAction}
        />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Chat</div>
        <KeyInput className={styles.keyInput} value={chat} setValue={setChat} />
        <div className={styles.clearfix} />
      </div>
      <div className={styles.row}>
        <div className={styles.paramName}>Inventory</div>
        <KeyInput
          className={styles.keyInput}
          value={inventory}
          setValue={setInventory}
        />
        <div className={styles.clearfix} />
      </div>

      <div
        className={classNames(
          styles.applyBtn,
          changesNotSaved ? styles.active : null,
        )}
        onClick={handleApplySettingsBtnClick}
      >
        {appyingChanges ? 'APPLYING' : 'APPLY'}
      </div>
    </div>
  );
};
