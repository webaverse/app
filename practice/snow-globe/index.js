import * as THREE from 'three';
import metaversefile from 'metaversefile';


const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useActivate} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 
const textureLoader = new THREE.TextureLoader()
const waterNormalTexture1 = textureLoader.load(`${baseUrl}/textures/waterNormal2.png`)
const waterNormalTexture2 = textureLoader.load(`${baseUrl}/textures/waterNormal3.png`)
waterNormalTexture1.wrapS = waterNormalTexture1.wrapT = THREE.RepeatWrapping;
waterNormalTexture2.wrapS = waterNormalTexture2.wrapT = THREE.RepeatWrapping;

export default () => {  

    const app = useApp();
    let snowGlobe = null;
    let riverMesh = null;
    const physics = usePhysics();
    const physicsIds = [];
    (async () => {
        const u = `${baseUrl}/snowGlobe.glb`;
        snowGlobe = await new Promise((accept, reject) => {
            const {gltfLoader} = useLoaders();
            gltfLoader.load(u, accept, function onprogress() {}, reject);
            
        });
        snowGlobe.scene.traverse(o => { 
          if (o.isMesh && o.name === 'river_seperated') {
            console.log(o);
            o.castShadow = true;
            o.receiveShadow = true;
            riverMesh = o;
            
            riverMesh.frustumCulled = false;
            o.material= new THREE.ShaderMaterial({
                uniforms: {
                    uTime: {
                        value: 0,
                    },
                    waterNormalTexture1: {
                        value:waterNormalTexture1
                    },
                    waterNormalTexture2: {
                        value:waterNormalTexture2
                    },
                    sunColor: {
                        value:new THREE.Vector3(1.0, 1.0, 1.0)
                    },
                    sunDirection: {
                        value:new THREE.Vector3(0, -1000, 600)
                    },
                    waterColor: {
                        value:new THREE.Vector3(0., 0.3, 0.5)
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
                        
                        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                        gl_Position = projectionMatrix * mvPosition;
                        ${THREE.ShaderChunk.logdepthbuf_vertex}
                    }
                `,
                fragmentShader: `\
                    ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                    uniform mat4 modelMatrix;
                    uniform float uTime;
                    uniform vec3 sunColor;
                    uniform vec3 sunDirection;
                    uniform vec3 waterColor;

                    varying vec2 vUv;
                    varying vec3 vPos;

                    uniform sampler2D waterNormalTexture1;
            	    uniform sampler2D waterNormalTexture2;

                    vec4 getNoise( vec2 uv ) {
                        vec2 uv0 = ( uv / 103.0 ) + vec2(uTime / 17.0, uTime / 29.0);
                        vec2 uv1 = uv / 107.0-vec2( uTime / -19.0, uTime / 31.0 );
                        vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( uTime / 101.0, uTime / 97.0 );
                        vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( uTime / 109.0, uTime / -113.0 );
                        vec4 noise = texture2D( waterNormalTexture1, uv0 ) +
                            texture2D( waterNormalTexture1, uv1 ) +
                            texture2D( waterNormalTexture2, uv2 ) +
                            texture2D( waterNormalTexture2, uv3 );
                        return noise * 0.5 - 1.0;
                    }
                    void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
                        vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
                        float direction = max( 0.0, dot( eyeDirection, reflection ) );
                        specularColor += pow( direction, shiny ) * sunColor * spec;
                        diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
                    }
                   
                    void main() {
                        
                        vec4 worldPosition = modelMatrix * vec4( vPos, 1.0 );
					    
                        vec4 noise = getNoise( worldPosition.xz * 1.0 );
				        vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

                        vec3 diffuseLight = vec3(1.0);
                        vec3 specularLight = vec3(0.0364, 0.866, 0.910);
                        vec3 worldToEye = cameraPosition-worldPosition.xyz;
                        vec3 eyeDirection = normalize( worldToEye );

                        sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );
                        
                        float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
                        float rf0 = 0.3;
                        float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
                        vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) * 0.5 ) * waterColor;
                        vec3 albedo = sunColor * diffuseLight * 0.15 + scatter;
                        vec3 outgoingLight = albedo;
                        gl_FragColor = vec4( outgoingLight, 0.5 ) * vec4(0., 0.6, 1.0, 1.0) * 2.;
                        gl_FragColor.rgb *= 3.;
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                    }
                `,
                side: THREE.DoubleSide,
                transparent: true,
                depthWrite: false,
                //blending: THREE.AdditiveBlending,
            });
          }
        });
        app.add(snowGlobe.scene);
        let physicsId;
        physicsId = physics.addGeometry(snowGlobe.scene);
        physicsIds.push(physicsId)
        
        app.updateMatrixWorld();


    })();

    
    

    useFrame(({timestamp}) => {
      if(riverMesh){
        riverMesh.material.uniforms.uTime.value = timestamp / 2000;
      }
      app.updateMatrixWorld();
    });

    
    useCleanup(() => {
      for (const physicsId of physicsIds) {
        physics.removeGeometry(physicsId);
      }
    });

    return app;
}