import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame, useInternals} = metaversefile;
import {WebaverseShaderMaterial} from '../../materials.js';
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

const textureLoader = new THREE.TextureLoader();

export default () => {
  let player = null;
  let windType = null;
  const app = useApp();
  const {camera} = useInternals();
  let currentDir=new THREE.Vector3();
    //################################################ trace narutoRun Time ########################################
    {
        let localVector = new THREE.Vector3();
        useFrame(() => {
            if(player !== null){
                localVector.x=0;
                localVector.y=0;
                localVector.z=-1;
                currentDir = localVector.applyQuaternion( player.quaternion );
                currentDir.normalize();
            }
            
            
        });
    }
  app.playEffect = (type, p) =>{
    console.log('wind type: ' + type)
    player = p;
    console.log(player)
    windType = type;
  }

  {
        let currentModel = null;
        let originPos = [];
        // let hairMeshes = [];
        let localVector = new THREE.Vector3();
        let localVector2 = new THREE.Vector3();
        let localVector3 = new THREE.Vector3();
        let tempPos = new THREE.Vector3();
        let rot = new THREE.Vector3( 0, 1, 0 );
        let initRot = Math.PI / 2;
        const quaternion = new THREE.Quaternion();
        const simplex = new SimplexNoise();

        const noiseScale = 1;
        const windFrequency = 1.5;
        const mainPower = 1;
        const windDirection = new THREE.Vector3(1, 0, 1);

        const sphereNoiseScale = 1;
        const sphereWindFrequency = 10;
        const sphereMainPower = 10;
        const sphereWindDirection = new THREE.Vector3(1, 0, 1);
        const spherePos = new THREE.Vector3(0, 0, 0); 
        const sphereRadius = 5;
        useFrame(({timestamp}) => {
            if(player){
                if(player.avatar && currentModel !== player.avatar.model.uuid){
                    console.log('model: ' + player.avatar.model.parent.name)
                    currentModel = player.avatar.model.uuid;
                    for (const springBones of player.avatar.springBoneManager.springBoneGroupList) {
                        for (const o of springBones) {
                            localVector2.setFromMatrixPosition(o.bone.matrixWorld);
                            let pos = new THREE.Vector3();
                            pos.x = localVector2.x;
                            pos.y = localVector2.y;
                            pos.z = localVector2.z;

                            originPos.push(pos);
                        }
                    }
                    
                }
                const timeS = timestamp/1000;
                if(player.avatar){
                    
                    const _handleDirectional = () =>{
                        const headPosition = localVector.setFromMatrixPosition(player.avatar.modelBoneOutputs.Head.matrixWorld);
                        for (const springBones of player.avatar.springBoneManager.springBoneGroupList) {
                            let i = 0;
                            for (const o of springBones) {
                                const t = timeS * windFrequency;
                                const n = simplex.noise3d(originPos[i].x * noiseScale + t, originPos[i].y * noiseScale + t, originPos[i].z * noiseScale + t);
                                
                                const gravityDir = localVector2.setFromMatrixPosition(o.bone.matrixWorld)
                                    .sub(headPosition)
                                    .normalize()
                                    .lerp(windDirection.normalize(), ((n + 1) / 2));
                                o.gravityDir.copy(gravityDir);
                                o.gravityPower = ((n + 1) / 2) * mainPower;
                                i++
                            }
                        }
                    }
                    const _handleSpherical = () =>{
                        if(player.position.distanceTo(spherePos) <= sphereRadius){
                            const headPosition = localVector.setFromMatrixPosition(player.avatar.modelBoneOutputs.Head.matrixWorld);
                            for (const springBones of player.avatar.springBoneManager.springBoneGroupList) {
                                let i = 0;
                                for (const o of springBones) {
                                    const t = timeS * sphereWindFrequency;
                                    const n = simplex.noise3d(originPos[i].x * sphereNoiseScale + t, originPos[i].y * sphereNoiseScale + t, originPos[i].z * sphereNoiseScale + t);
                                    
                                    const gravityDir = localVector2.setFromMatrixPosition(o.bone.matrixWorld)
                                        .sub(headPosition)
                                        .normalize()
                                        .lerp(sphereWindDirection.normalize(), ((n + 1) / 2));
                                    o.gravityDir.copy(gravityDir);
                                    o.gravityPower = ((n + 1) / 2) * sphereMainPower;
                                    i++
                                }
                            }
                        }
                    }
                    const _handleKi = () =>{
                        const headPosition = localVector.setFromMatrixPosition(player.avatar.modelBoneOutputs.Head.matrixWorld);
                        const octave = Math.sin(timeS * Math.PI * 2 * 4);
                        const gravityPower = 0.4 + (1 + octave)*0.5 * 0.5;
                        for (const springBones of player.avatar.springBoneManager.springBoneGroupList) {
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
                    const _handleNull = () =>{
                        for (const springBones of player.avatar.springBoneManager.springBoneGroupList) {
                            for (const o of springBones) {
                                o.gravityPower = 0;
                            }
                        }
                    }
                    switch (windType) {
                        case 'directional': {
                            _handleDirectional();
                            break;
                        }
                        case 'spherical': {
                            _handleSpherical();
                            break;
                        }
                        case 'ki': {
                            _handleKi();
                            break;
                        }
                        default: {
                            _handleNull();
                            break;
                        }
                    }
                    
                }
            }
            
        });
  }

  app.setComponent('renderPriority', 'low');
  
  return app;
};


