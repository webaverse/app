import React, {useState, useEffect} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import newStyles from '../styles/character.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import {preview} from '../../preview.js';
import {contentIdToFile} from '../../util';
export class UserX extends React.Component {
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
          preview(`${_app.contentId}`, _app.appType, 'png', 180, 170).then(_preview => {
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

  }

  componentDidMount() {
    /** To do URL fixing */
    // const localPlayer = metaversefile.useLocalPlayer();
    // localPlayer.addEventListener('avatarupdate', e => {
    //   if (e.app) {
    //     this.setPreview('avatarContentId', 'characterPreview', true, e.app.contentId, {type: e.app.type});
    //   }
    // });
  }

  render() {
    console.log('************** RENDER ************* loop called', this.props.user);
    return (
      this.props.user
        ? <Tab
          type="userX"
          newStyles={newStyles}
          top
          left
          label={
            <div className={styles.label}>
              <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
              <span className={styles.text}>人 User Panel</span>
              <span className={styles.key}>X</span>
            </div>
          }
          panels={[
            (<div className={newStyles.panel} key="left">
              <div className={newStyles['panel-header']}>
                <h1>{this.props.user.name}</h1>
              </div>
              {
                this.state.characterPreview ? <img src={this.state.characterPreview} /> : <></>
              }
              <hr className={newStyles.line}></hr>

              <div className={newStyles.equiment}>
                <h1 className={newStyles.equipmentHeading}>Tokens</h1>
                <div className={newStyles.equipmentItems}>

                  {this.props.user.loadout.tokens && this.props.user.loadout.tokens.map((token, i) => {
                    return (
                      <div className={newStyles.item}
                        key={i}
                      >
                        <div className={classnames(newStyles.label)} onClick={e => {
                        // drop code comes here
                        }}>DROP</div>
                        <div className={newStyles.itemWrapper}>
                          <img src={this.state.previews[token.instanceId] || '/images/loader.gif'} />
                        </div>
                        <div className={styles.name}>{token.instanceId}</div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>),
          ]}
          open={this.props.open}
          toggleOpen={this.props.toggleOpen}
          panelsRef={this.props.panelsRef}
        /> : null
    );
  }
}
