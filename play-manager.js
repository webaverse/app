import * as THREE from './three.module.js';
import {rigManager} from './rig.js';
import {scene, camera, renderer, avatarScene} from './app-object.js';
import runtime from './runtime.js';
import Avatar from './avatars/avatars.js';
import {makeTextMesh} from './vr-ui.js';
import {unFrustumCull} from './util.js';

let lastAvatarUrl = null;
let localRig2 = null;

import {MMDLoader} from './MMDLoader.js';
const mmdLoader = new MMDLoader();
/* mmdLoader.load('./gumi/Gumi Megpoid.pmx', o => {
  console.log('got model', o);
  o.scale.multiplyScalar(0.075);
  scene.add(o);
}, function onprogress() {}, err => {
  console.warn(err.stack);
}); */
let poseData = null;
(async () => {
  const poses = [
    `1.vpd`,
    `10.vpd`,
    `11.vpd`,
    `12.vpd`,
    `13.vpd`,
    `14.vpd`,
    `15.vpd`,
    `16.vpd`,
    `17.vpd`,
    `18.vpd`,
    `19.vpd`,
    `2.vpd`,
    `20.vpd`,
    `21.vpd`,
    `22.vpd`,
    `23.vpd`,
    `24.vpd`,
    `25.vpd`,
    `26.vpd`,
    `27.vpd`,
    `28.vpd`,
    `29.vpd`,
    `3.vpd`,
    `30.vpd`,
    `31.vpd`,
    `32.vpd`,
    `33.vpd`,
    `34.vpd`,
    `35.vpd`,
    `36.vpd`,
    `37.vpd`,
    `38.vpd`,
    `39.vpd`,
    `4.vpd`,
    `40.vpd`,
    `41.vpd`,
    `42.vpd`,
    `43.vpd`,
    `5.vpd`,
    `6.vpd`,
    `7.vpd`,
    `8.vpd`,
    `9.vpd`,
  ];
  const boneNameMappings = {
    '全ての親': null, // 'mother',
    'センター': 'Spine',
    '上半身': 'Chest',
    '首': 'Neck',
    '頭': 'Head',
    '下半身': 'Hips',

    '左肩P': null, // 'Left_shoulder',
    '左肩': 'Left_shoulder',
    '左腕': 'Left_arm',
    '左腕捩': null, // 'Left arm screw',
    '左ひじ': 'Left_elbow',
    '左手捩': null, // 'Left hand screw',
    '左手首': 'Left_wrist',
    '左親指１': 'Left_thumb0',
    '左親指２': 'Left_thumb1',
    '左人指１': 'Left_indexFinger1',
    '左人指２': 'Left_indexFinger2',
    '左人指３': 'Left_indexFinger3',
    '左中指１': 'Left_middleFinger1',
    '左中指２': 'Left_middleFinger2',
    '左中指３': 'Left_middleFinger3',
    '左薬指１': 'Left_ringFinger1',
    '左薬指２': 'Left_ringFinger2',
    '左薬指３': 'Left_ringFinger3',
    '左小指１': 'Left_littleFinger1',
    '左小指２': 'Left_littleFinger2',
    '左小指３': 'Left_littleFinger3',

    '右肩P': null, // 'Right shoulder P',
    '右肩': 'Right_shoulder',
    '右腕': 'Right_arm',
    '右腕捩': null, // 'Right arm screw',
    '右ひじ': 'Right_elbow',
    '右手捩': null, // 'Right hand screw',
    '右手首': 'Right_wrist',
    '右親指１': 'Right_thumb0',
    '右親指２': 'Right_thumb1',
    '右人指１': 'Right_indexFinger1',
    '右人指２': 'Right_indexFinger2',
    '右人指３': 'Right_indexFinger3',
    '右中指１': 'Right_middleFinger1',
    '右中指２': 'Right_middleFinger2',
    '右中指３': 'Right_middleFinger3',
    '右薬指１': 'Right_ringFinger1',
    '右薬指２': 'Right_ringFinger2',
    '右薬指３': 'Right_ringFinger3',
    '右小指１': 'Right_littleFinger1',
    '右小指２': 'Right_littleFinger2',
    '右小指３': 'Right_littleFinger3',
    
    '左足': 'Left_leg',
    '左ひざ': 'Left_knee',
    '左足首': 'Left_ankle',
    '右足': 'Right_leg',
    '右ひざ': 'Right_knee',
    '右足首': 'Right_ankle',
    '左つま先': null, // 'Left_toe',
    '右つま先': null, // 'Right_toe',
    '左足ＩＫ': null, // 'Left foot IK',
    '右足ＩＫ': null, // 'Right foot IK',
    '左つま先ＩＫ': null, // 'Left toe IK',
    '右つま先ＩＫ': null, // 'Right toe IK',
  };
  try {
    poseData = await Promise.all(poses.map(async pose => {
      const u = './assets2/poses/ThatOneBun Posepack/' + pose;
 
      const poseData = await new Promise((accept, reject) => {
        mmdLoader.loadVPD(u, false, a => {
          for (const bone of a.bones) {
            if (boneNameMappings[bone.name] !== undefined) {
              bone.name = boneNameMappings[bone.name];
            } else {
              console.warn('could not find bone mapping for', JSON.stringify(bone.name), boneNameMappings);
            }
          }
          // console.log('got animation', a);
          accept(a);
        }, function onProgress() {}, reject);
      });
      return poseData;
    }));
  } catch(err) {
    console.warn(err);
  }
})();

const factor = 1/4;      
const heartShape = new THREE.Shape();
heartShape.moveTo(-2.5 * factor, -1 * factor );
heartShape.lineTo(-2.5 * factor, 1 * factor );
heartShape.lineTo(-2 * factor, 1.5 * factor );
heartShape.lineTo(2 * factor, 1.5 * factor );
heartShape.lineTo(2.5 * factor, 1 * factor );
heartShape.lineTo(1 * factor, -1.5 * factor );
heartShape.lineTo(-2 * factor, -1.5 * factor );

const renderSize = renderer.getSize(new THREE.Vector2());
const backgroundRenderTarget = new THREE.WebGLMultisampleRenderTarget(renderSize.x, renderSize.y);
backgroundRenderTarget.samples = 4;
// backgroundRenderTarget.generateMipmaps = true;
// backgroundRenderTarget.anisotropy = 16;
const backgroundScene = new THREE.Scene();
const backgroundScene2 = new THREE.Scene();
const backgroundScene3 = new THREE.Scene();
const overrideMaterials = [
  new THREE.ShaderMaterial({
    /* uniforms: {
      uTex: {
        type: 't',
        value: backgroundRenderTarget.texture,
        needsUpdate: true,
      },
    }, */
    /* vertexShader: `\
      precision highp float;
      precision highp int;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position * 1.1, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `, */
    uniforms: {
      "depthTexture": { value: null },
      "cameraNearFar": { value: new THREE.Vector2( 0.5, 0.5 ) },
      "textureMatrix": { value: new THREE.Matrix4() }
    },
    vertexShader: [
      'varying vec4 projTexCoord;',
      'varying vec4 vPosition;',
      'uniform mat4 textureMatrix;',
      '#include <morphtarget_pars_vertex>',
      '#include <skinning_pars_vertex>',

      'float offset = 0.;',

      'void main() {',
      
      
      '#include <skinbase_vertex>',
      '#include <begin_vertex>',
      '#include <morphtarget_vertex>',
      '#include <skinning_vertex>',
      'transformed += normal * offset;',
      // 'transformed = round(transformed * 10.) / 10.;',
      '#include <project_vertex>',
      'gl_Position.xyz /= gl_Position.w;',
      'gl_Position.w = 1.;',
      `gl_Position.x -= ${(30/renderSize.x).toFixed(8)};`,
      // 'gl_Position.xy = round(gl_Position.xy * 100.) / 100.;',

      // 'vPosition = mvPosition;',
      // 'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
      // 'projTexCoord = textureMatrix * worldPosition;',

      '}'
    ].join( '\n' ),
    fragmentShader: `\
      precision highp float;
      precision highp int;

      void main() {
        gl_FragColor = vec4(${new THREE.Color(0xd99727).toArray().join(', ')}, 1.);
      }
    `,
    // side: THREE.BackSide,
    depthTest: false,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
  }),
  new THREE.ShaderMaterial({
    /* uniforms: {
      uTex: {
        type: 't',
        value: backgroundRenderTarget.texture,
        needsUpdate: true,
      },
    }, */
    /* vertexShader: `\
      precision highp float;
      precision highp int;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position * 1.1, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `, */
    uniforms: {
      "depthTexture": { value: null },
      "cameraNearFar": { value: new THREE.Vector2( 0.5, 0.5 ) },
      "textureMatrix": { value: new THREE.Matrix4() }
    },
    vertexShader: [
      'varying vec4 projTexCoord;',
      'varying vec4 vPosition;',
      'uniform mat4 textureMatrix;',
      '#include <morphtarget_pars_vertex>',
      '#include <skinning_pars_vertex>',

      'float offset = 0.;',

      'void main() {',
      
      
      '#include <skinbase_vertex>',
      '#include <begin_vertex>',
      '#include <morphtarget_vertex>',
      '#include <skinning_vertex>',
      'transformed += normal * offset;',
      // 'transformed = round(transformed * 10.) / 10.;',
      '#include <project_vertex>',
      'gl_Position.xyz /= gl_Position.w;',
      'gl_Position.w = 1.;',
      `gl_Position.x -= ${(20/renderSize.x).toFixed(8)};`,
      // 'gl_Position.xy = round(gl_Position.xy * 100.) / 100.;',

      // 'vPosition = mvPosition;',
      // 'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
      // 'projTexCoord = textureMatrix * worldPosition;',

      '}'
    ].join( '\n' ),
    fragmentShader: `\
      precision highp float;
      precision highp int;

      void main() {
        gl_FragColor = vec4(${new THREE.Color(0xffc750).toArray().join(', ')}, 1.);
      }
    `,
    // side: THREE.BackSide,
    depthTest: false,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
  }),
  new THREE.ShaderMaterial({
    /* uniforms: {
      uTex: {
        type: 't',
        value: backgroundRenderTarget.texture,
        needsUpdate: true,
      },
    }, */
    /* vertexShader: `\
      precision highp float;
      precision highp int;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position * 1.1, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `, */
    uniforms: {
      "depthTexture": { value: null },
      "cameraNearFar": { value: new THREE.Vector2( 0.5, 0.5 ) },
      "textureMatrix": { value: new THREE.Matrix4() }
    },
    vertexShader: [
      'varying vec4 projTexCoord;',
      'varying vec4 vPosition;',
      'uniform mat4 textureMatrix;',
      '#include <morphtarget_pars_vertex>',
      '#include <skinning_pars_vertex>',

      'float offset = 0.;',

      'void main() {',
      
      
      '#include <skinbase_vertex>',
      '#include <begin_vertex>',
      '#include <morphtarget_vertex>',
      '#include <skinning_vertex>',
      'transformed += normal * offset;',
      // 'transformed = round(transformed * 10.) / 10.;',
      '#include <project_vertex>',
      'gl_Position.xyz /= gl_Position.w;',
      'gl_Position.w = 1.;',
      `gl_Position.x -= ${(10/renderSize.x).toFixed(8)};`,
      // 'gl_Position.xy = round(gl_Position.xy * 100.) / 100.;',

      // 'vPosition = mvPosition;',
      // 'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
      // 'projTexCoord = textureMatrix * worldPosition;',

      '}'
    ].join( '\n' ),
    fragmentShader: `\
      precision highp float;
      precision highp int;

      void main() {
        gl_FragColor = vec4(${new THREE.Color(0xffffff).toArray().join(', ')}, 1.);
      }
    `,
    // side: THREE.BackSide,
    depthTest: false,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
  }),
];
for (const overrideMaterial of overrideMaterials) {
  overrideMaterial.skinning = true;
  overrideMaterial.morphTargets = true;
}
const overrideMaterials2 = [
  new THREE.ShaderMaterial({
    /* uniforms: {
      uTex: {
        type: 't',
        value: backgroundRenderTarget.texture,
        needsUpdate: true,
      },
    }, */
    /* vertexShader: `\
      precision highp float;
      precision highp int;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position * 1.1, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `, */
    uniforms: {
      "depthTexture": { value: null },
      "cameraNearFar": { value: new THREE.Vector2( 0.5, 0.5 ) },
      "textureMatrix": { value: new THREE.Matrix4() }
    },
    vertexShader: [
      'varying vec4 projTexCoord;',
      'varying vec4 vPosition;',
      'uniform mat4 textureMatrix;',
      '#include <morphtarget_pars_vertex>',
      '#include <skinning_pars_vertex>',

      'float offset = 0.12;',

      'void main() {',
      
      
      '#include <skinbase_vertex>',
      '#include <begin_vertex>',
      '#include <morphtarget_vertex>',
      '#include <skinning_vertex>',
      'transformed.xy *= 1. + offset;',
      // 'transformed = round(transformed * 10.) / 10.;',
      '#include <project_vertex>',
      // 'gl_Position.xyz /= gl_Position.w;',
      // 'gl_Position.w = 1.;',
      // `gl_Position.x -= ${(30/renderSize.x).toFixed(8)};`,
      // 'gl_Position.xy = round(gl_Position.xy * 100.) / 100.;',

      // 'vPosition = mvPosition;',
      // 'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
      // 'projTexCoord = textureMatrix * worldPosition;',

      '}'
    ].join( '\n' ),
    fragmentShader: `\
      precision highp float;
      precision highp int;

      void main() {
        gl_FragColor = vec4(${new THREE.Color(0xd99727).toArray().join(', ')}, 1.);
      }
    `,
    // side: THREE.BackSide,
    depthTest: false,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
  }),
  new THREE.ShaderMaterial({
    /* uniforms: {
      uTex: {
        type: 't',
        value: backgroundRenderTarget.texture,
        needsUpdate: true,
      },
    }, */
    /* vertexShader: `\
      precision highp float;
      precision highp int;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position * 1.1, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `, */
    uniforms: {
      "depthTexture": { value: null },
      "cameraNearFar": { value: new THREE.Vector2( 0.5, 0.5 ) },
      "textureMatrix": { value: new THREE.Matrix4() }
    },
    vertexShader: [
      'varying vec4 projTexCoord;',
      'varying vec4 vPosition;',
      'uniform mat4 textureMatrix;',
      '#include <morphtarget_pars_vertex>',
      '#include <skinning_pars_vertex>',

      'float offset = 0.08;',

      'void main() {',
      
      
      '#include <skinbase_vertex>',
      '#include <begin_vertex>',
      '#include <morphtarget_vertex>',
      '#include <skinning_vertex>',
      'transformed.xy *= 1. + offset;',
      // 'transformed = round(transformed * 10.) / 10.;',
      '#include <project_vertex>',
      // 'gl_Position.xyz /= gl_Position.w;',
      // 'gl_Position.w = 1.;',
      // `gl_Position.x -= ${(20/renderSize.x).toFixed(8)};`,
      // 'gl_Position.xy = round(gl_Position.xy * 100.) / 100.;',

      // 'vPosition = mvPosition;',
      // 'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
      // 'projTexCoord = textureMatrix * worldPosition;',

      '}'
    ].join( '\n' ),
    fragmentShader: `\
      precision highp float;
      precision highp int;

      void main() {
        gl_FragColor = vec4(${new THREE.Color(0xffc750).toArray().join(', ')}, 1.);
      }
    `,
    // side: THREE.BackSide,
    depthTest: false,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
  }),
  new THREE.ShaderMaterial({
    /* uniforms: {
      uTex: {
        type: 't',
        value: backgroundRenderTarget.texture,
        needsUpdate: true,
      },
    }, */
    /* vertexShader: `\
      precision highp float;
      precision highp int;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position * 1.1, 1.0);
        gl_Position = projectionMatrix * mvPosition;
      }
    `, */
    uniforms: {
      "depthTexture": { value: null },
      "cameraNearFar": { value: new THREE.Vector2( 0.5, 0.5 ) },
      "textureMatrix": { value: new THREE.Matrix4() }
    },
    vertexShader: [
      'varying vec4 projTexCoord;',
      'varying vec4 vPosition;',
      'uniform mat4 textureMatrix;',
      '#include <morphtarget_pars_vertex>',
      '#include <skinning_pars_vertex>',

      'float offset = 0.04;',

      'void main() {',
      
      
      '#include <skinbase_vertex>',
      '#include <begin_vertex>',
      '#include <morphtarget_vertex>',
      '#include <skinning_vertex>',
      'transformed.xy *= 1. + offset;',
      // 'transformed = round(transformed * 10.) / 10.;',
      '#include <project_vertex>',
      // 'gl_Position.xyz /= gl_Position.w;',
      // 'gl_Position.w = 1.;',
      // `gl_Position.x -= ${(10/renderSize.x).toFixed(8)};`,
      // 'gl_Position.xy = round(gl_Position.xy * 100.) / 100.;',

      // 'vPosition = mvPosition;',
      // 'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
      // 'projTexCoord = textureMatrix * worldPosition;',

      '}'
    ].join( '\n' ),
    fragmentShader: `\
      precision highp float;
      precision highp int;

      void main() {
        gl_FragColor = vec4(${new THREE.Color(0xffffff).toArray().join(', ')}, 1.);
      }
    `,
    // side: THREE.BackSide,
    depthTest: false,
    // transparent: true,
    // polygonOffset: true,
    // polygonOffsetFactor: -1,
  }),
];

class PlayScene {
  constructor() {
    this.audio = document.createElement('audio');
    this.audio.src = './ghost.mp3';
    rigManager.localRig.setMicrophoneMediaStream(this.audio, {
      playbackRate: 1,
      // muted: false,
    });
    // this.audio.muted = false;
    document.body.appendChild(this.audio);
    this.audio.play();

    this.script = [
      { // angry
        startTime: 0,
        sustain: 2,
        release: 3,
        index: 5,
      },
      { // wide eye
        startTime: 0,
        attack: 1,
        sustain: 2,
        release: 1,
        index: 19,
      },
      { // smile
        startTime: 0,
        sustain: 2,
        release: 1,
        index: 32,
      },
      { // eyes closed
        startTime: 2,
        attack: 0.5,
        sustain: 0.1,
        release: 0.5,
        index: 12,
      },
      /* { // ooo
        startTime: 1,
        sustain: 1,
        index: 27,
      }, */
    ].map(o => {
      o.type = 'viseme';
      o.attack = o.attack || 0;
      o.sustain = o.sustain || 0;
      o.release = o.release || 0;

      o.duration = o.attack + o.sustain + o.release;
      o.endTime = o.startTime + o.duration;
      
      return o;
    }).concat([
      {
        startTime: 0,
        duration: 10,
        target: new THREE.Vector3(0, 1, -10),
      },
    ].map(o => {
      o.type = 'look';
      o.endTime = o.startTime + o.duration;
      
      return o;
    }));

    {
      const geometry = new THREE.PlaneBufferGeometry(4, 4);
      /* const material = new THREE.MeshBasicMaterial({
        // color: new THREE.Color(0xFF0000),
        map: backgroundRenderTarget.texture,
      }); */
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTex: {
            type: 't',
            value: backgroundRenderTarget.texture,
            needsUpdate: true,
          },
        },
        vertexShader: `\
          precision highp float;
          precision highp int;

          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            /* gl_Position.xyz /= gl_Position.w;
            gl_Position.w = 1.0;
            gl_Position.xy *= 1.25; */
          }
        `,
        fragmentShader: `\
          precision highp float;
          precision highp int;

          uniform sampler2D uTex;

          void main() {
            // c.rg += gl_FragCoord.xy;
            // gl_FragColor = c;
            // gl_FragColor = vec4(1., 0., 1., 1.);
            vec2 uv = gl_FragCoord.xy / vec2(${(renderSize.x * renderer.getPixelRatio()).toFixed(8)}, ${(renderSize.y * renderer.getPixelRatio()).toFixed(8)});
            // uv -= 0.5;
            // uv.y = 1. - uv.y;
            gl_FragColor = vec4(texture2D(uTex, uv).rgb, 1.);
            // gl_FragColor.rb += uv;
          }
        `,
        // transparent: true,
        // polygonOffset: true,
        // polygonOffsetFactor: -1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(0, 4/2, -0.5);
      // mesh.visible = false;
      scene.add(mesh);
    }
    {
      const geometry = new THREE.ShapeGeometry(heartShape);
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
      });
      const splashMesh = new THREE.Mesh(geometry, material);
      splashMesh.position.set(-0.5, 2, 0);

      const textMesh = makeTextMesh('Sacks Salander', './Roboto-Regular.ttf', 0.15, 'left', 'middle');
      textMesh.color = 0xFFFFFF;
      textMesh.position.set(-0.5, 0.2, 0);
      textMesh.material.depthTest = false;
      splashMesh.add(textMesh);

      backgroundScene2.add(splashMesh);
    }
    {
      const geometry = new THREE.ShapeGeometry(heartShape);
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
      });
      const splashMesh3 = new THREE.Mesh(geometry, material);
      splashMesh3.position.set(-0.5, 2, 0);
      backgroundScene3.add(splashMesh3);
    }
  }
  update() {
    const {currentTime} = this.audio;
    rigManager.localRig.activeVisemes = this.script.map(o => {
      if (o.type === 'viseme') {
        if (o.startTime < currentTime && currentTime < o.endTime) {
          let value;
          if (currentTime < o.attack) {
            value = (currentTime - o.startTime) / o.attack;
          } else if (currentTime < (o.attack + o.sustain)) {
            value = 1;
          } else if (currentTime < (o.attack + o.sustain + o.release)) {
            value = 1 - (currentTime - (o.attack + o.sustain)) / o.release;
          } else {
            // can't happen
            value = 1;
          }
          return {
            index: o.index,
            value,
          };
        } else {
          return null;
        }
      } else {
        return null;
      }
    }).filter(n => n !== null);
    const eyeTarget = this.script.find(o => o.type === 'look' && currentTime < o.endTime);
    if (eyeTarget) {
      rigManager.localRig.eyeTarget.copy(eyeTarget.target);
      rigManager.localRig.eyeTargetEnabled = true;
    } else {
      rigManager.localRig.eyeTargetEnabled = false;
    }

    const avatarUrl = './assets2/sacks3.vrm'; // rigManager.getLocalAvatarUrl();
    if (avatarUrl !== lastAvatarUrl) {
      lastAvatarUrl = avatarUrl;
      
      (async () => {
        let o2;
        if (avatarUrl) {
          o2 = await runtime.loadFile({
            url: avatarUrl,
            ext: 'vrm',
          }, {
            contentId: avatarUrl,
          });
          /* if (!o2.isVrm && o2.run) {
            o2.run();
          } */
        }
        
        if (localRig2) {
          backgroundScene.remove(localRig2.model);
          localRig2 = null;
        }
        
        localRig2 = new Avatar(o2.raw, {
          fingers: true,
          hair: true,
          visemes: true,
          debug: false //!o,
        });
        localRig2.model.isVrm = true;
        
        unFrustumCull(localRig2.model);
        backgroundScene.add(localRig2.model);
      })();
    }
    if (rigManager.localRig && localRig2) {
      // debugger;
      rigManager.localRig.copyTo(localRig2.model);
    }
    
    // render 
    renderer.setRenderTarget(backgroundRenderTarget);
    renderer.clear();
    for (const overrideMaterial of overrideMaterials) {
      backgroundScene.overrideMaterial = overrideMaterial;
      renderer.render(backgroundScene, camera);
    }
    for (const overrideMaterial of overrideMaterials2) {
      backgroundScene3.overrideMaterial = overrideMaterial;
      renderer.render(backgroundScene3, camera);
    }
    renderer.render(backgroundScene2, camera);
    renderer.setRenderTarget(null);
  }
}
let playScene = null;

const playManager = {
  // backgroundScene,
  start() {
    playScene = new PlayScene();
  },
  update() {
    playScene && playScene.update();
  },
};
export default playManager;