import * as THREE from 'three';
import metaversefile from 'metaversefile';


const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useActivate, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 


export default () => {  

    const app = useApp();
    const localPlayer = useLocalPlayer();
    const {renderer, camera} = useInternals();
    

    const geometry = new THREE.SphereGeometry( 0.1, 32, 16 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00, transparent: true, opacity: 0.3 } );
    const sphere = new THREE.Mesh( geometry, material );
    app.add( sphere );

    const material2 = new THREE.MeshBasicMaterial( { color: 0xff0000, transparent: true, opacity: 0.3} );
    const sphere2 = new THREE.Mesh( geometry, material2 );
    app.add( sphere2 );


    const geometry3 = new THREE.SphereGeometry( 0.06, 32, 16 );
    const material3 = new THREE.MeshBasicMaterial( { color: 0x0000ff, transparent: true, opacity: 0.3 } );
    const sphere3 = new THREE.Mesh( geometry3, material3 );
    app.add( sphere3 );

    let currentModel = null;
    const localVector = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const localVector3 = new THREE.Vector3();
    let count = 0 ;
    
    const box = new THREE.BoxHelper();
    app.add( box );
    useFrame(({timestamp}) => {
        if(localPlayer.avatar){
            //#################### store avatar material ############################
            if(count < 50){
                // const calculateHead = () => {
                    const headPosition = localVector2.setFromMatrixPosition(localPlayer.avatar.modelBones.Head.matrixWorld);
                    const NeckPosition = localVector.setFromMatrixPosition(localPlayer.avatar.modelBones.Neck.matrixWorld);
                    const decapitatePosition = localVector.setFromMatrixPosition(localPlayer.avatar.modelBones.Head.savedMatrixWorld);
                    let tempMesh = null;
                    let max = 0;
                    let maxX = 0;
                    localPlayer.avatar.model.traverse(o => {
                      if (o.isMesh) {
                        
                        if(!o.geometry.boundingBox){
                            o.geometry.computeBoundingBox()
                        }
                        if(o.geometry.boundingBox.max.y > max){
                            max = o.geometry.boundingBox.max.y;
                            tempMesh = o;
                        }
                        // for(let i = 0; i < o.geometry.attributes.position.array.length; i++){
                        //     if(i % 3 === 1){
                        //         if(o.geometry.attributes.position.array[i] > max){
                        //             tempMesh = o;
                        //             max = o.geometry.attributes.position.array[i];
                        //         }
                        //     }
                        //     if(i % 3 === 0 && o.geometry.attributes.position.array[i + 1] >= headPosition.y){
                        //         maxX = (o.geometry.attributes.position.array[i] > maxX) ? o.geometry.attributes.position.array[i] : maxX;
                        //     }
                        // }
                      }
                    });
                    // if(!tempMesh.geometry.boundingBox){
                    //   tempMesh.geometry.computeBoundingBox()
                    //   tempMesh.geometry.computeBoundingSphere()
                      
                    // }
                    
                    // console.log(tempMesh.geometry.boundingBox.max.y - NeckPosition.y);
                    
                    if(count === 49){
                        console.log('bbox', tempMesh.geometry.boundingBox.max.y)
                        max += tempMesh.position.y; 
                        // console.log('maxX', maxX);
                        sphere.position.set(localPlayer.position.x, tempMesh.geometry.boundingBox.max.y, localPlayer.position.z);
                        sphere2.position.set(localPlayer.position.x + decapitatePosition.x, decapitatePosition.y, localPlayer.position.z + decapitatePosition.z);
                        sphere3.position.set(localPlayer.position.x, NeckPosition.y + ((max - NeckPosition.y) / 2), localPlayer.position.z);
                        // console.log('max:', max);
                        // console.log(max - NeckPosition.y);
                        console.log('tempMeshPosY: ', tempMesh.position.y)
                        console.log('decapitate:', decapitatePosition);
                        box.setFromObject(tempMesh)
                        box.updateMatrixWorld();
                    }
                        
                    // console.log(localPlayer.avatar.modelBones)
                // };
                count++;
            }
           
            

            if(currentModel !== localPlayer.avatar.model.uuid){
                currentModel = localPlayer.avatar.model.uuid
                console.log(localPlayer.avatar.modelBones)
                // calculateHead();
                count = 0;
            }
        }
      app.updateMatrixWorld();
    });

    return app;
}
