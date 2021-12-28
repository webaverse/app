import React, {useState, useEffect} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import newStyles from '../styles/character.module.css';
import {Tab} from '../components/tab';
import metaversefile from '../../metaversefile-api.js';
import {preview} from '../../preview.js';
import {contentIdToFile} from '../../util';
import {Tooltip} from '../components/tooltip.js';
export class UserX extends React.Component {
  constructor() {
    super();
    this.previousPreviewActionsLength = 0;
    this.state = {
      characterPreview: './public/images/loader.gif',
      avatarContentId: null,
      previews: {},
      tokensLength: 0,
    };
    console.log(this.props);
  }

  componentDidUpdate() {
    if(this.props.user){
      if(this.state.tokensLength !== this.props.user.tokens.length){
          this.setState({tokensLength:this.props.user.tokens.length});
          let _s = this.state.previews;    
          for (const token of this.props.user.tokens) {
            if(!_s[token.hash]){
              _s[token.hash] = '/images/loader.gif';
              preview(token.hash, token.ext, 'png', 180, 170).then((res)=>{
                this.state.previews[token.hash] = res.url;
              });
            }
          }
          this.setState({previews:_s})
      }
    }

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
    console.log(this.props.user);

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
                <h1>{this.props.user.name || 
                <Tooltip 
                  text={this.user.address.substring(0,10)}
                  tooltip={this.user.address}
                  position='top'
                />}</h1>
              </div>
              {/* {
                this.state.characterPreview ? <img src={this.state.characterPreview} /> : <></>
              }
              <hr className={newStyles.line}></hr> */}

              <div className={newStyles.equiment}>
                <h1 className={newStyles.equipmentHeading}>Tokens</h1>
                <div className={newStyles.equipmentItems}>

                  {this.props.user.tokens && this.props.user.tokens.map((token, i) => {
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
