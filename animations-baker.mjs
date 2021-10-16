import CBOR from 'cbor';
import XMLHttpRequest from 'xhr2';
global.XMLHttpRequest = XMLHttpRequest;
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';
import fs from 'fs';
import express from 'express';
import path from 'path';


if (process.argv.length < 4) {
    console.log('\n\n\t\t\t[Invalid Args] Please use the tool as \n', `\t\t\tnode animation-baker.mjs dir/files*.fbx ani.cbor\n\n`);
    process.exit();
}


const baker = async (uriPath = "", animationFileNames, outFile) => {
    let animations = [];
    let reversibleAnimationNames = [];
    const fbxLoader = new FBXLoader();
    for (const name of animationFileNames) {
        const u = uriPath + name;
        let o;
        o = await new Promise((accept, reject) => {
            fbxLoader.load(u, accept, function progress() { }, reject);
        })
        o = o.animations[0];
        o.name = name;
        animations.push(o);
    }
    const _reverseAnimation = animation => {
        animation = animation.clone();
        const { tracks } = animation;
        for (const track of tracks) {
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
    const animationsString = JSON.stringify(animationsJson);
    const animationsCborBuffer = CBOR.encode({
        animations: animationsJson,
    });
    //console.log('decoding 1', animationsCborBuffer);
    //console.log('decoding 2', CBOR.decode(animationsCborBuffer));
    animations = JSON.parse(animationsString).map(a => THREE.AnimationClip.parse(a));
    console.log('exporting animations');
    fs.writeFileSync(outFile, Buffer.from(animationsCborBuffer));
    console.log('exported animations at', outFile);
}



(async () => {
    const app = express();
    app.use(express.static(path.dirname(process.argv[2])))
    app.listen(9999);
    const filesToBake = [];
    for (let index = 2; index < process.argv.length - 1; index++) {
        const element = process.argv[index];
        filesToBake.push(path.basename(element));
    }
    await baker('http://localhost:9999/', filesToBake, process.argv[process.argv.length - 1]).catch((e) => {
        console.warn(e);
    })
    process.exit();
})();




// baker('http://localhost:3000/', ['falling.fbx']);