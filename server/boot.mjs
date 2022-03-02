import {build} from 'vite';
import path from 'path';
import {execSync} from 'child_process';

process.env.NODE_ENV='production';

(async () => {
  /** Create Build */

  await build({
    root: '.',
    base: './',
  });

  console.log('Copying Scenes');
  /** Copy scene directory */
  execSync('cp -r ./scenes ./dist/scenes');

  console.log('Copying Metaverse_Modules');
  /** Copy Metaverse directory */
  execSync('cp -r ./metaverse_modules ./dist/metaverse_modules');

  console.log('Copying Public Direcotry');
  /** Copy public directory */
  execSync('cp -r ./public ./dist/public');
})();
