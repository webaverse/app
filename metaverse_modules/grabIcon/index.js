import * as THREE from 'three';

import metaversefile from '../../metaversefile-api.js';
import {WebaverseShaderMaterial} from '../../materials.js';
const {useApp, useCleanup, useFrame, useInternals, useLoaders, usePhysics, useLocalPlayer} = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');


const textureLoader = new THREE.TextureLoader();
const rIconTexture = textureLoader.load(`${baseUrl}/textures/rIcon.png`);
const eIconTexture = textureLoader.load(`${baseUrl}/textures/eIcon.png`);
const cIconTexture = textureLoader.load(`${baseUrl}/textures/cIcon.png`);
const fIconTexture = textureLoader.load(`${baseUrl}/textures/fIcon.png`);
const pushIconTexture = textureLoader.load(`${baseUrl}/textures/pushIcon.png`);
const pullIconTexture = textureLoader.load(`${baseUrl}/textures/pullIcon.png`);
const leftRotateIconTexture = textureLoader.load(`${baseUrl}/textures/left_rotate_icon.png`);
const rightRotateIconTexture = textureLoader.load(`${baseUrl}/textures/right_rotate_icon.png`);
// const trapezoidTexture = textureLoader.load(`${baseUrl}/textures/trapezoid.png`);

export default () => {
  const app = useApp();
  const {camera} = useInternals();
  const localPlayer = useLocalPlayer();
  app.targetApp = null;
  {

    const _getGeometry = (geometry, attributeSpecs, particleCount) => {
        const geometry2 = new THREE.BufferGeometry();
        ['position', 'normal', 'uv'].forEach(k => {
        geometry2.setAttribute(k, geometry.attributes[k]);
        });
        geometry2.setIndex(geometry.index);
    
        const positions = new Float32Array(particleCount * 3);
        const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
        geometry2.setAttribute('positions', positionsAttribute);
    
        for(const attributeSpec of attributeSpecs){
            const {
                name,
                itemSize,
            } = attributeSpec;
            const array = new Float32Array(particleCount * itemSize);
            geometry2.setAttribute(name, new THREE.InstancedBufferAttribute(array, itemSize));
        }
    
        return geometry2;
    };
    const particleCount = 8;
    const attributeSpecs = [];
    attributeSpecs.push({name: 'scales', itemSize: 1});
    attributeSpecs.push({name: 'id', itemSize: 1});
   
    const geometry2 = new THREE.PlaneBufferGeometry(0.25, 0.25);
    const geometry = _getGeometry(geometry2, attributeSpecs, particleCount);
    const posAttribute = geometry.getAttribute('positions');
    const scAttribute = geometry.getAttribute('scales');
    const idAttribute = geometry.getAttribute('id');
    for(let i = 0; i < particleCount; i++){
        scAttribute.setX(i, 0.6 + Math.random());
        idAttribute.setX(i, i);
        if (i < 1) {
            posAttribute.setXYZ(i, 0.5, -0.1, 0);
        }
        else if (i < 2) {
            posAttribute.setXYZ(i, -0.5, -0.1, 0);
        }
        else if (i < 3) {
            posAttribute.setXYZ(i, 0.2, 0, 0);
        }
        else if (i < 4) {
            posAttribute.setXYZ(i, -0.2, 0, 0);
        }
        else if (i < 5) {
            posAttribute.setXYZ(i, 0.8, -0.5, 0);
        }
        else if (i < 6) {
            posAttribute.setXYZ(i, 0.8, -0.8, 0);
        }
        else if (i < 7) {
            posAttribute.setXYZ(i, 1.1, -0.5, 0);
        }
        else if (i < 8) {
            posAttribute.setXYZ(i, 1.1, -0.8, 0);
        }
    }
    scAttribute.needsUpdate = true;
    idAttribute.needsUpdate = true;
    posAttribute.needsUpdate = true;

    const material = new THREE.ShaderMaterial({
        uniforms: {
            rIconTexture: {
                value: rIconTexture
            },
            eIconTexture: {
                value: eIconTexture
            },
            leftRotateIconTexture: {
                value: leftRotateIconTexture
            },
            rightRotateIconTexture: {
                value: rightRotateIconTexture
            },

            cIconTexture: {
                value: cIconTexture
            },
            fIconTexture: {
                value: fIconTexture
            },
            pushIconTexture: {
                value: pushIconTexture
            },
            pullIconTexture: {
                value: pullIconTexture
            },
            
        },
        vertexShader: `
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            attribute float scales;
            attribute float id;
            attribute vec3 positions;
            
            varying vec2 vUv;
            // varying vec3 vPos;
            varying float vId;

            void main() {  
                
                vUv = uv;
                vId = id;
                // vPos = position;
                vec3 pos = position;
                // pos *= scales;
                pos += positions;
                
                vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
                gl_Position = projectionPosition;
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `,
        fragmentShader: `
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            uniform sampler2D rIconTexture;
            uniform sampler2D eIconTexture;
            uniform sampler2D leftRotateIconTexture;
            uniform sampler2D rightRotateIconTexture;
            uniform sampler2D cIconTexture;
            uniform sampler2D fIconTexture;
            uniform sampler2D pushIconTexture;
            uniform sampler2D pullIconTexture;
            
            
            varying vec2 vUv;
            // varying vec3 vPos;
            varying float vId;

            void main() {
                
                vec4 rIcon = texture2D(rIconTexture, vUv);
                vec4 eIcon = texture2D(eIconTexture, vUv); 
                vec4 leftRotateIcon = texture2D(leftRotateIconTexture, vUv); 
                vec4 rightRotateIcon = texture2D(rightRotateIconTexture, vUv); 
                vec4 cIcon = texture2D(cIconTexture, vUv);
                vec4 fIcon = texture2D(fIconTexture, vUv);
                vec4 pushIcon = texture2D(pushIconTexture, vUv);
                vec4 pullIcon = texture2D(pullIconTexture, vUv);
                gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                if (vId < 0.5) {
                    gl_FragColor = rightRotateIcon;
                    gl_FragColor -= vec4(0.1, 0.1, 0.1, 0.);
                }
                else if (vId < 1.5) {
                    gl_FragColor = leftRotateIcon;
                    gl_FragColor -= vec4(0.1, 0.1, 0.1, 0.);
                }
                else if (vId < 2.5) {
                    gl_FragColor = eIcon;
                }
                else if (vId < 3.5) {
                    gl_FragColor = rIcon;
                }
                else if (vId < 4.5) {
                    gl_FragColor = fIcon;
                }
                else if (vId < 5.5) {
                    gl_FragColor = cIcon;
                }
                else if (vId < 6.5) {
                    gl_FragColor = pushIcon;
                    // if(gl_FragColor.a > 0.)
                    //     gl_FragColor += vec4(0.1, 0.1, 0.1, 0.);
                }
                else if (vId < 7.5) {
                    gl_FragColor = pullIcon;
                    // if(gl_FragColor.a > 0.)
                    //     gl_FragColor += vec4(0.1, 0.1, 0.1, 0.);
                }
                // if(gl_FragColor.a > 0.)
                //         gl_FragColor += vec4(0.2, 0.2, 0.2, 0.);
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                
            }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        // blending: THREE.AdditiveBlending,
    });
    const plane = new THREE.InstancedMesh(geometry, material, particleCount);
    const group = new THREE.Group();
    group.add(plane);
    app.add(group);

    let lastTargetApp = null;
    let maxY = null;

    useFrame(({timestamp}) => {
        if(app.targetApp && app.physicsMesh) {
            if (app.targetApp !== lastTargetApp) {
                // console.log(app.targetApp);
                // console.log(app.physicsMesh);
                if (!app.physicsMesh?.geometry.boundingBox) {
                    app.physicsMesh.geometry.computeBoundingBox();
                }
            }
            
            if (app.targetApp && app.physicsMesh) {
                // console.log(app.targetApp, app.physicsMesh);
                if(!maxY) maxY = app.physicsMesh.geometry.boundingBox.max.y - app.physicsMesh.position.y;
                group.rotation.copy(camera.rotation);
                app.position.copy(app.targetApp.position);
                app.position.y += maxY;
                app.targetApp.updateMatrixWorld();
                app.updateMatrixWorld();
            } else if (!app.targetApp && maxY) {
                maxY = null;
            }
            lastTargetApp = app.targetApp;
        }
    });

    useCleanup(() => {
        console.log('cleanup');
    });
  }

  app.setComponent('renderPriority', 'low');
  
  return app;
};
