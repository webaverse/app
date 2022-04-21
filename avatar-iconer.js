import * as THREE from 'three';
import metaversefile from 'metaversefile'
import {emotions} from './src/components/general/character/Emotions';
import {screenshotPlayer} from './avatar-screenshotter.js';
import npcManager from './npc-manager.js';

const allEmotions = [''].concat(emotions);
const cameraOffset = new THREE.Vector3(0, 0.05, -0.35);

class AvatarIconer extends EventTarget {
  constructor(player, {
    width = 150,
    height = 150,
  } = {}) {
    super();

    this.player = player;
    this.width = width;
    this.height = height;

    this.emotionCanvases = [];
    this.emotion = '';
    this.lastRenderedEmotion = null;

    this.enabled = false;

    this.canvases = [];

    const avatarApp = player.getAvatarApp();
    this.renderAvatarApp(avatarApp);
    
    const avatarchange = e => {
      this.renderAvatarApp(e.app);
    };
    player.addEventListener('avatarchange', avatarchange);
    
    const actionupdate = e => {
      this.updateEmotionFromActions();
    };
    player.addEventListener('actionadd', actionupdate);
    player.addEventListener('actionremove', actionupdate);

    this.cleanup = () => {
      player.removeEventListener('avatarchange', avatarchange);
      player.removeEventListener('actionadd', actionupdate);
      player.removeEventListener('actionremove', actionupdate);
    };
  }
  async renderAvatarApp(srcAvatarApp) {
    const lastEnabled = this.enabled;

    if (srcAvatarApp) {
      const start_url = srcAvatarApp.contentId;
      const dstAvatarApp = await metaversefile.createAppAsync({
        start_url,
      });

      const player = npcManager.createNpc({
        name: 'avatar-iconer-npc',
        avatarApp: dstAvatarApp,
        detached: true,
      });

      const emotionCanvases = await Promise.all(allEmotions.map(async emotion => {
        const canvas = document.createElement('canvas');
        canvas.width = this.width;
        canvas.height = this.height;

        await screenshotPlayer({
          player,
          canvas,
          cameraOffset,
          emotion,
        });

        return canvas;
      }));
      this.emotionCanvases = emotionCanvases;

      player.destroy();
      dstAvatarApp.destroy();

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

      const narutoRunAction = this.player.getAction('narutoRun');
      if (narutoRunAction) {
        return 'fun';
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