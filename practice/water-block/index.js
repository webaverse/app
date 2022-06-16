import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useCameraManager, useLoaders, useInternals, usePhysics, useCleanup, getAppByPhysicsId, useRenderSettings} = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');


export default () => {
    const app = useApp();
    const localPlayer = useLocalPlayer();
    const cameraManager = useCameraManager();
    const {renderer, camera, scene, rootScene} = useInternals();
    const renderSettings = useRenderSettings();
    const textureLoader = new THREE.TextureLoader()
    let water = null;
    const waterSurfacePos = new THREE.Vector3(0, 0, 0);
    const cameraWaterSurfacePos = new THREE.Vector3(0, 0, 0);
    let contactWater = false;
    let floatOnWater = false;
    let cameraDir=new THREE.Vector3();
    
    //############################################################# trace camera direction ########################################################################
    {
        const localVector = new THREE.Vector3();
        useFrame(() => {
            localVector.set(0, 0, -1);
            cameraDir = localVector.applyQuaternion( camera.quaternion );
            cameraDir.normalize();
            
        });
    }

    

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
                localVector.set(localPlayer.position.x, localPlayer.position.y - localPlayer.avatar.height, localPlayer.position.z);
                raycaster.set(localVector, upVector);
                intersect = raycaster.intersectObject(water)
                if (intersect.length > 0) {
                    if(intersect[0].distance > localPlayer.avatar.height / 1.2){
                        if(!localPlayer.hasAction('swim')){
                            console.log('add');
                            const swimAction = {
                                type: 'swim',
                                onSurface: false,
                            };
                            localPlayer.setControlAction(swimAction);
                        }
                        localPlayer.getAction('swim').onSurface = false;
                        floatOnWater = true;
                    }
                    else{
                        if(localPlayer.hasAction('swim'))
                            localPlayer.getAction('swim').onSurface = true;
                    }
                    
                }
                else{
                    if(localPlayer.hasAction('swim')){
                        console.log('remove');
                        localPlayer.removeAction('swim');
                    }
                    floatOnWater = false;
                }

                //############################### camera raycast ###################################
                localVector.set(camera.position.x + cameraDir.x * 0.2, camera.position.y, localPlayer.position.z + cameraDir.z * 0.2);
                raycaster.set(localVector, upVector);
                intersect = raycaster.intersectObject(water);
                if (intersect.length > 0 ) {
                    cameraWaterSurfacePos.set(intersect[0].point.x, intersect[0].point.y, intersect[0].point.z);
                }
                
            }
            
            app.updateMatrixWorld();
        });
    }
    //######################################################################## water ########################################################################
    {
        const waterGeometry = new THREE.PlaneGeometry( 500, 500 );
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
                    
                    gl_FragColor = vec4(0., 0.3, 0.5, 0.8);
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            //depthWrite: false,
            //blending: THREE.AdditiveBlending,

        
        });
        water = new THREE.Mesh( waterGeometry, waterMaterial );
        app.add( water );
        water.rotation.x = -Math.PI / 2;
        water.position.y = 3;

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
    //######################################################################## mask ########################################################################
    {
        
        // const color = 0xFF0000;
        // const density = 0.1;
        // rootScene.fog = new THREE.FogExp2(color, 1);
        // rootScene.updateMatrixWorld();
        
        rootScene.fog = new THREE.FogExp2(new THREE.Color(0/255, 5/255, 10/255).getHex(), 0.1);
        
        
        
        
        const geometry = new THREE.PlaneGeometry( 2, 2 );
        const material= new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                cameraWaterSurfacePos:{
                    value: new THREE.Vector3()
                },
                contactWater:{
                    value: false
                }
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
                uniform float uTime;
                
                varying vec2 vUv;
                varying vec3 vPos;
                
                void main() {
                    vUv = uv;
                   
                    
                    vec3 pos = position;
                    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                    vec4 viewPosition = viewMatrix * modelPosition;
                    vec4 projectionPosition = projectionMatrix * viewPosition;
            
                    gl_Position = projectionPosition;
                    vPos = modelPosition.xyz;
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }
            `,
            fragmentShader: `\
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                uniform float uTime;
                uniform bool contactWater;
                //uniform sampler2D sphereTexture;
                uniform vec3 cameraWaterSurfacePos;
                
                varying vec2 vUv;
                varying vec3 vPos;
                

                void main() {
                    gl_FragColor = vec4(0.0, 0.3, 0.5, 0.3);
                    if(!contactWater || vPos.y > cameraWaterSurfacePos.y)
                        gl_FragColor.a = 0.;
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            //blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
        const mask = new THREE.Mesh( geometry, material );
        //app.add( mask );
        camera.add(mask);

        useFrame(({timestamp}) => {
           
            // mask.position.set(camera.position.x + cameraDir.x * 0.4, camera.position.y, camera.position.z + cameraDir.z * 0.4); 
            // mask.rotation.copy(camera.rotation);  
            mask.position.set(0, 0, -0.2);
            mask.material.uniforms.uTime.value = timestamp / 1000;
            mask.material.uniforms.cameraWaterSurfacePos.value.copy(cameraWaterSurfacePos);
            mask.material.uniforms.contactWater.value = contactWater;
            if(camera.position.y < cameraWaterSurfacePos.y && contactWater){
                if(renderSettings.findRenderSettings(scene))
                    renderSettings.findRenderSettings(scene).fog.density = 0.05;
            }
            else{
                if(renderSettings.findRenderSettings(scene))
                    renderSettings.findRenderSettings(scene).fog.density = 0;
            }
            app.updateMatrixWorld();
        
        });
    }
   
  app.setComponent('renderPriority', 'low');
  
  return app;
};


