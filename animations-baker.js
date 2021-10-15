import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { downloadFile, parseQuery } from './util.js';
import CBOR from './cbor.js';
import * as THREE from 'three';

const baker = async (animationFileNames, reversibleAnimationNames = [], uriPath = "") => {
    let animations = [];
    const fbxLoader = new FBXLoader();
    for (const name of animationFileNames) {
        const u = uriPath + './animations/' + encodeURIComponent(name);
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
    //console.log('exporting', animations);
    downloadFile(new Blob([animationsCborBuffer], {
        type: 'application/cbor',
    }), 'animations.cbor');
}


(async () => {
    let { files, reverse } = parseQuery(decodeURIComponent(window.location.search));
    files = files.split(',');
    await baker(files, reverse);
})();


export default baker;