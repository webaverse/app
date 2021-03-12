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
    '全ての親': 'all parents',
    'センター': 'center',
    '上半身': 'Upper body',
    '首': 'first',
    '頭': 'head',
    '下半身': 'Lower body',

    '左肩P': 'Left shoulder P',
    '左肩': 'Left shoulder',
    '左腕': 'Left arm',
    '左腕捩': 'Left arm screw',
    '左ひじ': 'Left elbow',
    '左手捩': 'Left hand screw',
    '左手首': 'Left wrist',
    '左親指１': 'Left thumb 1',
    '左親指２': 'Left thumb 2',
    '左人指１': 'Left finger 1',
    '左人指２': 'Left finger 2',
    '左人指３': 'Left finger 3',
    '左中指１': 'Left middle finger 1',
    '左中指２': 'Left middle finger 2',
    '左中指３': 'Left middle finger 3',
    '左薬指１': 'Left ring finger 1',
    '左薬指２': 'Left ring finger 2',
    '左薬指３': 'Left ring finger 3',
    '左小指１': 'Left little finger 1',
    '左小指２': 'Left little finger 2',
    '左小指３': 'Left little finger 3',

    '右肩P': 'Right shoulder P',
    '右肩': 'Right shoulder',
    '右腕': 'Right arm',
    '右腕捩': 'Right arm screw',
    '右ひじ': 'Right elbow',
    '右手捩': 'Right hand screw',
    '右手首': 'Right wrist',
    '右親指１': 'Right thumb 1',
    '右親指２': 'Right thumb 2',
    '右人指１': 'Right finger 1',
    '右人指２': 'Right finger 2',
    '右人指３': 'Right finger 3',
    '右中指１': 'Right middle finger 1',
    '右中指２': 'Right middle finger 2',
    '右中指３': 'Right middle finger 3',
    '右薬指１': 'Right ring finger 1',
    '右薬指２': 'Right ring finger 2',
    '右薬指３': 'Right ring finger 3',
    '右小指１': 'Right little finger 1',
    '右小指２': 'Right little finger 2',
    '右小指３': 'Right little finger 3',
    
    '左足': 'Left foot',
    '左ひざ': 'Left knee',
    '左足首': 'Left ankle',
    '右足': 'Right foot',
    '右ひざ': 'Right knee',
    '右足首': 'Right ankle',
    '左つま先': 'Left toe',
    '右つま先': 'Right toe',
    '左足ＩＫ': 'Left foot IK',
    '右足ＩＫ': 'Right foot IK',
    '左つま先ＩＫ': 'Left toe IK',
    '右つま先ＩＫ': 'Right toe IK',
  };
  for (const pose of poses) {
    const u = './assets2/poses/ThatOneBun Posepack/' + pose;
    try {
      await new Promise((accept, reject) => {
        mmdLoader.loadVPD(u, false, a => {
          for (const bone of a.bones) {
            if (boneNameMappings[bone.name]) {
              bone.name = boneNameMappings[bone.name];
            } else {
              console.warn('could not find bone mapping for', JSON.stringify(bone.name), boneNameMappings);
            }
          }
          console.log('got animation', a);
          accept(a);
        }, function onProgress() {}, reject);
      });
    } catch(err) {
      console.warn(err);
    }
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