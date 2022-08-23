// import * as THREE from 'three';
// import metaversefile from 'metaversefile'
import {emotions} from './src/components/general/character/Emotions';
import offscreenEngineManager from './offscreen-engine-manager.js';
import {fetchArrayBuffer} from './util';
import {avatarManager} from './avatar-manager';
import {partyManager} from './party-manager'
import {playersManager} from './players-manager';

const allEmotions = [''].concat(emotions);

class AvatarIconer extends EventTarget {
  constructor({
    width = 150,
    height = 150,
  } = {}) {
    super();

    this.player = playersManager.getLocalPlayer();
    this.width = width;
    this.height = height;

    this.emotionCanvases = [];
    this.emotion = '';
    this.lastRenderedEmotion = null;

    this.enabled = false;

    this.canvases = [];

    const playerSelectedFn = e => {
      const {
        player,
      } = e.data;

      this.bindPlayer(player);
    };
    partyManager.addEventListener('playerselected', playerSelectedFn);

    const avatarchange = e => {
      this.renderAvatarApp(e.data.app);
    };
    avatarManager.addEventListener('avatarchange', avatarchange);
    
    const actionupdate = e => {
      this.updateEmotionFromActions();
    };
    avatarManager.addEventListener('actionupdate', actionupdate);

    this.cleanup = () => {
      partyManager.removeEventListener('playerselected', playerSelectedFn);
      avatarManager.removeEventListener('avatarchange', avatarchange);
      avatarManager.removeEventListener('actionupdate', actionupdate);
    };

    this.getEmotionCanvases = offscreenEngineManager.createFunction([
      `\
      import {fetchArrayBuffer} from './util.js';
      import {AvatarRenderer} from './avatars/avatar-renderer.js';
      import {createAvatarForScreenshot, screenshotAvatar} from './avatar-screenshotter.js';
      import {maxAvatarQuality} from './constants.js';
      import {emotions} from './src/components/general/character/Emotions.jsx';

      const allEmotions = [''].concat(emotions);
      `,
      async function(start_url, width, height) {
        // const cameraOffset = new THREE.Vector3(0, 0.05, -0.35);

        const arrayBuffer = await fetchArrayBuffer(start_url);

        const avatarRenderer = new AvatarRenderer({
          arrayBuffer,
          srcUrl: start_url,
          quality: maxAvatarQuality,
          controlled: true,
        });
        await avatarRenderer.waitForLoad();

        const avatar = createAvatarForScreenshot(avatarRenderer);

        const emotionCanvases = await Promise.all(allEmotions.map(async emotion => {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
  
          await screenshotAvatar({
            avatar,
            canvas,
            emotion,
          });

          const imageBitmap = await createImageBitmap(canvas);
          return imageBitmap;
        }));

        avatar.destroy();

        return emotionCanvases;
      }
    ]);

    const avatarApp = this.player.getAvatarApp();
    this.renderAvatarApp(avatarApp);
  }

  bindPlayer(player) {
    this.player = player;
    const avatarApp = this.player.getAvatarApp();
    this.renderAvatarApp(avatarApp);
  }

  async renderAvatarApp(srcAvatarApp) {
    const lastEnabled = this.enabled;

    if (srcAvatarApp) {
      const start_url = srcAvatarApp.contentId;

      this.emotionCanvases = await this.getEmotionCanvases([start_url, this.width, this.height]);

      this.enabled = true;
    } else {
      this.emotionCanvases.length = 0;
      this.enabled = false;
    }

    this.lastRenderedEmotion = null;
  
    if (lastEnabled !== this.enabled) {
      this.dispatchEvent(new MessageEvent('enabledchange', {
        data: {
          enabled: this.enabled,
        },
      }));
    }
  }
  addCanvas(canvas) {
    canvas.ctx = canvas.getContext('2d');
    this.canvases.push(canvas);
  }
  updateEmotionFromActions() {
    const emotion = (() => {
      const faceposeAction = this.player.getAction('facepose');
      if (faceposeAction) {
        return faceposeAction.emotion;
      }

      const hurtAction = this.player.getAction('hurt');
      if (hurtAction) {
        return 'sorrow';
      }
      
      const useAction = this.player.getAction('use');
      if (useAction) {
        if (
          useAction.animation === 'eat' ||
          useAction.animation === 'drink'
        ) {
          return 'joy';
        }
        if (
          useAction.behavior === 'sword' ||
          useAction.ik === 'pistol' ||
          useAction.ik === 'bow'
        ) {
          return 'angry';
        }
      }

      const jumpAction = this.player.getAction('jump');
      if (jumpAction) {
        return 'fun';
      }

      const narutoRunAction = this.player.getAction('narutoRun');
      if (narutoRunAction) {
        return 'angry';
      }

      const danceAction = this.player.getAction('dance');
      if (danceAction) {
        return 'joy';
      }

      return '';
    })();
    this.emotion = emotion;
  }
  update() {
    if (this.emotion !== this.lastRenderedEmotion) {
      const emotionIndex = allEmotions.indexOf(this.emotion);
      
      if (emotionIndex !== -1) {
        const sourceCanvas = this.emotionCanvases[emotionIndex];
        
        if (sourceCanvas) {
          for (const dstCanvas of this.canvases) {
            const {ctx} = dstCanvas;
            ctx.clearRect(0, 0, dstCanvas.width, dstCanvas.height);
            ctx.drawImage(
              sourceCanvas,
              0,
              0,
              this.width,
              this.height,
              0,
              0,
              dstCanvas.width,
              dstCanvas.height
            );
          }
        }
      }

      this.lastRenderedEmotion = this.emotion;
    }
  }
  destroy() {
    this.cleanup();
  }
}
export {
  AvatarIconer,
};