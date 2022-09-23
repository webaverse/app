import {createObjectSpriteAnimation} from '../../object-spriter.js';
import metaversefile from '../../metaversefile-api.js';
import physx from '../../physx.js';

export async function getSpriteAnimationForAppUrlInternal(appUrl, opts) {
  await physx.waitForLoad();

  const app = await metaversefile.createAppAsync({
    start_url: appUrl,
  });
  const spritesheet = await createObjectSpriteAnimation(app, opts, {
    type: 'imageBitmap',
  });
  return spritesheet;
}