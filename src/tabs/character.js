import React, {useState, useEffect} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import newStyles from '../styles/character.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import {preview} from '../../preview.js';
import {contentIdToFile} from '../../util';
export class Character extends React.Component {
  constructor() {
    super();
    this.state = {
      characterPreview: './public/images/loader.gif',
      avatarContentId: null,
    };
    console.log(this.props);
  }

  componentDidMount() {
    /** Intiialise State */
    // const [characterPreview, setCharacterPreview] = useState();
    // const [avatarContentId, setAvatarContentId] = useState('');
    /** To do URL fixing */
    const localPlayer = metaversefile.useLocalPlayer();
    localPlayer.addEventListener('avatarupdate', async e => {
      if (e.app) {
        if (this.state.avatarContentId !== e.app.contentId) {
          this.setState({
            avatarContentId: e.app.contentId,
          });

          let _tempUrl = this.state.avatarContentId;
          if (_tempUrl) {
            if (_tempUrl.startsWith('.')) {
              _tempUrl = _tempUrl.slice(1, _tempUrl.length);
            }
          }
          if (_tempUrl.startsWith('/')) {
            _tempUrl = window.origin + _tempUrl;
          }

          console.log(_tempUrl);
          if (_tempUrl) {
            const _preview = await preview(_tempUrl, e.app.type, 'png', 180, 170);
            this.setState({
              characterPreview: _preview.url
            })
            console.log(_preview);
          }
        }
      }
    });
  }

  render() {
    return (
      <Tab
        type="character"
        newStyles={newStyles}
        top
        left
        label={
          <div className={styles.label}>
            <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
            <span className={styles.text}>人 Character</span>
            <span className={styles.key}>Tab</span>
          </div>
        }
        panels={[
          (<div className={newStyles.panel} key="left">
            <div className={newStyles['panel-header']}>
              <h1>Sheila</h1>
            </div>
            {
              this.state.characterPreview ? <img src={this.state.characterPreview} /> : <></>
            }
            {/*
              <div className={styles['panel-header']}>
                <h1>Equipment</h1>
              </div>
            */}
            <hr className={newStyles.line}></hr>
            <h1 className={newStyles.equipmentHeading}>Equipment</h1>
            {this.props.wearActions.map((wearAction, i) => {
              return (
                <div
                  className={newStyles.equipment}
                  key={i}
                  onMouseEnter={e => {
                    const app = metaversefile.getAppByInstanceId(wearAction.instanceId);
                    this.props.game.setMouseHoverObject(null);
                    const physicsId = app.getPhysicsObjects()[0]?.physicsId;
                    this.props.game.setMouseDomEquipmentHoverObject(app, physicsId);
                  }}
                  onMouseLeave={e => {
                    this.props.game.setMouseDomEquipmentHoverObject(null);
                  }}
                >
                  <img src="images/webpencil.svg" className={classnames(styles.background, styles.violet)} />
                  <img src="images/flower.png" className={styles.icon} />
                  <div className={styles.name}>{wearAction.instanceId}</div>
                  <button className={styles.button} onClick={e => {
                    const localPlayer = metaversefile.useLocalPlayer();
                    const app = metaversefile.getAppByInstanceId(wearAction.instanceId);
                    localPlayer.unwear(app);
                  }}>
                    <img src="images/remove.svg" />
                  </button>
                  <div className={styles.background2} />
                </div>
              );
            })}
          </div>),
        ]}
        open={this.props.open}
        toggleOpen={this.props.toggleOpen}
        panelsRef={this.props.panelsRef}
      />
    );
  }
}
