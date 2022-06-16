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
    const textureLoader = new THREE.TextureLoader();
    const waterNormalTexture1 = textureLoader.load(`${baseUrl}/textures/waterNormal2.png`);
    waterNormalTexture1.wrapS = waterNormalTexture1.wrapT = THREE.RepeatWrapping;
    const waterNormalTexture2 = textureLoader.load(`${baseUrl}/textures/waterNormal3.png`);
    waterNormalTexture2.wrapS = waterNormalTexture2.wrapT = THREE.RepeatWrapping;

    
    const waterDerivativeHeightTexture = textureLoader.load(`${baseUrl}/textures/water-derivative-height.png`);
    waterDerivativeHeightTexture.wrapS = waterDerivativeHeightTexture.wrapT = THREE.RepeatWrapping;
    const waterNormalTexture = textureLoader.load(`${baseUrl}/textures/water-normal.png`);
    waterNormalTexture.wrapS = waterNormalTexture.wrapT = THREE.RepeatWrapping;
    const waterNoiseTexture = textureLoader.load(`${baseUrl}/textures/water.png`);
    waterNoiseTexture.wrapS = waterNoiseTexture.wrapT = THREE.RepeatWrapping;
    const flowmapTexture = textureLoader.load(`${baseUrl}/textures/flowmap.png`);
    flowmapTexture.wrapS = flowmapTexture.wrapT = THREE.RepeatWrapping;

    let water = null;
    const waterSurfacePos = new THREE.Vector3(0, 0, 0);
    const cameraWaterSurfacePos = new THREE.Vector3(0, 0, 0);
    let contactWater = false;
    let floatOnWater = false;
    let cameraDir = new THREE.Vector3();
    let playerDir = new THREE.Vector3();
    
    //############################################################# trace camera direction ########################################################################
    {
        const localVector = new THREE.Vector3();
        const localVector2 = new THREE.Vector3();
        useFrame(() => {
            localVector.set(0, 0, -1);
            cameraDir = localVector.applyQuaternion( camera.quaternion );
            cameraDir.normalize();

            localVector2.set(0, 0, -1);
            playerDir = localVector.applyQuaternion( localPlayer.quaternion );
            playerDir.normalize();
            
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
                    if(intersect[0].distance < localPlayer.avatar.height * 0.6){
                        if(localPlayer.hasAction('swim')){
                            console.log('remove');
                            localPlayer.removeAction('swim');
                        }
                        floatOnWater = false;
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
        const waterGeometry = new THREE.PlaneGeometry( 1500, 1500 );
        const waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    type: "f",
                    value: 0.0
                },
                uUJump: {
                    type: "f",
                    value: 0.24
                },
                uVJump: {
                    type: "f",
                    value: 0.208
                },
                uTiling: {
                    type: "f",
                    value: 2
                },
                uSpeed: {
                    type: "f",
                    value: 0.8
                },
                uFlowStrength: {
                    type: "f",
                    value: 0.25
                },
                uFlowOffset: {
                    type: "f",
                    value: -1.5
                },
                sunPosition: {
                    value: new THREE.Vector3(200.0, 1.0, -600.)
                },
                playerPosition: {
                    value: new THREE.Vector3()
                },
                playerDirection: {
                    value: new THREE.Vector3()
                },
                waterDerivativeHeightTexture: {
                    value: waterDerivativeHeightTexture
                },
                waterNoiseTexture: {
                    value: waterNoiseTexture
                },
                flowmapTexture: {
                    value: flowmapTexture
                },

            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                
            
                varying vec3 vPos;
                varying vec2 vUv;

                void main() {
                    vPos = position;
                    vUv = uv;
                    vec3 pos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 ); 
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }`,
            fragmentShader: `\
                
                
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                varying vec3 vPos;
                varying vec2 vUv;

                uniform mat4 modelMatrix;
                uniform float uTime;
                uniform float uUJump;
                uniform float uVJump;
                uniform float uTiling;
                uniform float uSpeed;
                uniform float uFlowStrength;
                uniform float uFlowOffset;
                uniform vec3 sunPosition;
                uniform vec3 playerPosition;
                uniform vec3 playerDirection;
                
                
                uniform sampler2D waterDerivativeHeightTexture;
                uniform sampler2D waterNoiseTexture;
                uniform sampler2D flowmapTexture;
                
                float frac(float v)
                {
                  return v - floor(v);
                }
                vec3 FlowUVW (vec2 uv, vec2 flowVector, vec2 jump, float flowOffset, float tiling, float time,  bool flowB) {
                    float phaseOffset = flowB ? 0.5 : 0.;
                    float progress = frac(time + phaseOffset);
	                vec3 uvw;
                    uvw.xy = uv - flowVector * (progress + flowOffset);
                    uvw.xy *= tiling;
                    uvw.xy += phaseOffset;
                    uvw.xy += (time - progress) * jump;
                    uvw.z = 1. - abs(1. - 2. * progress);
                    return uvw;
                }
                vec3 UnpackDerivativeHeight (vec4 textureData) {
                    vec3 dh = textureData.agb;
                    dh.xy = dh.xy * 2. - 1.;
                    return dh;
                }
        
                float shineDamper = 50.;
                float reflectivity = 0.45;
                void main() {
                   
                    vec4 worldPosition = modelMatrix * vec4( vPos, 1.0 );
                    vec3 sunToPlayer = normalize(sunPosition - playerPosition); 
                    vec3 worldToEye = vec3(playerPosition.x + sunToPlayer.x * 10., playerPosition.y, playerPosition.z + sunToPlayer.z * 10.)-worldPosition.xyz;
                    
                    vec3 eyeDirection = normalize( worldToEye );
                    vec2 uv = worldPosition.xz * 0.05;

                    vec2 flowmap = texture2D(flowmapTexture, uv / 5.).rg * 2. - 1.;
                    flowmap *= uFlowStrength;
                    float noise = texture2D(flowmapTexture, uv).a;
			        float time = uTime * uSpeed + noise;
                    vec2 jump = vec2(uUJump, uVJump);
                    vec3 uvwA = FlowUVW(uv, flowmap, jump, uFlowOffset, uTiling, time, false);
                    vec3 uvwB = FlowUVW(uv, flowmap, jump, uFlowOffset, uTiling, time, true);

                    vec3 dhA = UnpackDerivativeHeight(texture2D(waterDerivativeHeightTexture, uvwA.xy)) * uvwA.z * 1.5;
                    vec3 dhB = UnpackDerivativeHeight(texture2D(waterDerivativeHeightTexture, uvwB.xy)) * uvwB.z * 1.5;
                    vec3 surfaceNormal = normalize(vec3(-(dhA.xy + dhB.xy), 1.));

                    vec3 fromSunVector = worldPosition.xyz - (sunPosition + playerPosition);
                    vec3 reflectedLight = reflect(normalize(fromSunVector), surfaceNormal);
                    float specular = max(dot(reflectedLight, eyeDirection), 0.0);
                    specular = pow(specular, shineDamper);
                    vec3 specularHighlight = vec3(0.6,0.6,0.6) * specular * reflectivity;
                       
                    vec4 texA = texture2D(waterNoiseTexture, uvwA.xy) * uvwA.z;
                    vec4 texB = texture2D(waterNoiseTexture, uvwB.xy) * uvwB.z;

                    

                    gl_FragColor = (texA + texB + vec4(0., 0.7, 0.9, 0.)) * vec4(0., 0.3, 0.6, 0.8);
                    gl_FragColor += vec4( specularHighlight, 0.0 );
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
            waterMaterial.uniforms.uTime.value = timestamp / 1000;
            waterMaterial.uniforms.playerPosition.value.copy(localPlayer.position);
            waterMaterial.uniforms.playerDirection.value.copy(playerDir);
            
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
                    gl_FragColor = vec4(0.0, 0.3, 0.6, 0.3);
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


