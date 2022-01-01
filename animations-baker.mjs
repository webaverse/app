import * as CBOR from 'borc';
import XMLHttpRequest from 'xhr2';
global.XMLHttpRequest = XMLHttpRequest;
import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader.js';
import {MMDLoader} from 'three/examples/jsm/loaders/MMDLoader.js';
import {CharsetEncoder} from 'three/examples/jsm/libs/mmdparser.module.js';
import {getHeight, modelBoneToAnimationBone} from './avatars/util.mjs';
import encoding from 'encoding-japanese';
// import * as THREE from 'three';
import path from 'path';
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
const findFilesWithExtension = (baseDir, subDir, ext) => {
  const files = [];
  const dotExt = `.${ext}`;
  const _recurse = p => {
    const entries = fs.readdirSync(p);
    for (const entry of entries) {
      const fullPath = `${p}/${entry}`;
      if (fs.statSync(fullPath).isDirectory()) {
        _recurse(fullPath);
      } else if (entry.endsWith(dotExt)) {
        files.push(fullPath.slice(baseDir.length + 1));
      }
    }
  }
  _recurse(path.join(baseDir, subDir));
  return files;
};
// let mmdAnimation = null;
// const charsetEncoder = new CharsetEncoder();
const _makeFakeBone = name => {
  return {
    // name,
    translation: [0, 0, 0],
    quaternion: [0, 0, 0, 1],
  };
};
const _parseVpd = o => {
  const _getBone = name => {
    return o.bones.find(b => b.name === name) ?? _makeFakeBone();
  };
  const mmdModelBones = {
    // Root: _getBone('センター'), // deliberately excluded

    Hips: _getBone('下半身'),
    Spine: _makeFakeBone(), // not present in mmd
    Chest: _getBone('上半身'),
    UpperChest: _makeFakeBone(), // not present in mmd
    Neck: _getBone('首'),
    Head: _getBone('頭'),
    // Eye_L: _getBone('左目'), // deliberately excluded
    // Eye_R: _getBone('右目'), // deliberately excluded

    Left_shoulder: _getBone('左肩'),
    Left_arm: _getBone('左腕'),
    Left_elbow: _getBone('左ひじ'),
    Left_wrist: _getBone('左手首'),
    Left_thumb2: _getBone('左親指２'),
    Left_thumb1: _getBone('左親指１'),
    Left_thumb0: _makeFakeBone(), // not present in mmd
    Left_indexFinger3: _getBone('左人指３'),
    Left_indexFinger2: _getBone('左人指２'),
    Left_indexFinger1: _getBone('左人指１'),
    Left_middleFinger3: _getBone('左中指３'),
    Left_middleFinger2: _getBone('左中指２'),
    Left_middleFinger1: _getBone('左中指１'),
    Left_ringFinger3: _getBone('左薬指３'),
    Left_ringFinger2: _getBone('左薬指２'),
    Left_ringFinger1: _getBone('左薬指１'),
    Left_littleFinger3: _getBone('左小指３'),
    Left_littleFinger2: _getBone('左小指２'),
    Left_littleFinger1: _getBone('左小指１'),
    Left_leg: _getBone('左足'),
    Left_knee: _getBone('左ひざ'),
    Left_ankle: _getBone('左足首'),

    Right_shoulder: _getBone('右肩'),
    Right_arm: _getBone('右腕'),
    Right_elbow: _getBone('右ひじ'),
    Right_wrist: _getBone('右手首'),
    Right_thumb2: _getBone('右親指２'),
    Right_thumb1: _getBone('右親指１'),
    Right_thumb0: _makeFakeBone(), // not present in mmd
    Right_indexFinger3: _getBone('右人指３'),
    Right_indexFinger2: _getBone('右人指２'),
    Right_indexFinger1: _getBone('右人指１'),
    Right_middleFinger3: _getBone('右中指３'),
    Right_middleFinger2: _getBone('右中指２'),
    Right_middleFinger1: _getBone('右中指１'),
    Right_ringFinger3: _getBone('右薬指３'),
    Right_ringFinger2: _getBone('右薬指２'),
    Right_ringFinger1: _getBone('右薬指１'),
    Right_littleFinger3: _getBone('右小指３'),
    Right_littleFinger2: _getBone('右小指２'),
    Right_littleFinger1: _getBone('右小指１'),
    Right_leg: _getBone('右足'),
    Right_knee: _getBone('右ひざ'),
    Right_ankle: _getBone('右足首'),
    Left_toe: _getBone('左つま先'),
    Right_toe: _getBone('右つま先'),
  };
  /* for (const k in mmdModelBones) {
    if (!mmdModelBones[k]) {
      console.warn('no bone', k);
    }
  } */

  const mmdAnimation = {};
  for (const key in mmdModelBones) {
    const key2 = modelBoneToAnimationBone[key];
    /* if (key2 === undefined) {
      throw new Error('fail: ' + key);
    } */
    mmdAnimation[key2] = mmdModelBones[key];
  }
  return mmdAnimation;
};

const baker = async (uriPath = '', fbxFileNames, vpdFileNames, outFile) => {
    let animations = [];

    // mmd
    const mmdLoader = new MMDLoader();
    const charsetEncoder = new CharsetEncoder();
    const mmdPoses = [];
    for (const name of vpdFileNames) {
      // console.log('try', name);
      
      let o;
      
      /* const content = fs.readFileSync('public/' + name);
      const text = charsetEncoder.s2u(content);
      // console.log('got text', text);
      const parser = mmdLoader._getParser();
      o = parser.parseVpd(text, true); */

      const content = fs.readFileSync('public/' + name);
      var sjisArray = encoding.convert(content, 'UTF8');
      const text = new TextDecoder().decode(Uint8Array.from(sjisArray));
      const parser = mmdLoader._getParser();
      o = parser.parseVpd(text, true);

      /* const u = uriPath + name;
      o = await new Promise((accept, reject) => {
          mmdLoader.loadVPD(u, false, o => {
            // o.scene = o;
            accept(o);
          }, function progress() {}, reject);
      }); */

      const poses = _parseVpd(o);
      mmdPoses.push({
        name: name.slice('poses/'.length),
        poses,
      });
    }
    const mmdAnimationsJson = [];
    for (const mmdPose of mmdPoses) {
      const {name} = mmdPose;
      const tracks = [];
      for (const boneName in mmdPose.poses) {
        const bone = mmdPose.poses[boneName];
        const isHips = /hips/i.test(boneName);
        if (isHips) {
          tracks.push({
            name: boneName + '.position',
            type: 'vector',
            times: [0],
            values: bone.translation,
          });
        }
        tracks.push({
          name: boneName + '.quaternion',
          type: 'quaternion',
          times: [0],
          values: bone.quaternion,
        });
      }
      const mmdAnimation = {
        uuid: name,
        name,
        duration: 1,
        tracks,
      };
      mmdAnimationsJson.push(mmdAnimation);
    }
    
    // fbx
    const fbxLoader = new FBXLoader();
    const height = await (async () => {
      let o;
      const u = uriPath + 'animations/' + idleAnimationName;
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
    for (const name of fbxFileNames) {
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
        animation.name = name.slice('animations/'.length);
        
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

    // format
    const animationsJson = animations.map(a => a.toJSON())
      .concat(mmdAnimationsJson);
    // console.log('got animations json', animationsJson[0], mmdAnimationsJson[0]);
    const animationsCborBuffer = CBOR.encode({
        animations: animationsJson,
    });
    CBOR.decode(animationsCborBuffer);
    console.log('exporting animations');
    fs.writeFileSync(outFile, Buffer.from(animationsCborBuffer));
    console.log('exported animations at', outFile);
}

(async () => {
    const app = express();
    /* app.all('*', (req, res, next) => {
      // console.log('got url 1', req.url);
      req.url = decodeURI(req.url);
      req.originalUrl = decodeURI(req.url);
      // console.log('got url 2', req.url);
      next();
    }); */
    app.use(express.static('public'))
    app.listen(9999);
    const animationFileNames = fs.readdirSync('public/animations');
    const fbxFileNames = animationFileNames.filter(name => /\.fbx$/.test(name)).map(name => 'animations/' + name);
    const vpdFileNames = findFilesWithExtension('public', 'poses', 'vpd');
    const animationsCborFileName = 'public/animations/animations.cbor';
    await baker('http://localhost:9999/', fbxFileNames, vpdFileNames, animationsCborFileName).catch((e) => {
        console.warn('bake error', e);
    })
    process.exit();
})();

// baker('http://localhost:3000/', ['falling.fbx']);