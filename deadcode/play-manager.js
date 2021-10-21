import * as THREE from './three.module.js';
import {rigManager} from './rig.js';
import {scene, camera, renderer, avatarScene} from './app-object.js';
// import runtime from './runtime.js';
import Avatar from './avatars/avatars.js';
import {makeTextMesh} from './vr-ui.js';
import {unFrustumCull} from './util.js';
import {forceAvatarUrl} from './constants.js';

let lastAvatarUrl = null;
let localRig2 = null;

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

const overrideMaterial1 = new THREE.ShaderMaterial({
  uniforms: {
    "depthTexture": { value: null },
    "cameraNearFar": { value: new THREE.Vector2( 0.5, 0.5 ) },
    "textureMatrix": { value: new THREE.Matrix4() },
    "offset": { value: 0 },
    "translation": { value: new THREE.Vector3() },
    "color": { value: new THREE.Color() },
    "center": { value: new THREE.Vector3() },
    "scale": { value: new THREE.Vector3() },
  },
  vertexShader: [
    'varying vec4 projTexCoord;',
    'varying vec4 vPosition;',
    'uniform mat4 textureMatrix;',
    '#include <morphtarget_pars_vertex>',
    '#include <skinning_pars_vertex>',

    'uniform float offset;',
    'uniform vec3 translation;',
    'uniform vec3 center;',
    'uniform vec3 scale;',

    'void main() {',
    
    
    '#include <skinbase_vertex>',
    '#include <begin_vertex>',
    '#include <morphtarget_vertex>',
    '#include <skinning_vertex>',
    'transformed -= center;',
    'transformed *= scale;',
    'transformed += center;',
    'transformed += normal * offset;',
    '#include <project_vertex>',
    'gl_Position.xyz /= gl_Position.w;',
    'gl_Position.w = 1.;',
    `gl_Position.xyz += translation;`,
    // 'gl_Position.xy = round(gl_Position.xy * 100.) / 100.;',

    // 'vPosition = mvPosition;',
    // 'vec4 worldPosition = modelMatrix * vec4( position, 1.0 );',
    // 'projTexCoord = textureMatrix * worldPosition;',

    '}'
  ].join( '\n' ),
  fragmentShader: `\
    precision highp float;
    precision highp int;
    
    uniform vec3 color;

    void main() {
      gl_FragColor = vec4(color, 1.);
    }
  `,
  // side: THREE.BackSide,
  depthTest: false,
  depthWrite: false,
  // transparent: true,
  // polygonOffset: true,
  // polygonOffsetFactor: -1,
});
const overrideMaterial2 = overrideMaterial1.clone();
for (const m of [overrideMaterial1, overrideMaterial2]) {
  m.skinning = true;
  m.morphTargets = true;
}
const overrideMaterialSpecs1 = [
  {
    offset: 0,
    translation: new THREE.Vector3(-30/renderSize.x, 0, 0),
    color: new THREE.Color(0xd99727),
  },
  {
    offset: 0,
    translation: new THREE.Vector3(-20/renderSize.x, 0, 0),
    color: new THREE.Color(0xffc750),
  },
  {
    offset: 0,
    translation: new THREE.Vector3(-10/renderSize.x, 0, 0),
    color: new THREE.Color(0xffffff),
  },
];
const overrideMaterialSpecs2 = [
  {
    offset: 0.12,
    translation: new THREE.Vector3(0, 0, 0),
    color: new THREE.Color(0xd99727),
  },
  {
    offset: 0.08,
    translation: new THREE.Vector3(0, 0, 0),
    color: new THREE.Color(0xffc750),
  },
  {
    offset: 0.04,
    translation: new THREE.Vector3(0, 0, 0),
    color: new THREE.Color(0xffffff),
  },
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

    this.resourceMeta = [
      {
        name: 'sacks',
        url: `./assets2/sacks.vrm`,
        ext: 'vrm',
      },
      {
        name: 'wade',
        url: `./assets2/kasamoto_kanji.vrm`,
        ext: 'vrm',
      },
    ];
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
    this.resources = [];
    this.live = true;
    
    const _loadMirrorAvatar = async u => {
      let o2;
      o2 = await runtime.loadFile({
        url: u,
        ext: 'vrm',
      }, {
        contentId: u,
      });
      
      const rig = new Avatar(o2.raw, {
        fingers: true,
        hair: true,
        visemes: true,
        debug: false,
      });
      
      unFrustumCull(rig.model);
      backgroundScene.add(rig.model);
      return rig;
    };
    
    (async () => {
      await Promise.all(this.resourceMeta.map(async r => {
        const {name, url, ext} = r;
        const o = await runtime.loadFile({
          url,
          ext,
        }, {
          contentId: url,
        });
        o.name = name;
        
        if (this.live) {
          const rig = new Avatar(o.raw, {
            fingers: true,
            hair: true,
            visemes: true,
            debug: false,
          });
          rig.model.isVrm = o.isVrm;
          rig.model.contentId = o.contentId;
          
          // unFrustumCull(rig.model);
          scene.add(rig.model);
          
          this.resources.push(rig);
        }
      }));
    })();
    this.mesh = null;
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
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(0, 4/2, -0.5);
      scene.add(this.mesh);
    }
    this.splashMesh = null;
    {
      const geometry = new THREE.ShapeGeometry(heartShape);
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
      });
      this.splashMesh = new THREE.Mesh(geometry, material);
      this.splashMesh.position.set(-0.5, 2, 0);

      const textMesh = makeTextMesh('Sacks Salander', './Roboto-Regular.ttf', 0.15, 'left', 'middle');
      textMesh.color = 0xFFFFFF;
      textMesh.position.set(-0.5, 0.2, 0);
      textMesh.material.depthTest = false;
      this.splashMesh.add(textMesh);

      backgroundScene2.add(this.splashMesh);
    }
    this.splashMesh2 = null;
    {
      const geometry = new THREE.ShapeGeometry(heartShape);
      const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
      });
      this.splashMesh2 = new THREE.Mesh(geometry, material);
      this.splashMesh2.position.set(-0.5, 2, 0);
      backgroundScene3.add(this.splashMesh2);
    }
    
    this.localRig2 = null;
    (async () => {
      this.localRig2 = await _loadMirrorAvatar(forceAvatarUrl);
    })();
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

    // local pose
    if (this.localRig2) {
      rigManager.localRig.copyTo(this.localRig2.model);
    }
    
    // render
    const oldRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(backgroundRenderTarget);
    renderer.clear();
    for (const spec of overrideMaterialSpecs1) {
      backgroundScene.overrideMaterial = overrideMaterial1;
      overrideMaterial1.uniforms.offset.value = spec.offset;
      overrideMaterial1.uniforms.translation.value.copy(spec.translation);
      overrideMaterial1.uniforms.color.value.copy(spec.color);
      overrideMaterial1.uniforms.center.value.set(0, 0, 0);
      overrideMaterial1.uniforms.scale.value.set(1, 1, 1);
      renderer.render(backgroundScene, camera);
    }
    for (const spec of overrideMaterialSpecs2) {
      backgroundScene3.overrideMaterial = overrideMaterial2;
      overrideMaterial2.uniforms.offset.value = spec.offset;
      overrideMaterial2.uniforms.translation.value.copy(spec.translation);
      overrideMaterial2.uniforms.color.value.copy(spec.color);
      overrideMaterial2.uniforms.center.value.set(0, 0, 0);
      overrideMaterial2.uniforms.scale.value.set(1, 1, 1);
      renderer.render(backgroundScene3, camera);
    }
    renderer.render(backgroundScene2, camera);
    renderer.setRenderTarget(oldRenderTarget);
  }
  destroy() {
    this.live = false;
    scene.remove(this.mesh);
    backgroundScene2.remove(this.splashMesh);
    backgroundScene3.remove(this.splashMesh2);
    backgroundScene.remove(this.localRig2.model);
    console.log('remove', this.resources.slice());
    for (const resource of this.resources) {
      scene.remove(resource.model);
    }
  }
}
let playScene = null;
let cubeMesh = null;
const playManager = {
  // backgroundScene,
  start() {
    if (playScene) {
      playScene.destroy();
      playScene = null;
      
      scene.remove(cubeMesh);
      cubeMesh = null;
    } else {
      playScene = new PlayScene();
      
      cubeMesh = new THREE.Mesh(new THREE.BoxBufferGeometry(0.1, 0.1, 0.1), new THREE.MeshPhongMaterial({
        color: 0xFF0000,
      }));
      cubeMesh.position.set(0, 1, -10);
      scene.add(cubeMesh);
    }
  },
  update() {
    playScene && playScene.update();
  },
};
export default playManager;