import * as THREE from 'three';
import { Water } from './Water.js';
import { Water2 } from './Water2.js';
import metaversefile from 'metaversefile';


const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useActivate, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 
const textureLoader = new THREE.TextureLoader()
const waterNormalTexture1 = textureLoader.load(`${baseUrl}/textures/waterNormal2.png`)
const waterNormalTexture2 = textureLoader.load(`${baseUrl}/textures/waterNormal3.png`)
waterNormalTexture1.wrapS = waterNormalTexture1.wrapT = THREE.RepeatWrapping;
waterNormalTexture2.wrapS = waterNormalTexture2.wrapT = THREE.RepeatWrapping;

export default () => {  

    const app = useApp();
    const localPlayer = useLocalPlayer();
    const {renderer, camera} = useInternals();
    let pool = null;
    let water = null;
    let poolWater = null;
    let caustic = null;

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
                localVector.set(localPlayer.position.x, localPlayer.position.y - localPlayer.avatar.height, localPlayer.position.z);
                raycaster.set(localVector, upVector);
                intersect = raycaster.intersectObject(water)
                if (intersect.length > 0 && intersect[0].distance > localPlayer.avatar.height / 1.2) {
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
                else if(intersect.length > 0 && intersect[0].distance <= localPlayer.avatar.height / 1.2){
                    if(localPlayer.hasAction('swim'))
                        localPlayer.getAction('swim').onSurface = true;
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
        const physics = usePhysics();
        const physicsIds = [];
        (async () => {
            const u = `${baseUrl}/pool.glb`;
            pool = await new Promise((accept, reject) => {
                const {gltfLoader} = useLoaders();
                gltfLoader.load(u, accept, function onprogress() {}, reject);
                
            });
            
            pool.scene.scale.set(0.02,0.02,0.02);
            pool.scene.position.y = 5;
            app.add(pool.scene);
            let physicsId;
            physicsId = physics.addGeometry(pool.scene);
            physicsIds.push(physicsId)

            createPoolWater();
            app.updateMatrixWorld();

    
    
        })();
        
        const geometry = new THREE.PlaneGeometry( 13, 10);
        const causticMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
        
                uniform float uTime;
                
                varying vec2 vUv;
                varying vec3 vPos;
                
                void main() {
                    vUv = uv;
                    vPos = position;
                    
                    vec3 pos = position;
                    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                    vec4 viewPosition = viewMatrix * modelPosition;
                    vec4 projectionPosition = projectionMatrix * viewPosition;
            
                    gl_Position = projectionPosition;
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }
            `,
            fragmentShader: `\
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vPos;
               
                float h12(vec2 p)
                {
                    return fract(sin(dot(p,vec2(32.52554,45.5634)))*12432.2355);
                }
                
                float n12(vec2 p)
                {
                    vec2 i = floor(p);
                    vec2 f = fract(p);
                    f *= f * (3.-2.*f);
                    return mix(
                        mix(h12(i+vec2(0.,0.)),h12(i+vec2(1.,0.)),f.x),
                        mix(h12(i+vec2(0.,1.)),h12(i+vec2(1.,1.)),f.x),
                        f.y
                    );
                }
                
                float caustics(vec2 p, float t)
                {
                    vec3 k = vec3(p,t);
                    float l;
                    mat3 m = mat3(-2,-1,2,3,-2,1,1,2,2);
                    float n = n12(p);
                    k = k*m*.5;
                    l = length(.5 - fract(k+n));
                    k = k*m*.4;
                    l = min(l, length(.5-fract(k+n)));
                    k = k*m*.3;
                    l = min(l, length(.5-fract(k+n)));
                    return pow(l,7.)*25.;
                }
                
                void main() {
                    vec2 p = vUv * 2.;
                    vec3 col = vec3(0.);
                    col = vec3(caustics(4.*p,uTime*.5));
                    gl_FragColor = vec4(col / 3.,1.0);
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            //side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            //blending: 1,

        });
        const createPoolWater = () =>{
            
            caustic = new THREE.Mesh(geometry, causticMaterial);
            caustic.position.y = -2.7;
            caustic.rotation.x = -Math.PI / 2;
            app.add( caustic );

            poolWater = new Water(
                geometry,
                {
                    textureWidth: 512,
                    textureHeight: 512,
                    waterNormals: waterNormalTexture1,
                    sunDirection: new THREE.Vector3(),
                    sunColor: 0xffffff,
                    waterColor: 0x001e0f,
                    distortionScale: 0.3,
                }
            );
            poolWater.position.y = -1;
            poolWater.rotation.x = - Math.PI / 2;
            app.add( poolWater );
    
            water = new Water(
                geometry,
                {
                    textureWidth: 512,
                    textureHeight: 512,
                    waterNormals: waterNormalTexture1,
                    sunDirection: new THREE.Vector3(),
                    sunColor: 0xffffff,
                    waterColor: 0x001e0f,
                    distortionScale: 0.3,
                    invisibleObject:caustic
                }
            );
            water.position.y = -1.001;
            water.rotation.x = Math.PI / 2;
            app.add( water );
    
        }
        
        

        
        
        
        
    
        useFrame(({timestamp}) => {
            if(water && poolWater && caustic){
                poolWater.material.uniforms.time.value = timestamp / 3000;
                water.material.uniforms.time.value = timestamp / 3000; 
                caustic.material.uniforms.uTime.value = timestamp / 3000;
            }
            
            
            app.updateMatrixWorld();
        });
    
        
        useCleanup(() => {
          for (const physicsId of physicsIds) {
            physics.removeGeometry(physicsId);
          }
        });
    }
    

    return app;
}