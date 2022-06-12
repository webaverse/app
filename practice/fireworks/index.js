import * as THREE from 'three';
import metaversefile from 'metaversefile';


const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useActivate, useInternals} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 
const textureLoader = new THREE.TextureLoader();
const sphereTexture = textureLoader.load(`${baseUrl}/textures/sphere2.png`);

export default () => {  
    const app = useApp();
    const { renderer, camera } = useInternals();
    const explosionPoint = new THREE.Vector3();
    //################################################################ tail ###########################################################
    {
        const particleCount = 10;
        const group=new THREE.Group();
        let info = {
            velocity: [particleCount],
        }
        let acc = new THREE.Vector3(0, -0.0015, 0);

        const _getGeometry = geometry => {
            //console.log(geometry)
            const geometry2 = new THREE.BufferGeometry();
            ['position', 'normal', 'uv'].forEach(k => {
            geometry2.setAttribute(k, geometry.attributes[k]);
            });
            geometry2.setIndex(geometry.index);
            
            const positions = new Float32Array(particleCount * 3);
            const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
            geometry2.setAttribute('positions', positionsAttribute);
            // const quaternions = new Float32Array(particleCount * 4);
            // for (let i = 0; i < particleCount; i++) {
            //   identityQuaternion.toArray(quaternions, i * 4);
            // }
            // const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
            // geometry2.setAttribute('quaternions', quaternionsAttribute);

            const scales = new Float32Array(particleCount);
            const scalesAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scalesAttribute);

            const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            opacityAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('opacity', opacityAttribute);

            // const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            // brokenAttribute.setUsage(THREE.DynamicDrawUsage);
            // geometry2.setAttribute('broken', brokenAttribute);
        
            return geometry2;
        };

        const material= new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                cameraBillboardQuaternion: {
                    value: new THREE.Quaternion(),
                },
                sphereTexture: {
                    value: sphereTexture,
                },
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
                
                uniform float uTime;
                uniform vec4 cameraBillboardQuaternion;
                
                
                varying vec2 vUv;
                varying vec3 vPos;

                attribute vec3 positions;
                attribute float scales;
                attribute float opacity;

                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }
                void main() {
                    vUv = uv;
                    vPos = position;

                    vec3 pos = position;
                    pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                    pos*=scales;
                    pos+=positions;
                    //pos = qtransform(pos, quaternions);
                    //pos.y=cos(uTime/100.);
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
                uniform sampler2D sphereTexture;
                varying vec2 vUv;
                varying vec3 vPos;

                void main() {
                    vec4 sphere = texture2D(
                                    sphereTexture,
                                    vUv
                    );
                    gl_FragColor = sphere;
                    gl_FragColor.rgb *= vec3(0.960, 0.409, 0.0672);
                    
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            //blending: 1,

        });
        let mesh = null;
        function addInstancedMesh() {
            const geometry2 = new THREE.PlaneGeometry( 2.5, 2.5 );
            const geometry = _getGeometry(geometry2);
            mesh = new THREE.InstancedMesh(geometry, material, particleCount);
            const positionsAttribute = mesh.geometry.getAttribute('positions');
            for (let i = 0; i < particleCount; i++) {
                positionsAttribute.setXYZ(i, 0, 1000, 0);
                info.velocity[i] = new THREE.Vector3();
                
            }
            positionsAttribute.needsUpdate = true;
            // group.add(mesh);
            // app.add(group);
            app.add(mesh);
        }
        addInstancedMesh();
            

            

        
        
        let currentIndex = 0;
        let startPoint = new THREE.Vector3();
        let delay = Math.random();
        useFrame(({timestamp}) => {
            if (mesh) {
                if(currentIndex >= particleCount)
                    currentIndex = 0;
                const opacityAttribute = mesh.geometry.getAttribute('opacity');
                const positionsAttribute = mesh.geometry.getAttribute('positions');
                const scalesAttribute = mesh.geometry.getAttribute('scales');
                for (let i = 0; i < particleCount; i++) {
                    
                    if(positionsAttribute.getY(i) > 150 + startPoint.y){
                        
                        if(i === 0){
                            explosionPoint.set(startPoint.x, 150 + startPoint.y, startPoint.z);
                            startPoint.set((Math.random() - 0.5) * 150, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 150);
                            const speed = Math.random();
                            for (let i = 0; i < particleCount; i++) {
                                info.velocity[i].x = 0;
                                info.velocity[i].y = (20 - (i / 5)) * (2 + speed);
                                info.velocity[i].z = 0;
                                info.velocity[i].divideScalar(20);
            
                                positionsAttribute.setXYZ(i, 0 + startPoint.x, 0, 0 + startPoint.z);
                                opacityAttribute.setX(i, 1);
                                scalesAttribute.setX(i, 1 - ((i / 1) * 0.1));
                            }
                        }
                        else{
                            //scalesAttribute.setX(i, 0.001);
                        }
                        
                    }

                    if(positionsAttribute.getY(i) <= 150 + startPoint.y){
                        positionsAttribute.setXYZ(  i, 
                                                    positionsAttribute.getX(i)+info.velocity[i].x,
                                                    positionsAttribute.getY(i)+info.velocity[i].y,
                                                    positionsAttribute.getZ(i)+info.velocity[i].z
                                                );
                        //scalesAttribute.setX(i, scalesAttribute.getX(i)-0.015);
                        opacityAttribute.setX(i, opacityAttribute.getX(i)-0.005);
                        //info.velocity[currentIndex].y += currentIndex / 50;
                        //info.velocity[i].add(acc);
                    }
                    

                }
                
                
                mesh.instanceMatrix.needsUpdate = true;
                positionsAttribute.needsUpdate = true;
                opacityAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
                
                
                mesh.material.uniforms.uTime.value=timestamp/1000;
                mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
                currentIndex++;

            }
            app.updateMatrixWorld();
        
        });
    }
    //################################################################ fireworks ###########################################################
    {
        const particleCount = 500;
        const group=new THREE.Group();
        let info = {
            velocity: [particleCount],
        }
        let acc = new THREE.Vector3(0, -0.0015, 0);

        const _getGeometry = geometry => {
            //console.log(geometry)
            const geometry2 = new THREE.BufferGeometry();
            ['position', 'normal', 'uv'].forEach(k => {
            geometry2.setAttribute(k, geometry.attributes[k]);
            });
            geometry2.setIndex(geometry.index);
            
            const positions = new Float32Array(particleCount * 3);
            const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
            geometry2.setAttribute('positions', positionsAttribute);

            const color = new Float32Array(particleCount * 3);
            const colorAttribute = new THREE.InstancedBufferAttribute(color, 3);
            geometry2.setAttribute('color', colorAttribute);
            // const quaternions = new Float32Array(particleCount * 4);
            // for (let i = 0; i < particleCount; i++) {
            //   identityQuaternion.toArray(quaternions, i * 4);
            // }
            // const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
            // geometry2.setAttribute('quaternions', quaternionsAttribute);

            const scales = new Float32Array(particleCount);
            const scalesAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scalesAttribute);

            const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            opacityAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('opacity', opacityAttribute);

            const startTimeAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            startTimeAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('startTime', startTimeAttribute);
        
            const flickerAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            flickerAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('flicker', flickerAttribute);

            return geometry2;
        };

        const material= new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                cameraBillboardQuaternion: {
                    value: new THREE.Quaternion(),
                },
                sphereTexture: {
                    value: sphereTexture,
                },
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
                
                uniform float uTime;
                uniform vec4 cameraBillboardQuaternion;
                
                
                varying vec2 vUv;
                varying vec3 vPos;
                varying vec3 vColor;
                varying float vOpacity;
                varying float vFlicker;
                

                attribute vec3 positions;
                attribute vec3 color;
                attribute float scales;
                attribute float opacity;
                attribute float flicker;
                

                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }
                void main() {
                    vUv = uv;
                    vPos = position;
                    vOpacity = opacity;
                    vColor = color;
                    vFlicker = flicker;
                    vec3 pos = position;
                    pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                    pos*=scales;
                    pos+=positions;
                    //pos = qtransform(pos, quaternions);
                    //pos.y=cos(uTime/100.);
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
                uniform sampler2D sphereTexture;
                varying vec2 vUv;
                varying vec3 vPos;
                varying vec3 vColor;
                varying float vOpacity;
                varying float vFlicker;

                void main() {
                    vec4 sphere = texture2D(
                                    sphereTexture,
                                    vUv
                    );
                    gl_FragColor = sphere;
                    gl_FragColor.rgb *= vec3(vColor.x / (1. + vOpacity), vColor.y / (1. + vOpacity), vColor.z / (1. + vOpacity));
                    gl_FragColor.a *= vFlicker;
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            //blending: 1,

        });
        let mesh = null;
        function addInstancedMesh() {
            const geometry2 = new THREE.PlaneGeometry( 2.5, 2.5 );
            const geometry = _getGeometry(geometry2);
            mesh = new THREE.InstancedMesh(geometry, material, particleCount);
            const positionsAttribute = mesh.geometry.getAttribute('positions');
            for (let i = 0; i < particleCount; i++) {
                positionsAttribute.setXYZ(i, 0, 1000, 0);
                info.velocity[i] = new THREE.Vector3();
                
            }
            positionsAttribute.needsUpdate = true;
            // group.add(mesh);
            // app.add(group);
            app.add(mesh);
        }
        addInstancedMesh();
            

            

        
        
        let currentIndex = 0;
        let lastXxplosionPointX = 1000;
        let lastXxplosionPointY = 1000;
        let lastXxplosionPointZ = 1000;
        let color = new THREE.Vector3(0.5 + Math.random() * 0.5, Math.random(), 0.5 + Math.random() * 0.5);
        useFrame(({timestamp}) => {
            if (mesh) {
                if(currentIndex >= 5)
                    currentIndex = 0;
                const opacityAttribute = mesh.geometry.getAttribute('opacity');
                const flickerAttribute = mesh.geometry.getAttribute('flicker');
                const positionsAttribute = mesh.geometry.getAttribute('positions');
                const scalesAttribute = mesh.geometry.getAttribute('scales');
                const startTimeAttribute = mesh.geometry.getAttribute('startTime');
                const colorAttribute = mesh.geometry.getAttribute('color');
                if(lastXxplosionPointX !== explosionPoint.x && lastXxplosionPointY !== explosionPoint.y && lastXxplosionPointZ !== explosionPoint.z){
                    lastXxplosionPointX = explosionPoint.x; 
                    lastXxplosionPointY = explosionPoint.y; 
                    lastXxplosionPointZ = explosionPoint.z;
                    color.set(0.5 + Math.random() * 0.5, Math.random(), 0.5 + Math.random() * 0.5);
                    for(let i = currentIndex * 100; i < currentIndex * 100 + 100; i++){
                        const theta = THREE.Math.randFloatSpread(360); 
                        const phi = THREE.Math.randFloatSpread(360);
                        info.velocity[i].x = 10 * Math.sin(theta) * Math.cos(phi);
                        info.velocity[i].y = 10 * Math.sin(theta) * Math.sin(phi);
                        info.velocity[i].z = 10 * Math.cos(theta);
                        info.velocity[i].divideScalar(20);
                        positionsAttribute.setXYZ(i, explosionPoint.x, explosionPoint.y, explosionPoint.z);
                        colorAttribute.setXYZ(i, color.x, color.y, color.z);
                        startTimeAttribute.setX(i, 1);
                        scalesAttribute.setX(i, Math.random());
                        opacityAttribute.setX(i, 0);
                        flickerAttribute.setX(i, 1);

                    }
                    currentIndex++;

                }
                for (let i = 0; i < particleCount; i++){
                    if(startTimeAttribute.getX(i) > 0){
                        positionsAttribute.setXYZ(  i, 
                                                    positionsAttribute.getX(i)+info.velocity[i].x,
                                                    positionsAttribute.getY(i)+info.velocity[i].y,
                                                    positionsAttribute.getZ(i)+info.velocity[i].z
                        );
                        startTimeAttribute.setX(i, startTimeAttribute.getX(i) - 0.02);
                    }
                    else{
                        //if(opacityAttribute.getX(i) > 0){
                            opacityAttribute.setX(i, opacityAttribute.getX(i) + 0.1);
                            flickerAttribute.setX(i, Math.random());
                        //}
                    }
                }
                
                
                mesh.instanceMatrix.needsUpdate = true;
                positionsAttribute.needsUpdate = true;
                opacityAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
                startTimeAttribute.needsUpdate = true;
                flickerAttribute.needsUpdate = true;
                colorAttribute.needsUpdate = true;
                
                
                mesh.material.uniforms.uTime.value=timestamp/1000;
                mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
                

            }
            app.updateMatrixWorld();
        
        });
    }
    return app;
}