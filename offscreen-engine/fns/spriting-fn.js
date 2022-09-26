import {createObjectSpriteSheet} from '../../object-spriter.js';
import metaversefile from '../../metaversefile-api.js';
import physx from '../../physx.js';

export async function createAppUrlSpriteSheet(appUrl, opts) {
  await physx.waitForLoad();

  const app = await metaversefile.createAppAsync({
    start_url: appUrl,
    components: [
      {
        key: 'physics',
        value: true,
      },
    ],
  });
  const spritesheet = await createObjectSpriteSheet(app, opts);
  return spritesheet;
}
