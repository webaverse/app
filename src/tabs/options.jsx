import React, {useEffect} from 'react';
import {useState} from 'react';
import classnames from 'classnames';
import styles from '../Header.module.css';
import {Tab} from '../components/tab';
import game from '../../game.js';
import {defaultVoicePack, voiceEndpoint} from '../../constants.js';

export const Options = ({app, open, toggleOpen, panelsRef}) => {
  const [avatarStyle, setAvatarStyle] = useState(4);
  const [avatarStyleCurrent, setAvatarStyleCurrent] = useState(4);
  const [voicePacks, setVoicePacks] = useState([]);
  const [voicePack, setVoicePack] = useState('0');
  const [voicePackCurrent, setVoicePackCurrent] = useState(voicePack);

  useEffect(async () => {
    const res = await fetch(`https://raw.githubusercontent.com/webaverse/tiktalknet/main/model_lists/all_models.json`);
    const j = await res.json();
    setVoicePacks([
      defaultVoicePack,
    ].concat(j));
  }, []);

  return (
    <Tab
      type="options"
      onclick={async e => {
        toggleOpen('options')
      }}
      top
      right
      index={1}
      label={
        <div className={styles.label}>
          <img src="images/webpencil.svg" className={classnames(styles.background, styles.blue)} />
          <span className={styles.text}>オプション Option</span>
        </div>
      }
      panels={[
        (<div className={styles.panel} key="left">
          <div className={styles['panel-header']}>
            <h1>Options</h1>
          </div>
          <h2>Avatar style</h2>
          <input type="range" min={1} max={4} step={1} value={avatarStyle} onChange={e => setAvatarStyle(parseInt(e.target.value, 10))} className={styles['slider']} />
          <p className={styles['description']}>
            {
              (() => {
                switch (avatarStyle) {
                  case 1: {
                    return (<>
                      <b>1 - Sprite sheet</b>
                      <span>Pixels on a plane.<br/>Fast style of avatar! One draw call, one texture.<br/>人(_ _*)</span>
                    </>);
                  }
                  case 2: {
                    return (<>
                      <b>2 - Optimized avatar</b>
                      <span>Avatar squished into one draw call w/atlas uv! Maybe loses shading (눈_눈)</span>
                    </>);
                  }
                  case 3: {
                    return (<>
                      <b>3 - Standard avatar</b>
                      <span>Standard GLB avatar render. High quality materials if u work hard<br/>__〆(￣ー￣ )</span>
                    </>);
                  }
                  case 4: {
                    return (<>
                      <b>4 - VRM MToon avatar</b>
                      <span>The highest level to aspire to.<br/>MToon effect enabled will blow your GPU!</span>
                    </>);
                  }
                  default:
                    return null;
                }
              })()
            }
          </p>
          {(avatarStyle !== avatarStyleCurrent) ? (
            <button className={classnames(styles.big, styles['mint-button'])} onClick={e => {
              game.setAvatarQuality(avatarStyle);
              setAvatarStyleCurrent(avatarStyle);
            }}>
              <div className={styles['button-background']} />
              <span>Switch style</span>
            </button>
          ) : null}
          <h2>Voice pack</h2>
          <select value={voicePack} onChange={e => {setVoicePack(e.target.value);}}>
            {
              voicePacks.map((voicePack, i) => {
                return (
                  <option value={i} key={i}>{voicePack.name}</option>
                );
              })
            }
          </select>
          {(voicePack !== voicePackCurrent) ? (
            <button className={classnames(styles.big, styles['mint-button'])} onClick={e => {
              const vp = voicePacks[voicePack];
              
              if (typeof vp.drive_id === 'string') {
                game.setVoiceEndpoint(voiceEndpoint, vp.drive_id);
              } else if (typeof vp.audioUrl === 'string' || typeof vp.indexUrl === 'string') {
                (async () => {
                  await game.loadVoicePack({
                    audioUrl: vp.audioUrl,
                    indexUrl: vp.indexUrl,
                  });
                })().catch(err => {
                  console.warn(err);
                })
              } else {
                console.warn('no such voice pack', voicePack);
              }

              setVoicePackCurrent(voicePack);
            }}>
              <div className={styles['button-background']} />
              <span>Select voice</span>
            </button>
          ) : null}
        </div>),
        /* (selectedApp ? <div className={styles.panel} key="right">
          <div className={styles['panel-header']}>
            <div className={classnames(styles.button, styles.back)} onClick={e => {
              e.preventDefault();
              e.stopPropagation();

              setSelectedApp(null);
            }}>
              <img src="images/webchevron.svg" className={styles.img} />
            </div>
            <h1>{_formatContentId(selectedApp.contentId)}</h1>
          </div>
          <div className={styles['panel-subheader']}>Position</div>
          <div className={styles.inputs}>
            <NumberInput input={px} />
            <NumberInput input={py} />
            <NumberInput input={pz} />
          </div>
          <div className={styles['panel-subheader']}>Rotation</div>
          <div className={styles.inputs}>
            <NumberInput input={rx} />
            <NumberInput input={ry} />
            <NumberInput input={rz} />
          </div>
          <div className={styles['panel-subheader']}>Scale</div>
          <div className={styles.inputs}>
            <NumberInput input={sx} />
            <NumberInput input={sy} />
            <NumberInput input={sz} />
          </div>
        </div> : null), */
      ]}
      open={open}
      toggleOpen={toggleOpen}
      panelsRef={panelsRef}
    />
  );
};
