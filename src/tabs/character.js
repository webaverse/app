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
    this.previousPreviewActionsLength = 0;
    this.state = {
      characterPreview: './public/images/loader.gif',
      avatarContentId: null,
      previews: {},
    };
    console.log(this.props);
  }

  async setPreview(stateKey, stateSource, isContentId, id, options = {}) {
    const manageContentId = async (stateKey, stateSource) => {
      let _tempUrl = this.state[stateKey];
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
        const _preview = await preview(_tempUrl, options.type, 'png', 180, 170);
        const _s = {};
        _s[stateSource] = _preview.url;
        this.setState(_s);
        console.log(_preview);
      }
    };

    if (this.state[stateKey] !== id) {
      if (isContentId) {
        const _s = {};
        _s[stateKey] = id;
        this.setState(_s);
        manageContentId(stateKey, stateSource);
      } else { // its an instanceId
        const _app = this.props.apps.find(a => {
          return a.instanceId === id;
        });
        if (_app) {
          fetch(`${_app.contentId}.metaversefile`).then(async res => {
            const _res = await res.json();
            const _preview = await preview(`${_app.contentId}${_res.start_url}`, _app.appType, 'png', 180, 170);
            const newPreviewState = this.state.previews;
            newPreviewState[id] = _preview.url;
            this.setState({
              previews: newPreviewState,
            });
          }).catch(e => {
            console.warn('App Preview failed', e);
          });
        }
      }
    }
  }

  componentDidUpdate() {
    if (this.previousPreviewActionsLength !== this.props.wearActions.length) {
      this.previousPreviewActionsLength = this.props.wearActions.length;
      this.props.wearActions.map(async wearAction => {
        if (!this.state.previews[wearAction.instanceId]) {
          this.setPreview('preview', `${wearAction.instanceId}`, false, wearAction.instanceId);
        }
      });
    }
  }

  componentDidMount() {
    /** To do URL fixing */
    const localPlayer = metaversefile.useLocalPlayer();
    localPlayer.addEventListener('avatarupdate', e => {
      if (e.app) {
        this.setPreview('avatarContentId', 'characterPreview', true, e.app.contentId, {type: e.app.type});
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
            <hr className={newStyles.line}></hr>

            <div className={newStyles.equiment}>
              <h1 className={newStyles.equipmentHeading}>Equipment</h1>
              <div className={newStyles.equipmentItems}>
                {this.props.wearActions.map((wearAction, i) => {
                  return (
                    <div className={newStyles.item}

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
                      <div className={newStyles.itemWrapper}>
                        <img src={this.state.previews[wearAction.instanceId] || '/images/loader.gif'} />
                      </div>
                      <div className={styles.name}>{wearAction.instanceId}</div>
                    </div>
                  );
                })}
              </div>

            </div>
            {this.props.wearActions.map((wearAction, i) => {
              return (
                <div
                  style={{display: 'none'}}
                  className={styles.equipment}
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
