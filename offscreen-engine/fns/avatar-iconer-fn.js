import {fetchArrayBuffer} from '../../util.js';
import {AvatarRenderer} from '../../avatars/avatar-renderer.js';
import {createAvatarForScreenshot, screenshotAvatar} from '../../avatar-screenshotter.js';
import {maxAvatarQuality} from '../../constants.js';
import {emotions} from '../../src/components/general/character/Emotions.jsx';

const allEmotions = [''].concat(emotions);

export async function getEmotionCanvases(start_url, width, height) {
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
