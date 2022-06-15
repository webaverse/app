import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useCameraManager, useLoaders, useInternals, usePhysics, useCleanup, getAppByPhysicsId} = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');


export default () => {
    const app = useApp();
    const localPlayer = useLocalPlayer();
    const cameraManager = useCameraManager();
    const {renderer, camera} = useInternals();
    const textureLoader = new THREE.TextureLoader()

    let water = null;
    const waterSurfacePos = new THREE.Vector3(0, 0, 0);
    let contactWater = false;
    let floatOnWater = false;

    //############################################################ trace water surface ########################################################################
    {
        const raycaster = new THREE.Raycaster()
        const localVector = new THREE.Vector3();
        const upVector = new THREE.Vector3(0, 1, 0);
        
        
        useFrame(({timestamp}) => {
            if(localPlayer.avatar && water){

                //############################# contact water ################################
                localVector.set(localPlayer.position.x, localPlayer.position.y - localPlayer.avatar.height, localPlayer.position.z);
                raycaster.set(localVector, upVector);
                let intersect = raycaster.intersectObject(water)
                if (intersect.length > 0) {
                    waterSurfacePos.set(intersect[0].point.x, intersect[0].point.y, intersect[0].point.z);
                    contactWater = true;
                }
                else{
                    contactWater = false;
                }


                //############################# float on water ################################
                localVector.set(localPlayer.position.x, localPlayer.position.y - localPlayer.avatar.height / 1.2, localPlayer.position.z);
                raycaster.set(localVector, upVector);
                intersect = raycaster.intersectObject(water)
                if (intersect.length > 0) {
                    if(!localPlayer.hasAction('swim')){
                        console.log('add');
                        const swimAction = {
                            type: 'swim',
                            time: 0,
                        };
                        localPlayer.setControlAction(swimAction);
                    }
                    floatOnWater = true;
                }
                else{
                    if(localPlayer.hasAction('swim')){
                        console.log('remove');
                        localPlayer.removeAction('swim');
                    }
                    floatOnWater = false;
                }

                
                
            }
            
            app.updateMatrixWorld();
        });
    }
    {
        const waterGeometry = new THREE.BoxGeometry( 500, 2, 500 );
        const waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    type: "f",
                    value: 0.0
                },
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                
            
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 ); 
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }`,
            fragmentShader: `\
                
                
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                varying vec2 vUv;
                uniform float uTime;
            
                void main() {
                    
                    gl_FragColor = vec4(0., 0.3, 0.5, 0.7);
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,

        
        });
        water = new THREE.Mesh( waterGeometry, waterMaterial );
        app.add( water );
        water.position.y = 1.01;

        const collisionPointGeometry = new THREE.SphereGeometry( 0.1, 32, 16 );
        const collisionPointMaterial = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        const collisionPoint = new THREE.Mesh( collisionPointGeometry, collisionPointMaterial );
        app.add( collisionPoint );
        
        
        useFrame(({timestamp}) => {
            if(localPlayer.avatar){
                if(contactWater){
                    collisionPoint.position.copy(waterSurfacePos);
                }
                else if(!contactWater){
                    collisionPoint.position.y = -5000;
                }
                
            }
            
            app.updateMatrixWorld();
        });
      
    }
   
  app.setComponent('renderPriority', 'low');
  
  return app;
};


