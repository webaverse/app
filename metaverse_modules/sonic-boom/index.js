import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useCameraManager, useLoaders, useInternals} = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

export default () => {
  const app = useApp();
  const localPlayer = app.getComponent('player') || useLocalPlayer();
  const cameraManager = useCameraManager();
  const {renderer, camera} = useInternals();
  let narutoRunTime = 0; 
  let lastStopSw = 0;

  const nameSpec = [
    'wave2',
    'wave20',
    'wave9',
    'electronic-ball2',
    'noise',
    'electricityTexture1',
    'electricityTexture2',
    'trail',
    'mask',
    'voronoiNoise',
  ]
  const particleTexture = [];
  const _loadAllTexture = async names => {
    for(const name of names){
        const texture = await new Promise((accept, reject) => {
            const {ktx2Loader} = useLoaders();
            const u = `${baseUrl}/textures/${name}.ktx2`;
            ktx2Loader.load(u, accept, function onProgress() {}, reject);
        });
        particleTexture.push(texture);
    }
  };
  _loadAllTexture(nameSpec);
  
  
  
    let currentDir = new THREE.Vector3();
    //################################################ trace narutoRun Time ########################################
    {
        let localVector = new THREE.Vector3();
        useFrame(() => {
            localVector.set(0, 0, -1);
            currentDir = localVector.applyQuaternion(localPlayer.quaternion);
            currentDir.normalize();
            if (localPlayer.hasAction('narutoRun')){
                    narutoRunTime ++;
                    lastStopSw = 1;
            }
            else{
                narutoRunTime = 0;
            }
            
        });
    }
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
    
    //################################################# front wave #################################################
    {

        const particleCount = 2;
        const attributeSpecs = [];
        attributeSpecs.push({name: 'id', itemSize: 1});
        const geometry2 = new THREE.SphereBufferGeometry(1.4, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.4);
        const geometry = _getGeometry(geometry2, attributeSpecs, particleCount);
        const idAttribute =  geometry.getAttribute('id');
        idAttribute.setX(0, 0);
        idAttribute.setX(1, 1);
        idAttribute.needsUpdate = true;

        const material = new THREE.ShaderMaterial({
            uniforms: {
              uTime: {
                type: "f",
                value: 0.0
              },
              color: {
                value: new THREE.Vector3(0.400, 0.723, 0.910)
              },
              strength: {
                value: 0.01
              },
              waveTexture: {
                type: "t",
                value: null
              },
              waveTexture2: {
                type: "t",
                value: null
              },
              
            },
            vertexShader: `\
                
              ${THREE.ShaderChunk.common}
              ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
             
              attribute float id;

              varying vec2 vUv;
              varying float vId;
              varying vec3 vPos;
      
              void main() {
                  vPos = position;
                  vUv = uv;
                  vId = id;
                  mat3 rotX =
                            mat3(1.0, 0.0, 0.0, 0.0, cos(PI / 2.), sin(PI / 2.), 0.0, -sin(PI / 2.), cos(PI / 2.));
                  vec3 pos = position;
                  if(pos.y >= 1.87){
                      pos = vec3(position.x * (sin((position.y - 0.6) * 1.27) - 0.16), position.y, position.z * (sin((position.y - 0.6) * 1.27) - 0.16));
                  } else{
                      pos = vec3(position.x * (sin((position.y / 2. - 0.01) * 0.11) + 0.75), position.y, position.z * (sin((position.y / 2. - 0.01) * 0.11) + 0.75));
                  }
                  pos *= rotX;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 ); 
                  ${THREE.ShaderChunk.logdepthbuf_vertex}
              }`,
            fragmentShader: `\
              ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
              varying vec2 vUv;
              varying float vId;
              varying vec3 vPos;

              uniform sampler2D waveTexture;
              uniform sampler2D waveTexture2;
              uniform vec3 color;
              uniform float strength;
              uniform float uTime;
          
              float pat(vec2 uv,float p,float q,float s,float glow){
                  float z = cos(p * uv.y / 0.5) + cos(q * uv.y / 2.2);
                  z += mod((uTime * 100.0 + uv.x + uv.y * s * 10.) * 0.5, 5.0);
                  float dist = abs(z) * (.1 / glow);
                  return dist;
              }
              void main() {
                  if(vId < 0.5){
                    vec3 noisetex = texture2D(waveTexture,vec2(vUv.x, mod(vUv.y + (20. * uTime), 1.))).rgb;    
                    gl_FragColor = vec4(noisetex.rgb, 1.0);
            
                    if(gl_FragColor.r >= 0.5){
                        gl_FragColor = vec4(color,(0.9 - vUv.y) / 3.);
                    }else{
                        gl_FragColor = vec4(0.,0.,1.,0.);
                    }
                    gl_FragColor *= vec4(sin(vUv.y) - strength);
                    gl_FragColor *= vec4(smoothstep(0.01, 0.928, vUv.y));
                    gl_FragColor.b *= 20.;
                    gl_FragColor.a *= 20.;
                  }
                  else{
                    vec2 uv = vPos.zy;
                    float d = pat(uv, 1.0, 2.0, 10.0, 0.35);		
                    vec3 col = color * 0.5/d;
                    vec4 fragColor = vec4(col,1.0);
      
                    vec3 noisetex = texture2D(
                      waveTexture2,
                      mod(1. * vec2(1. * vUv.x + uTime * 10., 1.5 * vUv.y + uTime * 10.), 1.)
                    ).rgb; 
      
                    gl_FragColor = vec4(noisetex.rgb, 1.0);
                  
                    if(gl_FragColor.r >= 0.1){
                    gl_FragColor = fragColor;
                    }else{
                      gl_FragColor = vec4(0., 0., 1., 0.);
                    }
                  
                    gl_FragColor *= vec4(sin(vUv.y) - strength);
                    gl_FragColor *= vec4(smoothstep(0.01, 0.928, vUv.y));
                    gl_FragColor.xyz /= 4.;
                    gl_FragColor.b *= 2.;
                    gl_FragColor.a *= 20.;
                  }
                  ${THREE.ShaderChunk.logdepthbuf_fragment}
              }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
  
            clipping: false,
            fog: false,
            lights: false,
        });
        const frontwave = new THREE.InstancedMesh(geometry, material, particleCount);
        // material.onBeforeCompile = () => {
        //     console.log('compile frontwave material')
        // }
        material.freeze();
        
        const group = new THREE.Group();
        group.add(frontwave);
        renderer.compile(group, camera)
        let sonicBoomInApp = false;
        useFrame(({timestamp}) => {
            
        
            if(narutoRunTime>10){
                //console.log('sonic-boom-frontwave');
                if(!sonicBoomInApp){
                    //console.log('add-frontWave');
                    app.add(group);
                    sonicBoomInApp = true;
                }
                
                group.position.copy(localPlayer.position);
                if (localPlayer.avatar) {
                    group.position.y -= localPlayer.avatar.height;
                    group.position.y += 0.65;
                }
                group.rotation.copy(localPlayer.rotation);
                
                group.position.x -= 0.6 * currentDir.x;
                group.position.z -= 0.6 * currentDir.z;

                group.scale.set(1, 1, 1);
                material.uniforms.uTime.value = timestamp / 5000;
                if(!material.uniforms.waveTexture.value)
                    material.uniforms.waveTexture.value = particleTexture[nameSpec.indexOf('wave2')];
                if(!material.uniforms.waveTexture2.value)
                    material.uniforms.waveTexture2.value = particleTexture[nameSpec.indexOf('wave20')];
            }
            else{
                if(sonicBoomInApp){
                    //console.log('remove-frontWave');
                    app.remove(group);
                    sonicBoomInApp=false;
                }
                //group.scale.set(0,0,0);
            }
        });
    }
    //########################################## wind #############################################
    {
        const group = new THREE.Group();
        const vertrun = `
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec3 pos = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `;

        const fragrun = `
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            varying vec2 vUv;
            uniform sampler2D perlinnoise;
            uniform float uTime;
            
            void main() {
                vec3 noisetex = texture2D(
                    perlinnoise,
                    vec2(
                        mod(1. * vUv.x + (2.), 1.),
                        mod(.5 * vUv.y + (40. * uTime), 1.)
                        
                    )
                ).rgb;      
                gl_FragColor = vec4(noisetex.rgb, 1.0);
                if(gl_FragColor.r >= 0.8){
                    gl_FragColor = vec4(vec3(1., 1., 1.), (0.9 - vUv.y) / 2.);
                }else{
                    gl_FragColor = vec4(0., 0., 1., 0.);
                }
                gl_FragColor *= vec4(smoothstep(0.2, 0.628, vUv.y));
                ${THREE.ShaderChunk.logdepthbuf_fragment}
            
                
            }
        `;
        
        
        const geometry = new THREE.CylinderBufferGeometry(0.5, 0.9, 5.3, 50, 50, true);
        const windMaterial = new THREE.ShaderMaterial({
            uniforms: {
                perlinnoise: {
                    type: "t",
                    value: null
                },
                uTime: {
                    type: "f",
                    value: 0.0
                },
            },
            // wireframe:true,
            vertexShader: vertrun,
            fragmentShader: fragrun,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,

            clipping: false,
            fog: false,
            lights: false,
        });
        windMaterial.freeze();
        const mesh = new THREE.Mesh(geometry, windMaterial);
        mesh.setRotationFromAxisAngle(new THREE.Vector3( 1, 0, 0 ), -90 * Math.PI / 180);
        group.add(mesh);
            
        // windMaterial.onBeforeCompile = () => {
        //     console.log('compile wind material')
        // }
        renderer.compile(group, camera)
        
        let sonicBoomInApp=false;
        useFrame(({timestamp}) => {
            
            if(narutoRunTime>10){
                //console.log('sonic-boom-wind');
                if(!sonicBoomInApp){
                    //console.log('add-wind');
                    app.add(group);
                    sonicBoomInApp = true;
                }
                group.position.copy(localPlayer.position);
                if (localPlayer.avatar) {
                    group.position.y -= localPlayer.avatar.height;
                    group.position.y += 0.65;
                }
                group.rotation.copy(localPlayer.rotation);
                group.position.x -= 2.2 * currentDir.x;
                group.position.z -= 2.2 * currentDir.z;
                group.scale.set(1, 1, 1);
                windMaterial.uniforms.uTime.value = timestamp / 10000;
                if(!windMaterial.uniforms.perlinnoise.value)
                    windMaterial.uniforms.perlinnoise.value = particleTexture[nameSpec.indexOf('wave2')];
            }
            else{
                if(sonicBoomInApp){
                    //console.log('remove-wind');
                    app.remove(group);
                    sonicBoomInApp=false;
                }
                //group.scale.set(0,0,0);
            }
            
            
            
            //app.updateMatrixWorld();

        });
    }

    //########################################## flame ##########################################
    {
        const particleCount = 2;
        const attributeSpecs = [];
        attributeSpecs.push({name: 'id', itemSize: 1});
        attributeSpecs.push({name: 'scales', itemSize: 1});
        const geometry2 = new THREE.CylinderBufferGeometry(0.5, 0.1, 4.5, 50, 50, true);
        const geometry = _getGeometry(geometry2, attributeSpecs, particleCount);
        const idAttribute = geometry.getAttribute('id');
        idAttribute.setX(0, 0);
        idAttribute.setX(1, 1);
        idAttribute.needsUpdate = true;

        const group = new THREE.Group();
        const flameMaterial = new THREE.ShaderMaterial({
            uniforms: {
                perlinnoise: {
                    type: "t",
                    value: null
                },
                color: {
                    value: new THREE.Vector3(0.120, 0.280, 1.920)
                },
                uTime: {
                    type: "f",
                    value: 0.0
                },
                playerRotation: {
                    value: new THREE.Vector3(localPlayer.rotation.y, localPlayer.rotation.y, localPlayer.rotation.y)
                },
                strength: {
                    type: "f",
                    value: 0.0
                },
                random: {
                    type: "f",
                    value: 0.0
                },
            },
            vertexShader: `\
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                attribute float id;

                varying vec2 vUv;
                varying float vId;

                uniform float uTime;
                uniform vec3 playerRotation;
                uniform float strength;
                uniform sampler2D perlinnoise;
                void main() {
                    vUv = uv * strength;
                    vId = id;
                    mat3 rotX =
                            mat3(1.0, 0.0, 0.0, 0.0, cos(PI / 2.), sin(PI / 2.), 0.0, -sin(PI / 2.), cos(PI / 2.));
                    vec3 pos = vec3(position.x,position.y,position.z);
                    vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*40.,vUv.x + uTime*1.),1.)).rgb;
                    if(pos.y >= 1.87){
                        pos = vec3(position.x*(sin((position.y - 0.64)*1.27)-0.12),position.y,position.z*(sin((position.y - 0.64)*1.27)-0.12));
                    } else{
                        pos = vec3(position.x*(sin((position.y/2. -  .01)*.11)+0.79),position.y,position.z*(sin((position.y/2. -  .01)*.11)+0.79));
                    }
                    mat3 rotZ;
                    
                    float ry=playerRotation.z;
                    
                    float lerp=mix(ry,playerRotation.x,pow(vUv.y,1.) / 1.);
                    
                    if(abs((ry / PI * 180.) - (playerRotation.x / PI * 180.)) > 75.){
                        lerp = mix(playerRotation.x, playerRotation.x, pow(vUv.y, 1.) / 1.); 
                    }   
                    rotZ = mat3(
                        cos(lerp), sin(lerp), 0.0,
                        -sin(lerp), cos(lerp), 0.0, 
                        0.0, 0.0 , 1.0
                    );
                    
                    pos.xz *= noisetex.r;
                    pos *= rotZ;
                    pos *= rotX;
                    if(id > 0.5){
                        pos.y *= 1.5; 
                    }
                    gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }
            `,
            fragmentShader: `\
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                varying vec2 vUv;
                varying float vId;

                uniform sampler2D perlinnoise;
                uniform float uTime;
                uniform vec3 color;
                uniform float random;

                float pat(vec2 uv, float p, float q, float s, float glow)
                {
                    float t = abs(cos(uTime)) + 1.;
                    float z = cos(q *random * uv.x) * cos(p *random * uv.y) + cos(q * random * uv.y) * cos(p * random * uv.x);

                    z += sin(uTime * 50.0 - uv.y - uv.y * s) * 0.35;	
                    float dist=abs(z) * (5. / glow);
                    return dist;
                }
                void main() {
                    if(vId < 0.5){
                        vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*2.,vUv.x - uTime*1.),1.)).rgb;
            
                        gl_FragColor = vec4(noisetex.r);
                        if(gl_FragColor.r >= 0.1){
                            gl_FragColor = vec4(color, gl_FragColor.r);
                        }
                        else{
                            gl_FragColor = vec4(0.);
                        }
                        gl_FragColor *= vec4(smoothstep(0.2, 0.628, vUv.y));
                        gl_FragColor.xyz /= 1.5;
                        gl_FragColor.a *= (1. - vUv.y) * 5.;
                    }
                    else{
                        vec2 uv = vUv.yx;
                        float d = pat(uv, 1.0, 2.0, 10.0, 0.35);	
                        vec3 col = color*0.5/d;
                        vec4 fragColor = vec4(col,1.0);



                        vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*2.,vUv.x - uTime*1.),1.)).rgb;
                
                        gl_FragColor = vec4(noisetex.r);
                        if(gl_FragColor.r >= 0.0){
                            gl_FragColor = fragColor;
                        }
                        else{
                            gl_FragColor = vec4(0.);
                        }
                        gl_FragColor *= vec4(smoothstep(0.2, 0.628, vUv.y));
                        gl_FragColor.a *= (1. - vUv.y) * 5.;
                    }
                    
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            
            clipping: false,
            fog: false,
            lights: false,
        });
        const flameMesh = new THREE.InstancedMesh(geometry, flameMaterial, particleCount);
        group.add(flameMesh);
        // flameMaterial.onBeforeCompile = () => {
        //     console.log('compile flame material')
        // }
        renderer.compile(group, camera)
        let playerRotation = [0, 0, 0, 0, 0];
        let sonicBoomInApp = false;
        let lightningfreq = 0;
        useFrame(({timestamp}) => {
            if(narutoRunTime > 10 ){
                if(!sonicBoomInApp){
                    // console.log('add-flame');
                    app.add(group);
                    sonicBoomInApp=true;
                }
                group.scale.set(1, 1, 1);
                flameMaterial.uniforms.strength.value = 1.0;
            }
            else{
                if(flameMaterial.uniforms.strength.value > 0)
                    flameMaterial.uniforms.strength.value -= 0.025;
            }
            if(flameMaterial.uniforms.strength.value>0){
                group.position.copy(localPlayer.position);
                if (localPlayer.avatar) {
                    group.position.y -= localPlayer.avatar.height;
                    group.position.y += 0.65;
                }
                group.position.x -= 2.2 * currentDir.x;
                group.position.z -= 2.2 * currentDir.z;
                flameMaterial.uniforms.uTime.value = timestamp / 20000;
                if(!flameMaterial.uniforms.perlinnoise.value)
                    flameMaterial.uniforms.perlinnoise.value = particleTexture[nameSpec.indexOf('wave9')];
                if(Math.abs(localPlayer.rotation.x) > 0){
                    let temp = localPlayer.rotation.y + Math.PI;
                    for(let i = 0; i < 5; i++){
                        let temp2 = playerRotation[i];
                        playerRotation[i] = temp;
                        temp = temp2;
                    }
                }
                else{
                    let temp = -localPlayer.rotation.y;
                    for(let i = 0; i < 5; i++){
                        let temp2 = playerRotation[i];
                        playerRotation[i] = temp;
                        temp = temp2;
                    }
                }
                if(lightningfreq % 1 === 0){
                    flameMaterial.uniforms.random.value = Math.random() * Math.PI;
                }
                lightningfreq++;
               
                flameMaterial.uniforms.playerRotation.value.set(playerRotation[0], 0, playerRotation[4]);
            }
            else{
                if(sonicBoomInApp){
                    // console.log('remove-flame');
                    app.remove(group);
                    sonicBoomInApp=false;
                }
            }
            //app.updateMatrixWorld();

        });

    }
    const trailMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: {
                value: 0,
            },
            opacity: {
                value: 0,
            },
            trailTexture:{ value: null},
            maskTexture:{value: null},
            voronoiNoiseTexture:{value: null},
        },
        vertexShader: `\
             
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
           
         
            uniform float uTime;
    
            varying vec2 vUv;
           
            void main() {
              vUv = uv;
            //   vUv.y *= 2.;
              //vUv.x=1.-vUv.x;
              vec4 modelPosition = modelMatrix * vec4(position, 1.0);
              vec4 viewPosition = viewMatrix * modelPosition;
              vec4 projectionPosition = projectionMatrix * viewPosition;
    
              gl_Position = projectionPosition;
              ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
          `,
          fragmentShader: `\
          ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
          uniform sampler2D trailTexture;
          uniform sampler2D maskTexture;
          uniform sampler2D voronoiNoiseTexture;
          
          
          
          uniform float uTime;
          uniform float opacity;
          varying vec2 vUv;
          void main() {
            vec4 voronoiNoise = texture2D(
                voronoiNoiseTexture,
                vec2(
                    0.45 * vUv.x,
                    0.45 * vUv.y + uTime * 0.5
                )
            );  
            
            vec4 trail = texture2D(
                trailTexture,
                vec2(
                    vUv.x,
                    mix(2. * vUv.y + uTime * 1.5, voronoiNoise.g, 0.5)
                )
            );  
            vec4 mask = texture2D(
                maskTexture,
                vec2(
                    vUv.x,
                    1. - vUv.y
                )
            ); 
            float p = 3.5;
            voronoiNoise = vec4(pow(voronoiNoise.r, p), pow(voronoiNoise.g, p), pow(voronoiNoise.b, p), voronoiNoise.a) * 1.4;
            gl_FragColor = mask * trail * voronoiNoise * vec4(0.120, 0.280, 1.920, 1.0);
            gl_FragColor.a *= opacity;
                
            ${THREE.ShaderChunk.logdepthbuf_fragment}
          }
        `,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,

      clipping: false,
      fog: false,
      lights: false,
    });
    trailMaterial.freeze();
    //########################################## vertical trail ######################################
    {
      const planeGeometry = new THREE.BufferGeometry();
      let planeNumber = 80;
      let position= new Float32Array(18 * planeNumber);
      planeGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3));

      let uv = new Float32Array(12 * planeNumber);
      let fraction = 1;
      let ratio = 1 / planeNumber;
      for (let i = 0; i < planeNumber; i++) {
        uv[i * 12 + 0] = 0;
        uv[i * 12 + 1] = fraction;

        uv[i * 12 + 2] = 1;
        uv[i * 12 + 3] = fraction;

        uv[i * 12 + 4] = 0;
        uv[i * 12 + 5] = fraction - ratio;

        uv[i * 12 + 6] = 1;
        uv[i * 12 + 7] = fraction - ratio;

        uv[i * 12 + 8] = 0;
        uv[i * 12 + 9] = fraction - ratio;

        uv[i * 12 + 10] = 1;
        uv[i * 12 + 11] = fraction;

        fraction -= ratio;

      }
      planeGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

      const material = trailMaterial;
    
      let plane = new THREE.Mesh(planeGeometry,material);
      //app.add(plane);
    //   material.onBeforeCompile = () => {
    //         console.log('compile trail material')
    //   }
      renderer.compile(plane, camera)
      plane.position.y = 1;
      plane.frustumCulled = false;
      let temp = [];
      let temp2 = [];
      let sonicBoomInApp = false;
      useFrame(({timestamp}) => {
        
        
        if(narutoRunTime >= 10){
            if(!sonicBoomInApp){
                //console.log('add-planeTrail1');
                app.add(plane);
                sonicBoomInApp = true;
            }
            material.uniforms.opacity.value = 1;
        }
        else{
            if(material.uniforms.opacity.value > 0)
                material.uniforms.opacity.value -= 0.02;
        }
        if(narutoRunTime > 0 && narutoRunTime < 10){
            material.uniforms.opacity.value = 0;
        }
        if(material.uniforms.opacity.value > 0){
            //console.log('sonic-boom-verticalPlane');
            for(let i = 0; i < 18; i++){
                temp[i] = position[i];
            }
            for (let i = 0; i < planeNumber; i++){
                if(i === 0){
                    position[0] = localPlayer.position.x;
                    position[1] = localPlayer.position.y - 0.85;
                    position[2] = localPlayer.position.z;
                    if (localPlayer.avatar) {
                        position[1] -= localPlayer.avatar.height;
                        position[1] += 1.18;
                    }
                    position[3] = localPlayer.position.x;
                    position[4] = localPlayer.position.y - 2.25;
                    position[5] = localPlayer.position.z;
                    if (localPlayer.avatar) {
                        position[4] -= localPlayer.avatar.height;
                        position[4] += 1.18;
                    }
                
                    position[6] = temp[0];
                    position[7] = temp[1];
                    position[8] = temp[2];
                
                    position[9] = temp[3];
                    position[10] = temp[4];
                    position[11] = temp[5];
                
                    position[12] = temp[0];
                    position[13] = temp[1];
                    position[14] = temp[2];
                
                    position[15] = localPlayer.position.x;
                    position[16] = localPlayer.position.y - 2.25;
                    position[17] = localPlayer.position.z;
                    if (localPlayer.avatar) {
                        position[16] -= localPlayer.avatar.height;
                        position[16] += 1.18;
                    }
                }
                else{
                    
                    for(let j = 0; j < 18; j++){
                        temp2[j] = position[i * 18 + j];
                        position[i * 18 + j] = temp[j];
                        temp[j] = temp2[j];
                    }
                    
    
                }
            }
            plane.geometry.attributes.position.needsUpdate = true;
            
            material.uniforms.uTime.value = timestamp / 1000;
            if(!material.uniforms.trailTexture.value){
                material.uniforms.trailTexture.value = particleTexture[nameSpec.indexOf('trail')];
                material.uniforms.trailTexture.value.wrapS = material.uniforms.trailTexture.value.wrapT = THREE.RepeatWrapping;
            }
            if(!material.uniforms.voronoiNoiseTexture.value){
                material.uniforms.voronoiNoiseTexture.value = particleTexture[nameSpec.indexOf('voronoiNoise')];
                material.uniforms.voronoiNoiseTexture.value.wrapS = material.uniforms.voronoiNoiseTexture.value.wrapT = THREE.RepeatWrapping;
            }
            if(!material.uniforms.maskTexture.value){
                material.uniforms.maskTexture.value = particleTexture[nameSpec.indexOf('mask')];
            }
                
        }
        else {
            if (sonicBoomInApp) {
                //console.log('remove-planeTrail1');
                for (let i = 0; i < position.length; i++) {
                    position[i * 3 + 0] = localPlayer.position.x;
                    position[i * 3 + 1] = localPlayer.position.y;
                    position[i * 3 + 2] = localPlayer.position.z;
                }
                plane.geometry.attributes.position.needsUpdate = true;
                app.remove(plane);
                sonicBoomInApp = false;
            }
        }
        //app.updateMatrixWorld();
      });
    }
    //########################################## horizontal trail ######################################
    {
      const planeGeometry = new THREE.BufferGeometry();
      const planeNumber = 80;
      let position = new Float32Array(18 * planeNumber);
      planeGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3));

      let uv = new Float32Array(12 * planeNumber);
      let fraction = 1;
      let ratio = 1 / planeNumber;
      for (let i = 0; i < planeNumber; i++) {
        uv[i * 12 + 0] = 0;
        uv[i * 12 + 1] = fraction;

        uv[i * 12 + 2] = 1;
        uv[i * 12 + 3] = fraction;

        uv[i * 12 + 4] = 0;
        uv[i * 12 + 5] = fraction - ratio;

        uv[i * 12 + 6] = 1;
        uv[i * 12 + 7] = fraction - ratio;

        uv[i * 12 + 8] = 0;
        uv[i * 12 + 9] = fraction - ratio;

        uv[i * 12 + 10] = 1;
        uv[i * 12 + 11] = fraction;

        fraction -= ratio;

      }
      planeGeometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
       
        
        
      const material = trailMaterial;
    
      let plane = new THREE.Mesh(planeGeometry,material);
      //app.add(plane);
      plane.position.y = 1;
      plane.frustumCulled = false;

      const point1 = new THREE.Vector3();
      const point2 = new THREE.Vector3();
      const localVector2 = new THREE.Vector3();
      let temp = [];
      let temp2 = [];
      let quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
      let sonicBoomInApp=false;
      useFrame(({timestamp}) => {


        if(narutoRunTime >= 10){
            if(!sonicBoomInApp){
                //console.log('add-planeTrail2');
                app.add(plane);
                sonicBoomInApp = true;
            }
            material.uniforms.opacity.value = 1;
        }
        else{
            if(material.uniforms.opacity.value > 0)
                material.uniforms.opacity.value -= 0.0255;
        }
        if(narutoRunTime > 0 && narutoRunTime < 10){
            material.uniforms.opacity.value = 0;
        }
        if(material.uniforms.opacity.value > 0){
            //console.log('sonic-boom-horiPlane');
            
            localVector2.set(currentDir.x, currentDir.y, currentDir.z).applyQuaternion(quaternion);
    
            point1.x = localPlayer.position.x;
            point1.y = localPlayer.position.y;
            point1.z = localPlayer.position.z;
            point2.x = localPlayer.position.x;
            point2.y = localPlayer.position.y;
            point2.z = localPlayer.position.z;
            
            point1.x -= 0.9 * localVector2.x;
            point1.z -= 0.9 * localVector2.z;
            point2.x += 0.9 * localVector2.x;
            point2.z += 0.9 * localVector2.z;
            
           
            for(let i = 0;i < 18; i++){
                temp[i] = position[i];
            }
            for (let i = 0; i < planeNumber; i++){
                if(i === 0){
                    position[0] = point1.x;
                    position[1] = localPlayer.position.y - 1.55;
                    position[2] = point1.z;
                    if (localPlayer.avatar) {
                        position[1] -= localPlayer.avatar.height;
                        position[1] += 1.18;
                    }
                    position[3] = point2.x;
                    position[4] = localPlayer.position.y - 1.55;
                    position[5] = point2.z;
                    if (localPlayer.avatar) {
                        position[4] -= localPlayer.avatar.height;
                        position[4] += 1.18;
                    }
                
                    position[6] = temp[0];
                    position[7] = temp[1];
                    position[8] = temp[2];
                
                    position[9] = temp[3];
                    position[10] = temp[4];
                    position[11] = temp[5];
                
                    position[12] = temp[0];
                    position[13] = temp[1];
                    position[14] = temp[2];
                
                    position[15] = point2.x;
                    position[16] = localPlayer.position.y - 1.55;
                    position[17] = point2.z;
                    if (localPlayer.avatar) {
                        position[16] -= localPlayer.avatar.height;
                        position[16] += 1.18;
                    }
                }
                else{
                    for(let j = 0; j < 18; j++){
                        temp2[j] = position[i * 18 + j];
                        position[i * 18 + j] = temp[j];
                        temp[j] = temp2[j];
                    }
                }
            }
            plane.geometry.attributes.position.needsUpdate = true;
            material.uniforms.uTime.value = timestamp / 1000;
        }
        else {
            if (sonicBoomInApp) {
                //console.log('remove-planeTrail2');
                for (let i = 0; i < position.length; i++) {
                    position[i * 3 + 0] = localPlayer.position.x;
                    position[i * 3 + 1] = localPlayer.position.y;
                    position[i * 3 + 2] = localPlayer.position.z;
                }
                plane.geometry.attributes.position.needsUpdate = true;
                app.remove(plane);
                sonicBoomInApp = false;
            }
        }
      });
    }
    //##################################### mainBall ####################################################
    {
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                opacity: { value: 0 },
                uSize: { value: 0 },
                cameraBillboardQuaternion: {
                    value: new THREE.Quaternion(),
                }
            },
            vertexShader: `
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                uniform float uTime;
                uniform float uSize;
                uniform vec4 cameraBillboardQuaternion;
                
                varying vec2 vUv;
               
                
                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }
                void main() {  
                    vUv = uv;
                    vec3 pos = position;
                    pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                    pos *= uSize;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }
            `,
            fragmentShader: `
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                uniform float uTime;
                uniform float opacity;

                varying vec2 vUv;
                void main() {
                    float s = smoothstep(0.5, 0.2, length(vUv - 0.5));
                    gl_FragColor = vec4(s);
                    if(opacity > 0.5)
                        gl_FragColor.a -= opacity * 1.5;
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                    
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            alphaToCoverage: true,

            clipping: false,
            fog: false,
            lights: false,
        });
        material.freeze();
        const geometry = new THREE.PlaneGeometry( 1.55, 1.55 );
        const mainBall = new THREE.Mesh( geometry, material );
        // app.add(mainBall);
        let sonicBoomInApp=false;
        useFrame(({timestamp}) => {
            if(narutoRunTime > 0){
                if(!sonicBoomInApp){
                    //console.log('add-mainBall');
                    app.add(mainBall);
                    sonicBoomInApp = true;
                }
                if(narutoRunTime === 1){
                    mainBall.material.uniforms.uSize.value = 4.5;
                }
                else{
                    if(mainBall.material.uniforms.uSize.value > 1){
                        mainBall.material.uniforms.uSize.value /= 1.1;
                    }
                    else{
                        const rand = Math.random() * 0.1;
                        mainBall.material.uniforms.uSize.value = 1 + rand;
                    }
                }
                mainBall.scale.x = 1;
                mainBall.scale.y = 1;
                mainBall.scale.z = 1;
                mainBall.material.uniforms.opacity.value = 0;
            }
            else{
                if(mainBall.material.uniforms.opacity.value < 1){
                    mainBall.scale.x /= 1.03;
                    mainBall.scale.y /= 1.03;
                    mainBall.scale.z /= 1.03;
                    mainBall.material.uniforms.opacity.value += 0.02;
                    const rand = Math.random() * 0.15;
                    mainBall.material.uniforms.uSize.value = 1 + rand;
                }
                
            }
            if(mainBall.material.uniforms.opacity.value < 1){
                //console.log('sonic-boom-mainBall');
                mainBall.position.copy(localPlayer.position);
            
                if (localPlayer.avatar) {
                    mainBall.position.y -= localPlayer.avatar.height;
                    mainBall.position.y += 0.65;
                }
                material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
                
            }
            else{
                if(sonicBoomInApp){
                    //console.log('remove-mainBall');
                    app.remove(mainBall);
                    sonicBoomInApp=false;
                }
            }

            
        });
        
    }
    //##################################### electricity1 ##################################################
    {
        const particleCount = 2;
        const attributeSpecs = [];
        attributeSpecs.push({name: 'id', itemSize: 1});
        attributeSpecs.push({name: 'scales', itemSize: 1});
        attributeSpecs.push({name: 'textureRotation', itemSize: 1});
        const geometry2 = new THREE.PlaneBufferGeometry(3., 3.);
        const geometry = _getGeometry(geometry2, attributeSpecs, particleCount);
        const idAttribute = geometry.getAttribute('id');
        for(let i = 0; i < particleCount; i++){
            idAttribute.setX(i, i);
        }
        idAttribute.needsUpdate = true;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                opacity: { value: 0 },
                size: { value: 0 },
                cameraBillboardQuaternion: {
                    value: new THREE.Quaternion(),
                },
                electricityTexture1: {
                    type: "t",
                    value: null
                },
                electricityTexture2: {
                    type: "t",
                    value: null
                },

            },
            vertexShader: `
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                uniform float uTime;
                uniform float size;
                uniform vec4 cameraBillboardQuaternion;
                
                attribute float id;
                attribute float scales;
                attribute float textureRotation;

                varying float vTextureRotation;
                varying vec2 vUv;
                varying float vId;
                
                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }
                void main() {  
                    vTextureRotation = textureRotation;
                    vUv = uv;
                    vId = id;
                    vec3 pos = position;
                    pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                    pos *= 0.8 * cos(uTime * 100.);
                    pos *= size;
                    pos *= scales;
                    if(id < 0.5)
                        pos *= 0.6;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }
            `,
            fragmentShader: `
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                uniform float uTime;
                uniform float opacity;

                uniform sampler2D electricityTexture1;
                uniform sampler2D electricityTexture2;
                
                varying vec2 vUv;
                varying float vId;
                varying float vTextureRotation;

                #define PI 3.1415926


                void main() {
                    float mid = 0.5;
                    vec2 rotated = vec2(cos(vTextureRotation*PI) * (vUv.x - mid) - sin(vTextureRotation*PI) * (vUv.y - mid) + mid,
                                cos(vTextureRotation*PI) * (vUv.y - mid) + sin(vTextureRotation*PI) * (vUv.x - mid) + mid);
                    vec4 tex;
                    if(vId > 0.5)
                        tex = texture2D(electricityTexture1, rotated); 
                    else 
                        tex = texture2D(electricityTexture2, rotated); 
                    if(tex.a < 0.01)
                    {
                        discard;    
                    }   
                    gl_FragColor = vec4(1.0, 1.0, 1.0, tex.a);
                    
                    gl_FragColor.r = abs(sin(uTime));
                    gl_FragColor.g = abs(sin(uTime));
                    gl_FragColor.b = abs(cos(uTime));

                    
                    gl_FragColor.a *= opacity;
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                    
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,

            clipping: false,
            fog: false,
            lights: false,
        });
        material.freeze();
        const group = new THREE.Group();
        const electricity = new THREE.InstancedMesh(geometry, material, particleCount);
        group.add(electricity)

        // material.onBeforeCompile = () => {
        //     console.log('compile electricity material')
        // }
        renderer.compile(group, camera)
       
        let sonicBoomInApp = false;
        useFrame(({timestamp}) => {

            if(narutoRunTime === 0){
                
                if(material.uniforms.opacity.value > 0.01){
                    material.uniforms.opacity.value /= 1.08;
                    material.uniforms.size.value /= 1.01;
                }
                
            }
            else if(narutoRunTime === 1){
                if(!sonicBoomInApp){
                    //console.log('add-electricity1');
                    app.add(group);
                    sonicBoomInApp=true;
                }
                material.uniforms.opacity.value = 1;
                material.uniforms.size.value = 4.5;
                
            }
            else if(narutoRunTime > 1){
                if(material.uniforms.size.value > 1){
                    material.uniforms.size.value /= 1.1;
                }
                else{
                    material.uniforms.size.value = 1;
                }
                
            }
            if(material.uniforms.opacity.value > 0.01){
                // group.rotation.copy(localPlayer.rotation);
                group.position.copy(localPlayer.position);
                
                group.position.x += .1 * currentDir.x;
                group.position.z += .1 * currentDir.z;
                
                if (localPlayer.avatar) {
                    group.position.y -= localPlayer.avatar.height;
                    group.position.y += 0.65;
                }
                material.uniforms.uTime.value = timestamp / 1000;
                material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
                if(!material.uniforms.electricityTexture1.value){
                    material.uniforms.electricityTexture1.value = particleTexture[nameSpec.indexOf('electricityTexture1')];
                }
                if(!material.uniforms.electricityTexture2.value){
                    material.uniforms.electricityTexture2.value = particleTexture[nameSpec.indexOf('electricityTexture2')];
                }
                const scalesAttribute = electricity.geometry.getAttribute('scales');
                const textureRotationAttribute = electricity.geometry.getAttribute('textureRotation');
                scalesAttribute.setX(0, 0.8 + Math.random() * 0.2);
                scalesAttribute.setX(1, 0.8 + Math.random() * 0.2);
                textureRotationAttribute.setX(0, Math.random() * 2);
                textureRotationAttribute.setX(1, Math.random() * 2);
                textureRotationAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
            }
            else{
                if(sonicBoomInApp){
                    //console.log('remove-electricty1');
                    app.remove(group);
                    sonicBoomInApp = false;
                }
            }
            
            
            
            //app.updateMatrixWorld();
        
        });
    }
    
    //#################################### particle behind avatar ###############################
    {
        
        const particleCount = 10;
        let info = {
            velocity: [particleCount]
        }
        let acc = new THREE.Vector3(-0.000, 0.0008, 0.0018);
        const attributeSpecs = [];
        attributeSpecs.push({name: 'id', itemSize: 1});
        attributeSpecs.push({name: 'scales', itemSize: 1});
        // attributeSpecs.push({name: 'textureRotation', itemSize: 1});
        const geometry2 = new THREE.PlaneBufferGeometry(0.075, 0.075);
        const geometry = _getGeometry(geometry2, attributeSpecs, particleCount);
        const idAttribute = geometry.getAttribute('id');
        for(let i = 0; i < particleCount; i++){
            idAttribute.setX(i, i);
        }
        idAttribute.needsUpdate = true;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                opacity: { value: 0 },
                size: { value: 0 },
                cameraBillboardQuaternion: {
                    value: new THREE.Quaternion(),
                },
                electronicballTexture: {
                    type: "t",
                    value: null
                },

            },
            vertexShader: `
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                uniform float uTime;
                uniform float size;
                uniform vec4 cameraBillboardQuaternion;
                
                attribute float id;
                attribute float scales;
                attribute float textureRotation;
                attribute vec3 positions;

                varying float vTextureRotation;
                varying vec2 vUv;
                varying float vId;
                
                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }
                void main() {  
                    vTextureRotation = textureRotation;
                    vUv = uv;
                    vId = id;
                    vec3 pos = position;
                    pos = rotateVecQuat(pos, cameraBillboardQuaternion);
                    pos *= scales;
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
                uniform float uTime;
                uniform float sphereNum;
                uniform float opacity;

                uniform sampler2D electronicballTexture;
                
                varying vec2 vUv;
                varying float vId;
                varying float vTextureRotation;

                #define PI 3.1415926


                void main() {
                    
                    vec4 tex = texture2D(electronicballTexture, vUv); 
                    if(tex.a < 0.01)
                    {
                        discard;    
                    }   
                    gl_FragColor.r *= abs(sin(uTime) * vId);
                    gl_FragColor.g *= abs(sin(uTime) * vId);
                    gl_FragColor = tex;
                    gl_FragColor.a *= opacity;
                    
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                    
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,

            clipping: false,
            fog: false,
            lights: false,
        });
        material.freeze();
        const group = new THREE.Group();
        const electricityBall = new THREE.InstancedMesh(geometry, material, particleCount);
        group.add(electricityBall)

        // material.onBeforeCompile = () => {
        //     console.log('compile electricityBall material')
        // }
        renderer.compile(group, camera)
        for(let i = 0; i< particleCount; i++){
            info.velocity[i] = new THREE.Vector3();
        }
       
        let sonicBoomInApp = false;
        useFrame(({timestamp}) => {
            if(narutoRunTime === 0){
                material.uniforms.opacity.value /= 1.1;
            }
            if(narutoRunTime === 1){
                if(!sonicBoomInApp){
                    //console.log('add-electricityBall1');
                    app.add(group);
                    sonicBoomInApp=true;
                }
                material.uniforms.opacity.value = 1;
                
            }
            else if(narutoRunTime > 1){
                
                
            }
            if(material.uniforms.opacity.value > 0.01){
                // group.rotation.copy(localPlayer.rotation);
                group.position.copy(localPlayer.position);
                
                group.position.x += .1 * currentDir.x;
                group.position.z += .1 * currentDir.z;
                
                if (localPlayer.avatar) {
                    group.position.y -= localPlayer.avatar.height;
                    group.position.y += 0.65;
                }

                const scalesAttribute = electricityBall.geometry.getAttribute('scales');
                const positionsAttribute = electricityBall.geometry.getAttribute('positions');
                
                for(let i = 0; i < particleCount; i++){
                    if(scalesAttribute.getX(i) < 0.1){
                        positionsAttribute.setXYZ(i, (Math.random() - 0.5) * 0.15, (Math.random() - 0.5) * 0.55, (Math.random() - 0.5) * 0.15);
                        scalesAttribute.setX(i, 1 + Math.random());
                        let rand = Math.random();
                        info.velocity[i].set( (rand + 0.5) * -currentDir.x, 0, (rand + 0.5) * -currentDir.z);
                        // info.velocity[i].divideScalar(10);
                        break;
                    }
                    positionsAttribute.setXYZ(
                        i,
                        positionsAttribute.getX(i) + info.velocity[i].x,
                        positionsAttribute.getY(i) + info.velocity[i].y,
                        positionsAttribute.getZ(i) + info.velocity[i].z
                    )
                    scalesAttribute.setX(i, scalesAttribute.getX(i) / 1.2);
                    

                }
                
                scalesAttribute.needsUpdate = true;
                positionsAttribute.needsUpdate = true;

                material.uniforms.uTime.value = timestamp / 1000;
                material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
                if(!material.uniforms.electronicballTexture.value){
                    material.uniforms.electronicballTexture.value = particleTexture[nameSpec.indexOf('electronic-ball2')];
                }
            }
            else{
                if(sonicBoomInApp){
                    const scalesAttribute = electricityBall.geometry.getAttribute('scales');
                    for(let i = 0; i < particleCount; i++){
                        scalesAttribute.setX(i, 0);
                    }
                    scalesAttribute.needsUpdate = true;
                    //console.log('remove-electricty1');
                    app.remove(group);
                    sonicBoomInApp = false;
                }
            }
            
            
            
            //app.updateMatrixWorld();
        
        });

    }
   
    //#################################### shockwave2 ########################################
    {
        const localVector = new THREE.Vector3();
        const _shake = () => {
            if (narutoRunTime >= 1 && narutoRunTime <= 5) {
                localVector.setFromMatrixPosition(localPlayer.matrixWorld);
                cameraManager.addShake( localVector, 0.2, 30, 500);
            }
        };
        let wave;
        let group = new THREE.Group();
        (async () => {
            const u = `${baseUrl}/assets/wave3.glb`;
            wave = await new Promise((accept, reject) => {
                const {gltfLoader} = useLoaders();
                gltfLoader.load(u, accept, function onprogress() {}, reject);
                
            });
            wave.scene.position.y = -5000;

            wave.scene.rotation.x = Math.PI/2;
            group.add(wave.scene);
            
            //app.add(group);
            
            wave.scene.children[0].material= new THREE.ShaderMaterial({
                uniforms: {
                    uTime: {
                        value: 0,
                    },
                    opacity: {
                        value: 0,
                    },
                    avatarPos:{
                        value: new THREE.Vector3(0, 0, 0)
                    },
                    iResolution: { value: new THREE.Vector3() },
                },
                vertexShader: `\
                    
                    ${THREE.ShaderChunk.common}
                    ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                
                
                    uniform float uTime;
            
                    varying vec2 vUv;
                    varying vec3 vPos;

                
                    void main() {
                    vUv=uv;
                    vPos=position;
                    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                    vec4 viewPosition = viewMatrix * modelPosition;
                    vec4 projectionPosition = projectionMatrix * viewPosition;
            
                    gl_Position = projectionPosition;
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                    }
                `,
                fragmentShader: `\
                    ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                    uniform float uTime;
                    uniform float opacity;
                    uniform vec3 iResolution;
                    uniform vec3 avatarPos;
                    varying vec2 vUv;
                    varying vec3 vPos;

                    float noise(vec3 point) { 
                        float r = 0.; 
                        for (int i=0;i<16;i++) {
                            vec3 D, p = point + mod(vec3(i,i/4,i/8) , vec3(4.0,2.0,2.0)) +
                            1.7*sin(vec3(i,5*i,8*i)), C=floor(p), P=p-C-.5, A=abs(P);
                            C += mod(C.x+C.y+C.z,2.) * step(max(A.yzx,A.zxy),A) * sign(P);
                            D=34.*sin(987.*float(i)+876.*C+76.*C.yzx+765.*C.zxy);P=p-C-.5;
                            r+=sin(6.3*dot(P,fract(D)-.5))*pow(max(0.,1.-2.*dot(P,P)),4.);
                        } 
                        return .5 * sin(r); 
                    }
                    
                    void mainImage( out vec4 fragColor, in vec2 fragCoord ){
                        
                        fragColor = vec4(
                            mix(vec3(0.205, 0.350, 0.930),vec3(0.205, 0.550, 0.530),vUv.x)
                            +vec3(
                                noise(5.6*vec3(vPos.z*sin(mod(uTime*1.,1.)/0.9),vPos.z,vPos.x*cos(mod(uTime*1.,1.)/0.9)))
                            )
                            , distance(avatarPos,vPos)-.95);
                            //pow(distance(avatarPos,vPos)-.95,1.)

                            // vec2 u = vPos.xz*10.;
        
                            // vec2 s = vec2(1.,1.732);
                            // vec2 a = mod(u     ,s)*2.-s;
                            // vec2 b = mod(u+s*.5,s)*2.-s;
                            
                            // fragColor = vec4(.2*min(dot(a,a),dot(b,b)));


                            
                        
                    }
                    
                    void main() {
                        mainImage(gl_FragColor, vUv * iResolution.xy);
                        gl_FragColor.a*=1.5;
                        gl_FragColor.a-=opacity;
                        //gl_FragColor.xyz*=10.;
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                    }
                `,
                //side: THREE.DoubleSide,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,

                clipping: false,
                fog: false,
                lights: false,
            });
            wave.scene.children[0].material.freeze();
            // wave.scene.children[0].material.onBeforeCompile = () => {
            //     console.log('compile shock wave material')
            // }
            renderer.compile(group, camera)

        })();

        //app.updateMatrixWorld();
        let sonicBoomInApp=false;
        useFrame(({timestamp}) => {
           
            if (wave) {
                
                
                
                if (narutoRunTime > 0) {
                    if(!sonicBoomInApp){
                        //console.log('add-shockWave');
                        app.add(group);
                        sonicBoomInApp=true;
                    }
                    if(narutoRunTime ===1){
                        group.position.copy(localPlayer.position);
                        group.position.x+=4.*currentDir.x;
                        group.position.z+=4.*currentDir.z;
                        group.rotation.copy(localPlayer.rotation);
                        wave.scene.position.y=0;
                        if (localPlayer.avatar) {
                            group.position.y -= localPlayer.avatar.height;
                            group.position.y += 0.65;
                        }
                        wave.scene.scale.set(1,1,1);
                        wave.scene.children[0].material.uniforms.opacity.value=0;
                    }
                    
                    if(wave.scene.scale.x<=5){
                        _shake();
                        
                    }
                    
                } 
                if(wave.scene.children[0].material.uniforms.opacity.value<1){
                    wave.scene.scale.set(wave.scene.scale.x+.15,wave.scene.scale.y+0.001,wave.scene.scale.z+.15);
                    wave.scene.children[0].material.uniforms.opacity.value+=0.003;
                    wave.scene.children[0].material.uniforms.uTime.value=timestamp/1000;
                    wave.scene.children[0].material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
                    wave.scene.children[0].material.uniforms.avatarPos.x=localPlayer.position.x;
                    wave.scene.children[0].material.uniforms.avatarPos.y=localPlayer.position.y;
                    wave.scene.children[0].material.uniforms.avatarPos.z=localPlayer.position.z;
                }
                else{
                    if(sonicBoomInApp && narutoRunTime===0){
                        //console.log('remove-shockWave');
                        app.remove(group);
                        sonicBoomInApp=false;
                    }
                }
            }
            
            
        });
    }
    //##################################### front dust ################################################
    {

        const particleCount = 12;
        let info = {
            velocity: [particleCount],
            inApp: [particleCount],
            acc:[particleCount]
        }
        for(let i = 0; i < particleCount; i++){
            info.velocity[i] = new THREE.Vector3();
            info.acc[i] = new THREE.Vector3();
        }

        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                opacity: { value: 0 },
                noiseMap: {value: null}

            },
            vertexShader: `
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                uniform float uTime;
                
                attribute vec3 scales;
                attribute float broken;
                attribute float opacity;
                attribute vec3 positions;
                attribute vec4 quaternions;

                varying float vBroken;
                varying vec2 vUv;
                varying float vOpacity;

                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }

                void main() {  
                    vOpacity = opacity;
                    vBroken = broken;
                    vUv = uv;
                    vec3 pos = position;
                    pos = rotateVecQuat(pos, quaternions);
                    pos *= scales;
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
                uniform float uTime;
                uniform float opacity;
                uniform sampler2D noiseMap;

                varying float vBroken;
                varying vec2 vUv;
                varying float vOpacity;
                
                void main() {
                    gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
                    vec4 noise = texture2D(
                        noiseMap,
                        vUv
                    ); 
                    gl_FragColor *= vOpacity;
                    float broken = abs( sin( 1.0 - vBroken ) ) - noise.g;
                    if ( broken < 0.0001 ) discard;
                    
                    
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                    
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,

            clipping: false,
            fog: false,
            lights: false,
        });
        material.freeze();
        
        let mesh = null;
        let dustGeometry = null;
        (async () => {
            const u = `${baseUrl}/assets/smoke.glb`;
            const dustApp = await new Promise((accept, reject) => {
                const {gltfLoader} = useLoaders();
                gltfLoader.load(u, accept, function onprogress() {}, reject);
                
            });
            dustApp.scene.traverse(o => {
              if (o.isMesh) {
                dustGeometry = o.geometry;
                const attributeSpecs = [];
                attributeSpecs.push({name: 'broken', itemSize: 1});
                attributeSpecs.push({name: 'opacity', itemSize: 1});
                attributeSpecs.push({name: 'scales', itemSize: 3});
                const geometry = _getGeometry(dustGeometry, attributeSpecs, particleCount);
                const quaternions = new Float32Array(particleCount * 4);
                const identityQuaternion = new THREE.Quaternion();
                for (let i = 0; i < particleCount; i++) {
                    identityQuaternion.toArray(quaternions, i * 4);
                }
                const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
                geometry.setAttribute('quaternions', quaternionsAttribute);
                mesh = new THREE.InstancedMesh(geometry, material, particleCount);

                // material.onBeforeCompile = () => {
                //     console.log('compile dust material')
                // }
                renderer.compile(mesh, camera)
              }
            });
            
    
        })();
        
        const euler = new THREE.Euler();
        const quaternion = new THREE.Quaternion();
        let sonicBoomInApp=false;
        useFrame(({timestamp}) => {
            let count = 0;
            if (mesh) {
                const positionsAttribute = mesh.geometry.getAttribute('positions');
                const opacityAttribute = mesh.geometry.getAttribute('opacity');
                const brokenAttribute = mesh.geometry.getAttribute('broken');
                const scalesAttribute = mesh.geometry.getAttribute('scales');
                const quaternionAttribute = mesh.geometry.getAttribute('quaternions');
                if(lastStopSw === 1  && narutoRunTime===0 && localPlayer.characterPhysics.lastGrounded){
                    if(!sonicBoomInApp){
                        // console.log('add-dust');
                        app.add(mesh);
                        sonicBoomInApp = true;
                    }
                    for (let i = 0; i < particleCount; i++) {
                        scalesAttribute.setXYZ(i, 0.06 + Math.random() * 0.05,  0.06 + Math.random() * 0.05,  0.06 + Math.random() * 0.05);
                        
                        info.velocity[i].set((0.8 + Math.random()) * currentDir.x, 0, (0.8 + Math.random()) * currentDir.z);
                        info.acc[i].set(-currentDir.x * 0.0018, 0.0008, -currentDir.z * 0.0018);
                        positionsAttribute.setXYZ(
                            i, 
                            localPlayer.position.x + 1.2 * currentDir.x + (Math.random() - 0.5) * 0.2 , 
                            localPlayer.position.y - localPlayer.avatar.height, 
                            localPlayer.position.z + 1.2 * currentDir.z + (Math.random() - 0.5) * 0.2
                        );
                        euler.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
                        quaternion.setFromEuler(euler);
                        quaternionAttribute.setXYZW(i, quaternion.x, quaternion.y, quaternion.z, quaternion.w);
                        brokenAttribute.setX(i, Math.random() - 0.6);
                        opacityAttribute.setX(i, 1);
                        info.velocity[i].divideScalar(20);
                    }
                }
                for (let i = 0; i < particleCount; i++){
                    if(brokenAttribute.getX(i) < 1){
                        positionsAttribute.setXYZ(  i, 
                                                    positionsAttribute.getX(i) + info.velocity[i].x, 
                                                    positionsAttribute.getY(i) + info.velocity[i].y, 
                                                    positionsAttribute.getZ(i) + info.velocity[i].z
                        );
                        scalesAttribute.setXYZ(i, scalesAttribute.getX(i) * 1.03, scalesAttribute.getY(i) * 1.03, scalesAttribute.getZ(i) * 1.03);
                        brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.042);
                        opacityAttribute.setX(i, opacityAttribute.getX(i) - 0.02);
                        info.velocity[i].add(info.acc[i]);
                    }
                    else{
                        count++;
                    }
                }
                scalesAttribute.needsUpdate = true;
                positionsAttribute.needsUpdate = true;
                opacityAttribute.needsUpdate = true;
                brokenAttribute.needsUpdate = true;
                quaternionAttribute.needsUpdate = true;
                if(!material.uniforms.noiseMap.value){
                    material.uniforms.noiseMap.value = particleTexture[nameSpec.indexOf('noise')];
                }
                
    
            }
            if(lastStopSw === 1  && narutoRunTime === 0){
                lastStopSw = 0;
            }
            if(count >= particleCount){
                if(sonicBoomInApp){
                    // console.log('remove dust');
                    app.remove(mesh);
                    sonicBoomInApp=false;
                }
            }
            app.updateMatrixWorld();
        });

    }
  app.setComponent('renderPriority', 'low');
  
  return app;
};


