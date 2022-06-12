import * as THREE from 'three';
import metaversefile from 'metaversefile';


const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useActivate, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 
const textureLoader = new THREE.TextureLoader()
const gradientNoiseTexture = textureLoader.load(`${baseUrl}/textures/gradientNoise.jpg`);
const voronoiNoiseTexture = textureLoader.load(`${baseUrl}/textures/voronoiNoise.jpg`);
const flameTexture = textureLoader.load(`${baseUrl}/textures/flame1.png`);
gradientNoiseTexture.wrapS = gradientNoiseTexture.wrapT = THREE.RepeatWrapping;
voronoiNoiseTexture.wrapS = voronoiNoiseTexture.wrapT = THREE.RepeatWrapping;
export default () => {  

    const app = useApp();
    const { renderer, camera } = useInternals();
    //################################################### glb #########################################################
    {
        let campFire = null;
        const physics = usePhysics();
        const physicsIds = [];
        (async () => {
            const u = `${baseUrl}/assets/campFire.glb`;
            campFire = await new Promise((accept, reject) => {
                const {gltfLoader} = useLoaders();
                gltfLoader.load(u, accept, function onprogress() {}, reject);
                
            });
            
            app.add(campFire.scene);
            let physicsId;
            physicsId = physics.addGeometry(campFire.scene);
            physicsIds.push(physicsId)
            app.updateMatrixWorld();
    
    
        })();
    
        
        
    
        // useFrame(( { timeStamp } ) => {
        //   if(prop){
        //     prop.rotation.x = -1.570799097288404; 
        //     prop.rotation.y += -1.4884504324181542; 
        //     prop.rotation.z = -3.141592653589793; 
        //   }
        //   app.updateMatrixWorld();
        // });
    
        
        useCleanup(() => {
          for (const physicsId of physicsIds) {
            physics.removeGeometry(physicsId);
          }
        });
    }
    //############################################################## fire #########################################################
    {
        const material= new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                cameraBillboardQuaternion: {
                    value: new THREE.Quaternion(),
                },
                gradientNoiseTexture:{
                    value: gradientNoiseTexture,
                },
                voronoiNoiseTexture:{
                    value: voronoiNoiseTexture,
                },
                flameTexture:{
                    value: flameTexture,
                },
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
                
                uniform float uTime;
                uniform vec4 cameraBillboardQuaternion;
                
                
                varying vec2 vUv;
                varying vec3 vPos;
                
                
                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }
                void main() {
                    vUv = uv;
                    vPos = position;
                    
                    vec3 pos = position;
                    pos = rotateVecQuat(pos, cameraBillboardQuaternion);
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
                uniform sampler2D gradientNoiseTexture;
                uniform sampler2D voronoiNoiseTexture;
                uniform sampler2D flameTexture;
                varying vec2 vUv;
                varying vec3 vPos;
                
                void main() {
                    vec4 gradientNoise = texture2D(
                                            gradientNoiseTexture,
                                            vec2(
                                                vUv.x,
                                                mod(0.5*vUv.y+uTime*0.5,1.)
                                            )
                    );
                    vec4 voronoiNoise = texture2D(
                                            voronoiNoiseTexture,
                                            vec2(
                                                mod(0.25*vUv.x+uTime*0.15,1.),
                                                mod(0.5*vUv.y+uTime*0.5,1.)
                                            )
                    );
                    vec4 flame = texture2D(
                                            flameTexture,
                                            mix(vec2(vUv.x,vUv.y),gradientNoise.rg,0.2)
                    );
                    float powNum = 6.5;
                    voronoiNoise = vec4(pow(voronoiNoise.r, powNum), pow(voronoiNoise.g, powNum), pow(voronoiNoise.b, powNum), voronoiNoise.a);
                    voronoiNoise *= gradientNoise * flame;

                    gl_FragColor = voronoiNoise * 7.5 * vec4(0.960, 0.290, 0.0672, 1.0);
                    
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            //blending: 1,

        });
        const geometry = new THREE.PlaneGeometry( 2.5, 2.5 );
        const fire = new THREE.Mesh( geometry, material );
        app.add( fire );
        fire.position.y = 1.25;

        useFrame(({timestamp}) => {
            material.uniforms.uTime.value=-timestamp/1000;
            material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
            app.updateMatrixWorld();
        });
    }
    

    return app;
}