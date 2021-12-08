import * as CBOR from 'borc';
import XMLHttpRequest from 'xhr2';
global.XMLHttpRequest = XMLHttpRequest;
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import {getHeight} from './avatars/util.mjs';
// import * as THREE from 'three';
import fs from 'fs';
import express from 'express';

/* if (process.argv.length < 4) {
    console.log('\n\n\t\t\t[Invalid Args] Please use the tool as \n', `\t\t\tnode animations-baker.mjs dir/files*.fbx ani.cbor\n\n`);
    process.exit();
} */

const idleAnimationName = 'idle.fbx';
const reversibleAnimationNames = [
  `left strafe walking.fbx`,
  `left strafe.fbx`,
  `right strafe walking.fbx`,
  `right strafe.fbx`,
  `Sneaking Forward.fbx`,
  `Crouched Sneaking Left.fbx`,
  `Crouched Sneaking Right.fbx`,
];

const baker = async (uriPath = "", animationFileNames, outFile) => {
    let animations = [];
    
    const fbxLoader = new FBXLoader();
    const height = await (async () => {
      let o;
      const u = uriPath + idleAnimationName;
      o = await new Promise((accept, reject) => {
          fbxLoader.load(u, o => {
            o.scene = o;
            accept(o);
          }, function progress() { }, reject);
      });
      // console.log('got height', height);
      // const animation = o.animations[0];
      return getHeight(o);
    })();
    // console.log('got height', height);
    
    for (const name of animationFileNames) {
        const u = uriPath + name;
        console.log('processing', name);
        let o;
        o = await new Promise((accept, reject) => {
            fbxLoader.load(u, o => {
              o.scene = o;
              accept(o);
            }, function progress() { }, reject);
        });
        // console.log('got height', height);
        const animation = o.animations[0];
        animation.name = name;
        
        for (const track of animation.tracks) {
          if (/\.position/.test(track.name)) {
            const values2 = new track.values.constructor(track.values.length);
            const valueSize = track.getValueSize();
            const numValues = track.values.length / valueSize;
            for (let i = 0; i < numValues; i++) {
                const index = i;
                for (let j = 0; j < valueSize; j++) {
                  values2[index * valueSize + j] = track.values[index * valueSize + j] / height;
                }
            }
            track.values = values2;
          }
        }
        
        animations.push(animation);
    }
    const _reverseAnimation = animation => {
        animation = animation.clone();
        for (const track of animation.tracks) {
            track.times.reverse();
            for (let i = 0; i < track.times.length; i++) {
                track.times[i] = animation.duration - track.times[i];
            }

            const values2 = new track.values.constructor(track.values.length);
            const valueSize = track.getValueSize();
            const numValues = track.values.length / valueSize;
            for (let i = 0; i < numValues; i++) {
                const aIndex = i;
                const bIndex = numValues - 1 - i;
                for (let j = 0; j < valueSize; j++) {
                    values2[aIndex * valueSize + j] = track.values[bIndex * valueSize + j];
                }
            }
            track.values = values2;
        }
        return animation;
    };
    for (const name of reversibleAnimationNames) {
        const animation = animations.find(a => a.name === name);
        const reverseAnimation = _reverseAnimation(animation);
        reverseAnimation.name = animation.name.replace(/\.fbx$/, ' reverse.fbx');
        animations.push(reverseAnimation);
    }

    const animationsJson = animations.map(a => a.toJSON());
    const animationsCborBuffer = CBOR.encode({
        animations: animationsJson,
    });
    //console.log('decoding 1', animationsCborBuffer);
    CBOR.decode(animationsCborBuffer);
    console.log('exporting animations');
    fs.writeFileSync(outFile, Buffer.from(animationsCborBuffer));
    console.log('exported animations at', outFile);
}

(async () => {
    const app = express();
    app.use(express.static('public/animations'))
    app.listen(9999);
    const animationFileNames = fs.readdirSync('public/animations');
    const fbxFileNames = animationFileNames.filter(name => /\.fbx$/.test(name));
    const animationsCborFileName = 'public/animations/animations.cbor';
    await baker('http://localhost:9999/', fbxFileNames, animationsCborFileName).catch((e) => {
        console.warn('bake error', new Error().stack);
    })
    process.exit();
})();

// baker('http://localhost:3000/', ['falling.fbx']);