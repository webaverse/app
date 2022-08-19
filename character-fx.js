/*
this file implements avatar transformation effects/shaders.
*/

import metaversefile from 'metaversefile';
import * as THREE from 'three';
import {sceneLowPriority} from './renderer.js';

const localVector = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const localVector3 = new THREE.Vector3();

const _makeKiHairMaterial = () => {
  let wVertex = THREE.ShaderLib["standard"].vertexShader;
  let wFragment = THREE.ShaderLib["standard"].fragmentShader;
  // let wUniforms = THREE.UniformsUtils.clone(THREE.ShaderLib["standard"].uniforms);
  let wUniforms = {
    iTime: {
      value: 0,
      needsUpdate: false,
    },
    uHeadCenter: {
      value: new THREE.Vector3(0, 0, 0),
      needsUpdate: false,
    },
  };
  wVertex = wVertex.replace(`#include <clipping_planes_pars_vertex>`, `\
    #include <clipping_planes_pars_vertex>
    varying vec2 vUv;
    varying vec3 vWorldPosition;
  `);
  wVertex = wVertex.replace(`}`, `\
      vUv = uv;
    }
  `);
  wVertex = wVertex.replace(`#include <skinning_vertex>`, `\
    #include <skinning_vertex>
    vWorldPosition = transformed;
  `);

  wFragment = wFragment.replace(`#include <clipping_planes_pars_fragment>`, `\
    #include <clipping_planes_pars_fragment>
    uniform float iTime;
    uniform vec3 uHeadCenter;
    varying vec2 vUv;
    varying vec3 vWorldPosition;

    // #define PI 3.1415926535897932384626433832795
  `);
  wFragment = wFragment.replace(`}`, `\
      // float f = dot(vNormal, normalize(vec3(1.)));
      // vec3 colorX = mix(color1, color2, f);
      // vec3 colorY = mix(color1, color2, vUv.y);
      // gl_FragColor.rgb = colorX * colorY;
      // gl_FragColor.rgb = colorX;
      gl_FragColor.rb = vUv;

      float distanceToCenter = length(vWorldPosition - uHeadCenter);
      float glowRadius = iTime * 0.15;
      float distanceToGlowRadius = abs(distanceToCenter - glowRadius);
      distanceToGlowRadius = mod(distanceToGlowRadius, 0.1);
      gl_FragColor.rgb *= 0.3;
      if (distanceToGlowRadius < 0.01) {
        gl_FragColor.rgb *= 2.;
      }
      float glowFactor = 1. + sin(iTime * PI * 2. * 3.) * 0.5;
      gl_FragColor.rgb *= 0.5 + glowFactor * 0.5;
      gl_FragColor.a = 1.;

      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `);

  const material = new THREE.ShaderMaterial({
    uniforms: wUniforms,
    vertexShader: wVertex,
    fragmentShader: wFragment,
    extensions: {
      derivatives: true,
    },
    // side: THREE.DoubleSide,
  });
  return material;
};

export class AvatarCharacterFx {
  constructor(character) {
    this.character = character;

    // this.lastJumpState = false;
    // this.lastStepped = [false, false];
    // this.lastWalkTime = 0;

    this.kiMesh = null;
    this.sonicBoom = null;
    this.healEffect = null;
    this.hairMeshes = null;
    this.lastSSS = false;
  }
  update(timestamp, timeDiffS) {
    if (!this.character.avatar) {
      return;
    }

    const timeS = timestamp/1000;

    const powerupAction = this.character.getAction('dance');
    const isPowerup = !!powerupAction && powerupAction.animation === 'powerup';
    const sssAction = this.character.getAction('sss');
    const isSSS = !!sssAction;


    const _initHairMeshes = () => {
      this.hairMeshes = [];
      const avatarRenderer = this.character.avatar.avatarRenderer;
      const model = avatarRenderer.quality === 4 ? avatarRenderer.mesh : null;
      model && model.traverse(o => {
        // console.log(o.name, o.isMesh);
        if (o.isSkinnedMesh) {
          const {geometry, skeleton} = o;
          const skeletonBoneHairBooleans = skeleton.bones.map(bone => /hair/i.test(bone.name));
          const {attributes, index: indexAttribute} = geometry;
          const indices = indexAttribute.array;
          const {skinIndex, skinWeight} = attributes;
          const skinIndices = skinIndex.array;
          const skinWeights = skinWeight.array;
          const {itemSize} = skinIndex;
          let done = false;
          for (let i = 0; i < indices.length; i++) {
            const index = indices[i];
            for (let j = 0; j < itemSize; j++) {
              const skinIndex = skinIndices[index * itemSize + j];
              const skinWeight = skinWeights[index * itemSize + j];
              if (skinWeight !== 0 && skeletonBoneHairBooleans[skinIndex]) {
                this.hairMeshes.push(o);
                done = true;
                break;
              }
            }
            if (done) {
              break;
            }
          }
        }
      });
      for (const hairMesh of this.hairMeshes) {
        hairMesh.kiOriginalMaterial = hairMesh.material;
        const kiHairMaterial = _makeKiHairMaterial();
        hairMesh.kiMaterial = kiHairMaterial;
        
        /* kiHairMaterial.uniforms.color1.value.setHex(0xfdeb44);
        kiHairMaterial.uniforms.color1.needsUpdate = true;
        kiHairMaterial.uniforms.color2.value.setHex(0xf6b01d);
        kiHairMaterial.uniforms.color2.needsUpdate = true; */

        /* hairMesh.material.defines = kiHairMaterial.defines;
        hairMesh.material.vertexShader = kiHairMaterial.vertexShader;
        hairMesh.material.fragmentShader = kiHairMaterial.fragmentShader; */
      }
      for (const springBones of this.character.avatar.springBoneManager.springBoneGroupList) {
        for (const o of springBones) {
          o.kiOriginalGravityDir = o.gravityDir.clone();
          o.kiOriginalGravityPower = o.gravityPower;
        }
      }
    };
    const _enableHairMeshes = () => {
      for (const hairMesh of this.hairMeshes) {
        hairMesh.material = hairMesh.kiMaterial;
      }
    };
    const _disableHairMeshes = () => {
      for (const hairMesh of this.hairMeshes) {
        hairMesh.material = hairMesh.kiOriginalMaterial;
      }
      for (const springBones of this.character.avatar.springBoneManager.springBoneGroupList) {
        for (const o of springBones) {
          o.gravityDir.copy(o.kiOriginalGravityDir);
          o.gravityPower = o.kiOriginalGravityPower;
        }
      }
    };
    const _updateHair = () => {
      if (isSSS && !this.lastSSS) {
        if (!this.hairMeshes) {
          _initHairMeshes();
        }
        _enableHairMeshes();
      } else if (this.lastSSS && !isSSS) {
        _disableHairMeshes();
      }
      if (isSSS) {
        for (const hairMesh of this.hairMeshes) {
          hairMesh.material.uniforms.iTime.value = timeS;
          hairMesh.material.uniforms.iTime.needsUpdate = true;

          hairMesh.material.uniforms.uHeadCenter.value.setFromMatrixPosition(this.character.avatar.modelBoneOutputs.Head.matrixWorld);
          hairMesh.material.uniforms.uHeadCenter.needsUpdate = true;
        }

        if (this.character.avatar.springBoneManager) {
          const headPosition = localVector.setFromMatrixPosition(this.character.avatar.modelBoneOutputs.Head.matrixWorld);
          const octave = Math.sin(timeS * Math.PI * 2 * 4) // +
            // Math.sin(timeS * Math.PI * 2 * 4) +
            // Math.sin(timeS * Math.PI * 2 * 8);
          const gravityPower = 0.4 + (1 + octave)*0.5 * 0.5;
          for (const springBones of this.character.avatar.springBoneManager.springBoneGroupList) {
            for (const o of springBones) {
              const gravityDir = localVector2.setFromMatrixPosition(o.bone.matrixWorld)
                .sub(headPosition)
                .normalize()
                .lerp(localVector3.set(0, 1, 0), 0.9);
              o.gravityDir.copy(gravityDir);
              o.gravityPower = gravityPower;
            }
          }
        }
      }
    };
    _updateHair();

    const _updateKiMesh = () => {
      if (isPowerup && !this.kiMesh) {
        this.kiMesh = metaversefile.createApp();
        (async () => {
          const {importModule} = metaversefile.useDefaultModules();
          const m = await importModule('ki');
          await this.kiMesh.addModule(m);
        })();
        sceneLowPriority.add(this.kiMesh);
      }
      if (this.kiMesh) {
        this.kiMesh.visible = isPowerup;
      }
    };
    _updateKiMesh();

    this.lastSSS = isSSS;
    const _updateSonicBoomMesh = () => {
      if (!this.sonicBoom  && !this.character.isNpcPlayer) {
        this.sonicBoom = metaversefile.createApp();
        this.sonicBoom.setComponent('player', this.character);
        (async () => {
          const {importModule} = metaversefile.useDefaultModules();
          const m = await importModule('sonicBoom');
          await this.sonicBoom.addModule(m);
        })();
        sceneLowPriority.add(this.sonicBoom);
      }
    };
    _updateSonicBoomMesh();
    const _updateNameplate = () => {
      if(!this.nameplate && !this.character.isNpcPlayer && !this.character.isLocalPlayer){
        (async () => {
        this.nameplate = metaversefile.createApp();
        this.nameplate.setComponent('player', this.character);
          const {importModule} = metaversefile.useDefaultModules();
          const m = await importModule('nameplate');
          await this.nameplate.addModule(m);
          sceneLowPriority.add(this.nameplate);
        })();
      }
    };
    _updateNameplate();
    const _updateHealEffectMesh = () => {
      if(this.character.hasAction('cure')){
        if (!this.healEffect) {
          this.healEffect = metaversefile.createApp();
          (async () => {
            const {importModule} = metaversefile.useDefaultModules();
            const m = await importModule('healEffect');
            await this.healEffect.addModule(m);
            this.healEffect.playEffect(this.character);
            this.character.removeAction('cure')
          })();
          sceneLowPriority.add(this.healEffect);
        }
        else{
          this.healEffect.playEffect(this.character);
          this.character.removeAction('cure')
        }
        
      }

    };
    _updateHealEffectMesh();
  }
  destroy() {
    if (this.kiMesh) {
      sceneLowPriority.remove(this.kiMesh);
      this.kiMesh = null;
    }
    if (this.sonicBoom) {
      sceneLowPriority.remove(this.sonicBoom);
      this.sonicBoom.destroy();
      this.sonicBoom = null;
    }
    if (this.nameplate) {
      sceneLowPriority.remove(this.nameplate);
      this.nameplate = null;
    }
    if (this.healEffect) {
      sceneLowPriority.remove(this.healEffect);
      this.healEffect = null;
    }
  }
}