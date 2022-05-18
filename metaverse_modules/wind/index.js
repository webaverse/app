import * as THREE from 'three';
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import metaversefile from 'metaversefile';
const {useApp, useFrame} = metaversefile;


export default () => {
  let player = null;
  const app = useApp();
  let winds = null;
//   let currentDir=new THREE.Vector3();
//     //################################################ trace narutoRun Time ########################################
//     {
//         let localVector = new THREE.Vector3();
//         useFrame(() => {
//             if(player !== null){
//                 localVector.x=0;
//                 localVector.y=0;
//                 localVector.z=-1;
//                 currentDir = localVector.applyQuaternion( player.quaternion );
//                 currentDir.normalize();
//             }
            
            
//         });
//     }
  app.playEffect = (w, p) =>{
    //console.log('wind type: ' + w)
    player = p;
    //console.log(player)
    winds = w;
  }

  {
        let currentModel = null;
        let originPos = [];
        
        let localVector = new THREE.Vector3();
        let localVector2 = new THREE.Vector3();
        let localVector3 = new THREE.Vector3();
        
        const simplex = new SimplexNoise();

        
        const windDirection = new THREE.Vector3();
        const windPosition = new THREE.Vector3();

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
                    const _handleDirectional = (wind) =>{
                        const headPosition = localVector.setFromMatrixPosition(player.avatar.modelBoneOutputs.Head.matrixWorld);
                        windDirection.x = wind.direction[0];
                        windDirection.y = wind.direction[1];
                        windDirection.z = wind.direction[2];
                        for (const springBones of player.avatar.springBoneManager.springBoneGroupList) {
                            let i = 0;
                            for (const o of springBones) {
                                const t = timeS * wind.windFrequency;
                                const n = simplex.noise3d(originPos[i].x * wind.noiseScale + t, originPos[i].y * wind.noiseScale + t, originPos[i].z * wind.noiseScale + t);
                                
                                const gravityDir = localVector2.setFromMatrixPosition(o.bone.matrixWorld)
                                    .sub(headPosition)
                                    .normalize()
                                    .lerp(windDirection.normalize(), ((n + 1) / 2));
                                o.gravityDir.copy(gravityDir);
                                o.gravityPower = ((n + 1) / 2) * wind.mainPower;
                                i++
                            }
                        }
                    }
                    const _handleSpherical = (wind) =>{ 
                        windPosition.x = wind.position[0];
                        windPosition.y = wind.position[1];
                        windPosition.z = wind.position[2];
                        if(player.position.distanceTo(windPosition) <= wind.radius){
                            const headPosition = localVector.setFromMatrixPosition(player.avatar.modelBoneOutputs.Head.matrixWorld);
                            windDirection.x = wind.direction[0];
                            windDirection.y = wind.direction[1];
                            windDirection.z = wind.direction[2];
                            for (const springBones of player.avatar.springBoneManager.springBoneGroupList) {
                                let i = 0;
                                for (const o of springBones) {
                                    const t = timeS * wind.windFrequency;
                                   
                                    const n = simplex.noise3d(originPos[i].x * wind.noiseScale + t, originPos[i].y * wind.noiseScale + t, originPos[i].z * wind.noiseScale + t);
                                    
                                    const gravityDir = localVector2.setFromMatrixPosition(o.bone.matrixWorld)
                                        .sub(headPosition)
                                        .normalize()
                                        .lerp(windDirection.normalize(), ((n + 1) / 2));
                                    o.gravityDir.copy(gravityDir);
                                    o.gravityPower = ((n + 1) / 2) * (wind.mainPower * ( 1 - player.position.distanceTo(windPosition) / wind.radius));
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
                    if(winds){
                        for(const wind of winds){
                            if(wind.windType === 'directional')
                                _handleDirectional(wind);
                        }
                        for(const wind of winds){
                            if(wind.windType === 'spherical')
                                _handleSpherical(wind);
                        }
                        // for(const wind of winds){
                        //     switch (wind) {
                        //         case 'directional': {
                        //             _handleDirectional();
                        //             break;
                        //         }
                        //         case 'spherical': {
                        //             _handleSpherical();
                        //             break;
                        //         }
                        //         case 'ki': {
                        //             _handleKi();
                        //             break;
                        //         }
                        //         default: {
                        //             _handleNull();
                        //             break;
                        //         }
                        //     }
                        // }
                    }
                    
                    
                }
            }
            
        });
  }

  app.setComponent('renderPriority', 'low');
  
  return app;
};


