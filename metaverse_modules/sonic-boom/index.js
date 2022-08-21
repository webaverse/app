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
  const textureLoader = new THREE.TextureLoader();
  const wave2 = textureLoader.load(`${baseUrl}/textures/wave2.jpeg`);
  const wave20 = textureLoader.load(`${baseUrl}/textures/wave20.png`);
  const wave9 = textureLoader.load(`${baseUrl}/textures/wave9.png`);
  const textureR = textureLoader.load(`${baseUrl}/textures/r.jpg`);
  const textureG = textureLoader.load(`${baseUrl}/textures/g.jpg`);
  const textureB = textureLoader.load(`${baseUrl}/textures/b.jpg`);
  const electronicballTexture = textureLoader.load(`${baseUrl}/textures/electronic-ball2.png`);
  const noiseMap = textureLoader.load(`${baseUrl}/textures/noise.jpg`);

  let currentDir = new THREE.Vector3();
  // ################################################ trace narutoRun Time ########################################
  {
    const localVector = new THREE.Vector3();
    useFrame(() => {
      localVector.x = 0;
      localVector.y = 0;
      localVector.z = -1;
      currentDir = localVector.applyQuaternion(localPlayer.quaternion);
      currentDir.normalize();
      if (localPlayer.hasAction('narutoRun')) {
        narutoRunTime++;
        lastStopSw = 1;
      } else {
        narutoRunTime = 0;
      }
    });
  }

  // ################################################# front wave #################################################
  {
    const geometry = new THREE.SphereBufferGeometry(1.4, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.4);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          type: 'f',
          value: 0.0,
        },
        color: {
          value: new THREE.Vector3(0.400, 0.723, 0.910),
        },
        strength: {
          value: 0.01,
        },
        perlinnoise: {
          type: 't',
          value: wave2,
        },

      },
      vertexShader: `\
              
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
           
          
            varying vec2 vUv;
    
            void main() {
                vUv = uv;
                vec3 pos = vec3(position.x,position.y,position.z);
                if(pos.y >= 1.87){
                    pos = vec3(position.x*(sin((position.y - 0.6)*1.27)-0.16),position.y,position.z*(sin((position.y - 0.6)*1.27)-0.16));
                } else{
                    pos = vec3(position.x*(sin((position.y/2. -  .01)*.11)+0.75),position.y,position.z*(sin((position.y/2. -  .01)*.11)+0.75));
                }
                gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 ); 
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }`,
      fragmentShader: `\
            
            
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            varying vec2 vUv;
            uniform sampler2D perlinnoise;
            uniform vec3 color;
            uniform float strength;
            uniform float uTime;
        
            vec3 rgbcol(vec3 col) {
                return vec3(col.r/255.,col.g/255.,col.b/255.);
            }
        
            void main() {
                vec3 noisetex = texture2D(perlinnoise,vec2(vUv.x,mod(vUv.y+(20.*uTime),1.))).rgb;    
                gl_FragColor = vec4(noisetex.rgb,1.0);
        
                if(gl_FragColor.r >= 0.5){
                    gl_FragColor = vec4(color,(0.9-vUv.y)/3.);
                }else{
                    gl_FragColor = vec4(0.,0.,1.,0.);
                }
                gl_FragColor *= vec4(sin(vUv.y) - strength);
                gl_FragColor *= vec4(smoothstep(0.01,0.928,vUv.y));
                gl_FragColor.b*=20.;
                gl_FragColor.a*=20.;
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

    const material2 = new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          type: 'f',
          value: 0.0,
        },
        perlinnoise: {
          type: 't',
          value: wave20,
        },
        strength: {
          value: 0.01,
        },
        color: {
          value: new THREE.Vector3(0.25, 0.45, 1.25),
        },

      },
      vertexShader: `\
              
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
           
          
            varying vec2 vUv;
            varying vec3 vPos;
    
            void main() {
                vUv = uv;
                vPos=position;
                vec3 pos = vec3(position.x,position.y,position.z);
                if(pos.y >= 1.87){
                    pos = vec3(position.x*(sin((position.y - 0.6)*1.27)-0.16),position.y,position.z*(sin((position.y - 0.6)*1.27)-0.16));
                } else{
                    pos = vec3(position.x*(sin((position.y/2. -  .01)*.11)+0.75),position.y,position.z*(sin((position.y/2. -  .01)*.11)+0.75));
                }
                gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 ); 
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }`,
      fragmentShader: `\
            
            ${THREE.ShaderChunk.emissivemap_pars_fragment}
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            varying vec2 vUv;
            varying vec3 vPos;
            uniform sampler2D perlinnoise;
            uniform vec3 color;
            uniform float uTime;
            uniform float strength;
            
                  #define PI 3.1415926
    
                  float pat(vec2 uv,float p,float q,float s,float glow)
                  {
                      float z =  cos(p * uv.y/0.5) + cos(q  * uv.y/2.2) ;
    
                      z += mod((uTime*100.0 + uv.x+uv.y * s*10.)*0.5,5.0);	// +wobble
                      float dist=abs(z)*(.1/glow);
                      return dist;
                  }
    
           
            void main() {
                        
    
    
                vec2 uv = vPos.zy;
                float d = pat(uv, 1.0, 2.0, 10.0, 0.35);		
                vec3 col = color*0.5/d;
                vec4 fragColor = vec4(col,1.0);
    
                vec3 noisetex = texture2D(
                    perlinnoise,
                    mod(1.*vec2(1.*vUv.x+uTime*10.,1.5*vUv.y + uTime*10.),1.)
                ).rgb; 
    
                gl_FragColor = vec4(noisetex.rgb,1.0);
                
                if(gl_FragColor.r >= 0.1){
                   gl_FragColor = fragColor;
                }else{
                    gl_FragColor = vec4(0.,0.,1.,0.);
                }
                
                gl_FragColor *= vec4(sin(vUv.y) - strength);
                gl_FragColor *= vec4(smoothstep(0.01,0.928,vUv.y));
                gl_FragColor.xyz /=4.;
                gl_FragColor.b*=2.;
                gl_FragColor.a*=20.;
    
                
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                ${THREE.ShaderChunk.emissivemap_fragment}
            }`,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,

      clipping: false,
      fog: false,
      lights: false,
    });
    material2.freeze();

    const frontwave = new THREE.Mesh(geometry, material);
    frontwave.position.y = 0;
    frontwave.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -90 * Math.PI / 180);

    const frontwave2 = new THREE.Mesh(geometry, material2);
    frontwave2.position.y = 0;
    frontwave2.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -90 * Math.PI / 180);

    const group = new THREE.Group();
    group.add(frontwave);
    group.add(frontwave2);
    // app.add(group);

    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime > 10) {
        // console.log('sonic-boom-frontwave');
        if (!sonicBoomInApp) {
          // console.log('add-frontWave');
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
        material2.uniforms.uTime.value = timestamp / 10000;
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-frontWave');
          app.remove(group);
          sonicBoomInApp = false;
        }
        // group.scale.set(0,0,0);
      }

      // material.uniforms.strength.value=Math.sin(timestamp/1000);
      // material2.uniforms.strength.value=Math.sin(timestamp/1000);

      // material2.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
      // app.updateMatrixWorld();
    });
  }
  // ########################################## wind #############################################
  {
    const group = new THREE.Group();
    const vertrun = `
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            varying vec2 vUv;
            void main() {
                vUv = uv;
                vec3 pos = vec3(position.x,position.y,position.z);
                gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `;

    const fragrun = `
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            varying vec2 vUv;
            uniform sampler2D perlinnoise;
            uniform vec3 color4;
            uniform float uTime;
            varying vec3 vNormal;
            vec3 rgbcol(vec3 col) {
                return vec3(col.r/255.,col.g/255.,col.b/255.);
            }
            void main() {
                vec3 noisetex = texture2D(
                    perlinnoise,
                    vec2(
                        mod(1.*vUv.x+(2.),1.),
                        mod(.5*vUv.y+(40.*uTime),1.)
                        
                    )
                ).rgb;      
                gl_FragColor = vec4(noisetex.rgb,1.0);
                if(gl_FragColor.r >= 0.8){
                    gl_FragColor = vec4(vec3(1.,1.,1.),(0.9-vUv.y)/2.);
                }else{
                    gl_FragColor = vec4(0.,0.,1.,0.);
                }
                gl_FragColor *= vec4(smoothstep(0.2,0.628,vUv.y));
                ${THREE.ShaderChunk.logdepthbuf_fragment}
            
                
            }
        `;
    let windMaterial;
    function windEffect() {
      const geometry = new THREE.CylinderBufferGeometry(0.5, 0.9, 5.3, 50, 50, true);
      windMaterial = new THREE.ShaderMaterial({
        uniforms: {
          perlinnoise: {
            type: 't',
            value: wave2,
          },
          color4: {
            value: new THREE.Vector3(200, 200, 200),
          },
          uTime: {
            type: 'f',
            value: 0.0,
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
      // const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
      const mesh = new THREE.Mesh(geometry, windMaterial);
      mesh.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -90 * Math.PI / 180);

      group.add(mesh);

      // mesh.scale.set(1.5, 1.7, 1.5);
      // app.add(group);
    }
    windEffect();

    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime > 10) {
        // console.log('sonic-boom-wind');
        if (!sonicBoomInApp) {
          // console.log('add-wind');
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
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-wind');
          app.remove(group);
          sonicBoomInApp = false;
        }
        // group.scale.set(0,0,0);
      }

      // app.updateMatrixWorld();
    });
  }
  // ########################################## flame ##########################################
  {
    const group = new THREE.Group();
    const vertflame = `
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 playerRotation;
            uniform float strength;
            uniform sampler2D perlinnoise;
            void main() {
                vUv = uv*strength;
                
                vec3 pos = vec3(position.x,position.y,position.z);
                vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*40.,vUv.x + uTime*1.),1.)).rgb;
                if(pos.y >= 1.87){
                    pos = vec3(position.x*(sin((position.y - 0.64)*1.27)-0.12),position.y,position.z*(sin((position.y - 0.64)*1.27)-0.12));
                } else{
                    pos = vec3(position.x*(sin((position.y/2. -  .01)*.11)+0.79),position.y,position.z*(sin((position.y/2. -  .01)*.11)+0.79));
                }
                mat3 rotZ;
                
                float ry=playerRotation.z;
                
                float lerp=mix(ry,playerRotation.x,pow(vUv.y,1.)/1.);
                 
                if(abs((ry/PI*180.)-(playerRotation.x/PI*180.))>75.){
                    lerp=mix(playerRotation.x,playerRotation.x,pow(vUv.y,1.)/1.); 
                }   
                rotZ = mat3(
                    cos(lerp), sin(lerp), 0.0,
                    -sin(lerp), cos(lerp), 0.0, 
                    0.0, 0.0 , 1.0
                );
                
                pos.xz *= noisetex.r;
                pos *= rotZ;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `;

    const fragflame = `
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            varying vec2 vUv;
            uniform sampler2D perlinnoise;
            uniform float uTime;
            
            uniform vec3 color;
            varying vec3 vNormal;
            
            void main() {
                vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*2.,vUv.x - uTime*1.),1.)).rgb;
        
                gl_FragColor = vec4(noisetex.r);
                if(gl_FragColor.r >= 0.1){
                    gl_FragColor = vec4(color,gl_FragColor.r);
                }
                else{
                    gl_FragColor = vec4(0.);
                }
                gl_FragColor *= vec4(smoothstep(0.2,0.628,vUv.y));
                gl_FragColor.xyz/=1.5;
                gl_FragColor.a*=(1.-vUv.y)*5.;
                //gl_FragColor.a/=2.;
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                
            }
        `;

    let flameMaterial;
    function flame() {
      const geometry = new THREE.CylinderBufferGeometry(0.5, 0.1, 4.5, 50, 50, true);
      flameMaterial = new THREE.ShaderMaterial({
        uniforms: {
          perlinnoise: {
            type: 't',
            value: wave9,
          },
          color: {
            value: new THREE.Vector3(0.120, 0.280, 1.920),
          },
          uTime: {
            type: 'f',
            value: 0.0,
          },
          playerRotation: {
            value: new THREE.Vector3(localPlayer.rotation.y, localPlayer.rotation.y, localPlayer.rotation.y),
          },
          strength: {
            type: 'f',
            value: 0.0,
          },
        },
        // wireframe:true,
        vertexShader: vertflame,
        fragmentShader: fragflame,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,

        clipping: false,
        fog: false,
        lights: false,
      });
      flameMaterial.freeze();

      const mesh = new THREE.Mesh(geometry, flameMaterial);
      mesh.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -90 * Math.PI / 180);
      group.add(mesh);
      // app.add(group);
    }
    flame();

    const playerRotation = [0, 0, 0, 0, 0];
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime > 10) {
        if (!sonicBoomInApp) {
          // console.log('add-flame');
          app.add(group);
          sonicBoomInApp = true;
        }
        group.scale.set(1, 1, 1);
        flameMaterial.uniforms.strength.value = 1.0;
      } else {
        if (flameMaterial.uniforms.strength.value > 0) { flameMaterial.uniforms.strength.value -= 0.025; }
      }
      if (flameMaterial.uniforms.strength.value > 0) {
        // console.log('sonic-boom-flame');
        group.position.copy(localPlayer.position);
        if (localPlayer.avatar) {
          group.position.y -= localPlayer.avatar.height;
          group.position.y += 0.65;
        }

        group.position.x -= 2.2 * currentDir.x;
        group.position.z -= 2.2 * currentDir.z;
        flameMaterial.uniforms.uTime.value = timestamp / 20000;

        if (Math.abs(localPlayer.rotation.x) > 0) {
          let temp = localPlayer.rotation.y + Math.PI;
          for (let i = 0; i < 5; i++) {
            const temp2 = playerRotation[i];
            playerRotation[i] = temp;
            temp = temp2;
          }
        } else {
          let temp = -localPlayer.rotation.y;
          for (let i = 0; i < 5; i++) {
            const temp2 = playerRotation[i];
            playerRotation[i] = temp;
            temp = temp2;
          }
        }

        flameMaterial.uniforms.playerRotation.value.set(playerRotation[0], 0, playerRotation[4]);
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-flame');
          app.remove(group);
          sonicBoomInApp = false;
        }
      }

      // app.updateMatrixWorld();
    });
  }
  // ########################################## lightning ##########################################
  {
    const group = new THREE.Group();
    const vertlightning = `
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            varying vec2 vUv;
            uniform float uTime;
            uniform vec3 playerRotation;
            uniform float strength;
            uniform sampler2D perlinnoise;
            void main() {
                vUv = uv*strength;
                
                vec3 pos = vec3(position.x,position.y,position.z);
                vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*40.,vUv.x + uTime*1.),1.)).rgb;
                if(pos.y >= 1.87){
                    pos = vec3(position.x*(sin((position.y - 0.64)*1.27)-0.12),position.y,position.z*(sin((position.y - 0.64)*1.27)-0.12));
                } else{
                    pos = vec3(position.x*(sin((position.y/2. -  .01)*.11)+0.79),position.y,position.z*(sin((position.y/2. -  .01)*.11)+0.79));
                }
                mat3 rotZ;
                
                float ry=playerRotation.z;
                
                float lerp=mix(ry,playerRotation.x,pow(vUv.y,1.)/1.);
                 
                if(abs((ry/PI*180.)-(playerRotation.x/PI*180.))>75.){
                    lerp=mix(playerRotation.x,playerRotation.x,pow(vUv.y,1.)/1.); 
                }   
                rotZ = mat3(
                    cos(lerp), sin(lerp), 0.0,
                    -sin(lerp), cos(lerp), 0.0, 
                    0.0, 0.0 , 1.0
                );
                
                pos.xz *= noisetex.r;
                pos *= rotZ;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }
        `;

    const fraglightning = `
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            varying vec2 vUv;
            uniform sampler2D perlinnoise;
            uniform float uTime;
            uniform float random;
            uniform vec3 color;
            varying vec3 vNormal;
            #define PI 3.1415926

            float pat(vec2 uv,float p,float q,float s,float glow)
            {
                float t =abs(cos(uTime))+1.;
                float z = cos(q *random * uv.x) * cos(p *random * uv.y) + cos(q * random * uv.y) * cos(p * random * uv.x);

                z += sin(uTime*50.0 - uv.y-uv.y * s)*0.35;	
                float dist=abs(z)*(5./glow);
                return dist;
            }
            void main() {
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
                gl_FragColor *= vec4(smoothstep(0.2,0.628,vUv.y));
                gl_FragColor.a*=(1.-vUv.y)*5.;
                //gl_FragColor.a*=cos(uTime*10.);
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                
            }
        `;

    let lightningMaterial;
    function lightning() {
      const geometry = new THREE.CylinderBufferGeometry(0.65, 0.15, 4.5, 50, 50, true);
      lightningMaterial = new THREE.ShaderMaterial({
        uniforms: {
          perlinnoise: {
            type: 't',
            value: wave9,
          },
          color: {
            value: new THREE.Vector3(0.120, 0.280, 1.920),
          },
          uTime: {
            type: 'f',
            value: 0.0,
          },
          random: {
            type: 'f',
            value: 0.0,
          },
          playerRotation: {
            value: new THREE.Vector3(localPlayer.rotation.y, localPlayer.rotation.y, localPlayer.rotation.y),
          },
          strength: {
            type: 'f',
            value: 0.0,
          },
        },
        // wireframe:true,
        vertexShader: vertlightning,
        fragmentShader: fraglightning,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,

        clipping: false,
        fog: false,
        lights: false,
      });
      lightningMaterial.freeze();

      const mesh = new THREE.Mesh(geometry, lightningMaterial);
      mesh.setRotationFromAxisAngle(new THREE.Vector3(1, 0, 0), -90 * Math.PI / 180);
      group.add(mesh);
      // app.add(group);
    }
    lightning();

    const playerRotation = [];
    let lightningfreq = 0;
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime > 10) {
        if (!sonicBoomInApp) {
          // console.log('add-lightning');
          app.add(group);
          sonicBoomInApp = true;
        }
        group.scale.set(1, 1, 1);
        lightningMaterial.uniforms.strength.value = 1.0;
      } else {
        if (lightningMaterial.uniforms.strength.value > 0) { lightningMaterial.uniforms.strength.value -= 0.025; }
      }
      if (lightningMaterial.uniforms.strength.value > 0) {
        // console.log('sonic-boom-lightning');
        group.position.copy(localPlayer.position);
        if (localPlayer.avatar) {
          group.position.y -= localPlayer.avatar.height;
          group.position.y += 0.65;
        }

        group.position.x -= 2.2 * currentDir.x;
        group.position.z -= 2.2 * currentDir.z;
        lightningMaterial.uniforms.uTime.value = timestamp / 20000;
        if (Math.abs(localPlayer.rotation.x) > 0) {
          let temp = localPlayer.rotation.y + Math.PI;
          for (let i = 0; i < 5; i++) {
            const temp2 = playerRotation[i];
            playerRotation[i] = temp;
            temp = temp2;
          }
        } else {
          let temp = -localPlayer.rotation.y;
          for (let i = 0; i < 5; i++) {
            const temp2 = playerRotation[i];
            playerRotation[i] = temp;
            temp = temp2;
          }
        }
        lightningMaterial.uniforms.playerRotation.value.set(playerRotation[0], 0, playerRotation[4]);

        if (lightningfreq % 1 === 0) {
          lightningMaterial.uniforms.random.value = Math.random() * Math.PI;
        }

        lightningfreq++;
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-lightning');
          app.remove(group);
          sonicBoomInApp = false;
        }
      }

      // app.updateMatrixWorld();
    });
  }
  // ########################################## vertical trail ######################################
  {
    const planeGeometry = new THREE.BufferGeometry();
    const planeNumber = 100;
    const position = new Float32Array(18 * planeNumber);
    planeGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3));

    const uv = new Float32Array(12 * planeNumber);
    let fraction = 1;
    const ratio = 1 / planeNumber;
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

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: 0,
        },
        opacity: {
          value: 0,
        },
        textureR: {type: 't', value: textureR},
        textureG: {type: 't', value: textureG},
        textureB: {type: 't', value: textureB},
        t: {value: 0.9},
      },
      vertexShader: `\
                 
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
               
             
                uniform float uTime;
        
                varying vec2 vUv;
               
                void main() {
                  vUv=uv;
                  vUv.y*=1.0;
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
              uniform sampler2D textureR;
              uniform sampler2D textureG;
              uniform sampler2D textureB;
              uniform float uTime;
              uniform float opacity;
              varying vec2 vUv;
              void main() {
                  
      
                  vec3 texColorR = texture2D(
                      textureR,
                      vec2(
                          mod(1.*vUv.x+uTime*5.,1.),
                          mod(2.*vUv.y+uTime*5.,1.)
                          
                      )
                  ).rgb;  
                  vec3 texColorG = texture2D(
                      textureG,
                      vec2(
                          mod(1.*vUv.x+uTime*5.,1.),
                          mod(2.*vUv.y+uTime*5.,1.)
                          
                      )
                  ).rgb;  
                  vec3 texColorB = texture2D(
                      textureB,
                      vec2(
                          mod(1.*vUv.x,1.),
                          mod(2.5*vUv.y+uTime*2.5,1.)
                          
                      )
                  ).rgb;  
                  gl_FragColor = vec4(texColorB.b)*((vec4(texColorR.r)+vec4(texColorG.g))/2.);
                  
    
                  if( gl_FragColor.b >= 0.1 ){
                      gl_FragColor = vec4(mix(vec3(0.020, 0.180, 1.920),vec3(0.284, 0.922, 0.980),gl_FragColor.b),gl_FragColor.b);
                  }else{
                      gl_FragColor = vec4(0.);
                  }
                   gl_FragColor *= vec4(sin(vUv.y) - 0.1);
                   gl_FragColor *= vec4(smoothstep(0.3,0.628,vUv.y));
                   if(abs(vUv.x)>0.9 || abs(vUv.x)<0.1)
                        gl_FragColor.a=0.;
                    
                    gl_FragColor.a*=3.;
                    gl_FragColor.a*=opacity;
                    //gl_FragColor.a*=(1.-vUv.y)*5.;
                    //gl_FragColor = vec4(vec3(texColor), texColor.b);
                    //gl_FragColor.a*=(vUv.x)*5.;
                    //gl_FragColor = vec4(vUv, 1.0, 1.0);
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

    const plane = new THREE.Mesh(planeGeometry, material);
    // app.add(plane);
    plane.position.y = 1;
    plane.frustumCulled = false;
    const temp = [];
    const temp2 = [];
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime >= 10) {
        if (!sonicBoomInApp) {
          // console.log('add-planeTrail1');
          app.add(plane);
          sonicBoomInApp = true;
        }
        material.uniforms.opacity.value = 1;
      } else {
        if (material.uniforms.opacity.value > 0) { material.uniforms.opacity.value -= 0.02; }
      }
      if (narutoRunTime > 0 && narutoRunTime < 10) {
        material.uniforms.opacity.value = 0;
      }
      if (material.uniforms.opacity.value > 0) {
        // console.log('sonic-boom-verticalPlane');
        for (let i = 0; i < 18; i++) {
          temp[i] = position[i];
        }
        for (let i = 0; i < planeNumber; i++) {
          if (i === 0) {
            position[0] = localPlayer.position.x;
            position[1] = localPlayer.position.y - 1.0;
            position[2] = localPlayer.position.z;
            if (localPlayer.avatar) {
              position[1] -= localPlayer.avatar.height;
              position[1] += 1.18;
            }
            position[3] = localPlayer.position.x;
            position[4] = localPlayer.position.y - 2.0;
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
            position[16] = localPlayer.position.y - 2.0;
            position[17] = localPlayer.position.z;
            if (localPlayer.avatar) {
              position[16] -= localPlayer.avatar.height;
              position[16] += 1.18;
            }
          } else {
            for (let j = 0; j < 18; j++) {
              temp2[j] = position[i * 18 + j];
              position[i * 18 + j] = temp[j];
              temp[j] = temp2[j];
            }
          }
        }

        plane.geometry.verticesNeedUpdate = true;
        plane.geometry.dynamic = true;
        plane.geometry.attributes.position.needsUpdate = true;

        material.uniforms.uTime.value = timestamp / 1000;
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-planeTrail1');
          app.remove(plane);
          sonicBoomInApp = false;
        }
      }

      // app.updateMatrixWorld();
    });
  }
  // ########################################## horizontal trail ######################################
  {
    const planeGeometry = new THREE.BufferGeometry();
    const planeNumber = 100;
    const position = new Float32Array(18 * planeNumber);
    planeGeometry.setAttribute('position', new THREE.BufferAttribute(position, 3));

    const uv = new Float32Array(12 * planeNumber);
    let fraction = 1;
    const ratio = 1 / planeNumber;
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

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: {
          value: 0,
        },
        opacity: {
          value: 0,
        },
        textureR: {type: 't', value: textureR},
        textureG: {type: 't', value: textureG},
        textureB: {type: 't', value: textureB},
        t: {value: 0.9},
      },
      vertexShader: `\
                 
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
               
             
                uniform float uTime;
        
                varying vec2 vUv;
               
                void main() {
                  vUv=uv;
                  vUv.y*=1.0;
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
              uniform sampler2D textureR;
              uniform sampler2D textureG;
              uniform sampler2D textureB;
              uniform float uTime;
              uniform float opacity;
              varying vec2 vUv;
              void main() {
                  
      
                  vec3 texColorR = texture2D(
                      textureR,
                      vec2(
                          mod(1.*vUv.x+uTime*5.,1.),
                          mod(2.*vUv.y+uTime*5.,1.)
                          
                      )
                  ).rgb;  
                  vec3 texColorG = texture2D(
                      textureG,
                      vec2(
                          mod(1.*vUv.x+uTime*5.,1.),
                          mod(2.*vUv.y+uTime*5.,1.)
                          
                      )
                  ).rgb;  
                  vec3 texColorB = texture2D(
                      textureB,
                      vec2(
                          mod(1.*vUv.x,1.),
                          mod(2.5*vUv.y+uTime*2.5,1.)
                          
                      )
                  ).rgb;  
                  gl_FragColor = vec4(texColorB.b)*((vec4(texColorR.r)+vec4(texColorG.g))/2.);
                  
    
                  if( gl_FragColor.b >= 0.1 ){
                      gl_FragColor = vec4(mix(vec3(0.020, 0.180, 1.920),vec3(0.284, 0.922, 0.980),gl_FragColor.b),gl_FragColor.b);
                  }else{
                      gl_FragColor = vec4(0.);
                  }
                   gl_FragColor *= vec4(sin(vUv.y) - 0.1);
                   gl_FragColor *= vec4(smoothstep(0.3,0.628,vUv.y));
                   if(abs(vUv.x)>0.9 || abs(vUv.x)<0.1)
                        gl_FragColor.a=0.;
                    
                    gl_FragColor.a*=3.;
                    gl_FragColor.a*=opacity;
                    
                  //gl_FragColor = vec4(vec3(texColor), texColor.b);
                  //gl_FragColor.a*=(vUv.x)*5.;
                  //gl_FragColor = vec4(vUv, 1.0, 1.0);
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

    const plane = new THREE.Mesh(planeGeometry, material);
    // app.add(plane);
    plane.position.y = 1;
    plane.frustumCulled = false;

    const point1 = new THREE.Vector3();
    const point2 = new THREE.Vector3();
    const localVector2 = new THREE.Vector3();
    const temp = [];
    const temp2 = [];
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime >= 10) {
        if (!sonicBoomInApp) {
          // console.log('add-planeTrail2');
          app.add(plane);
          sonicBoomInApp = true;
        }
        material.uniforms.opacity.value = 1;
      } else {
        if (material.uniforms.opacity.value > 0) { material.uniforms.opacity.value -= 0.0255; }
      }
      if (narutoRunTime > 0 && narutoRunTime < 10) {
        material.uniforms.opacity.value = 0;
      }
      if (material.uniforms.opacity.value > 0) {
        // console.log('sonic-boom-horiPlane');

        localVector2.set(currentDir.x, currentDir.y, currentDir.z).applyQuaternion(quaternion);

        point1.x = localPlayer.position.x;
        point1.y = localPlayer.position.y;
        point1.z = localPlayer.position.z;
        point2.x = localPlayer.position.x;
        point2.y = localPlayer.position.y;
        point2.z = localPlayer.position.z;

        point1.x -= 0.6 * localVector2.x;
        point1.z -= 0.6 * localVector2.z;
        point2.x += 0.6 * localVector2.x;
        point2.z += 0.6 * localVector2.z;

        for (let i = 0; i < 18; i++) {
          temp[i] = position[i];
        }
        for (let i = 0; i < planeNumber; i++) {
          if (i === 0) {
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
          } else {
            for (let j = 0; j < 18; j++) {
              temp2[j] = position[i * 18 + j];
              position[i * 18 + j] = temp[j];
              temp[j] = temp2[j];
            }
          }
        }

        plane.geometry.verticesNeedUpdate = true;
        plane.geometry.dynamic = true;
        plane.geometry.attributes.position.needsUpdate = true;
        material.uniforms.uTime.value = timestamp / 1000;
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-planeTrail2');
          app.remove(plane);
          sonicBoomInApp = false;
        }
      }

      // app.updateMatrixWorld();
    });
  }
  // ##################################### mainBall ####################################################
  {
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 50;

    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = 2 * Math.PI * Math.random();
      const phi = 2 * Math.PI * Math.random();

      positions[i * 3 + 0] = 0.1 * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = 0.1 * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = 0.1 * Math.cos(theta);
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.ShaderMaterial({
      uniforms: {
        opacity: {
          value: 1,
        },
        uPixelRatio: {
          value: Math.min(window.devicePixelRatio, 2),
        },
        uSize: {
          value: 1,
        },
        uAvatarPos: {
          value: new THREE.Vector3(0, 0, 0),
        },
        uCameraFov: {
          value: 1,
        },

      },
      vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                
                uniform float uPixelRatio;
                uniform float uSize;
                uniform float uCameraFov;
                
                varying vec2 vUv;
                varying vec3 vPos;
                
                void main() { 
                gl_PointSize = (1000.)*uSize;
                gl_PointSize *= (uCameraFov);
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                vPos=modelPosition.xyz;
                vec4 viewPosition = viewMatrix * modelPosition;
                vec4 projectionPosition = projectionMatrix * viewPosition;
                gl_Position = projectionPosition;

                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                bool isPerspective = ( projectionMatrix[ 2 ][ 3 ] == - 1.0 );
                    if ( isPerspective ) gl_PointSize *= (1.0 / - viewPosition.z);

                ${THREE.ShaderChunk.logdepthbuf_vertex}
                }
            `,
      fragmentShader: `\
                
                
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                
                varying vec3 vPos;
                uniform vec3 uAvatarPos;
                uniform float opacity;
                
                void main() {
                
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float light = 0.05 / distanceToCenter - 0.1;
                    if(opacity<=0.)
                        gl_FragColor = vec4(0.3984,0.4921,0.765625, light);
                    else
                        gl_FragColor = vec4(0.3984,0.3921,0.465625, light);
                    if(opacity<=0.)
                        gl_FragColor.a*=1.-(distance(uAvatarPos,vPos)+.5);
                    gl_FragColor.a-=opacity*0.5*distanceToCenter;
                    gl_FragColor.xyz-=opacity*.8;
                
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
    particlesMaterial.freeze();

    const mainBall = new THREE.Points(particlesGeometry, particlesMaterial);
    // app.add(mainBall);
    // app.updateMatrixWorld();

    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime > 0) {
        if (!sonicBoomInApp) {
          // console.log('add-mainBall');
          app.add(mainBall);
          sonicBoomInApp = true;
        }
        if (narutoRunTime === 1) {
          mainBall.material.uniforms.uSize.value = 4.5;
        } else {
          if (mainBall.material.uniforms.uSize.value > 1) {
            mainBall.material.uniforms.uSize.value /= 1.1;
          } else {
            mainBall.material.uniforms.uSize.value = 1;
          }
        }
        mainBall.scale.x = 1;
        mainBall.scale.y = 1;
        mainBall.scale.z = 1;
        mainBall.material.uniforms.opacity.value = 0;
      } else {
        if (mainBall.material.uniforms.opacity.value < 1) {
          mainBall.scale.x -= 0.1;
          mainBall.scale.y -= 0.1;
          mainBall.scale.z -= 0.1;
          mainBall.material.uniforms.opacity.value += 0.02;
        }
      }
      if (mainBall.material.uniforms.opacity.value < 1) {
        // console.log('sonic-boom-mainBall');
        mainBall.position.copy(localPlayer.position);

        if (localPlayer.avatar) {
          mainBall.position.y -= localPlayer.avatar.height;
          mainBall.position.y += 0.65;
        }
        mainBall.material.uniforms.uAvatarPos.value = mainBall.position;
        mainBall.material.uniforms.uCameraFov.value = Math.pow(60 / camera.fov, 1.45);
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-mainBall');
          app.remove(mainBall);
          sonicBoomInApp = false;
        }
      }

      // app.updateMatrixWorld();
    });
  }

  // ##################################### electricity1 ##################################################
  {
    const electricityGeometry = new THREE.PlaneBufferGeometry(3.0, 3.0);
    const instGeom = new THREE.InstancedBufferGeometry().copy(electricityGeometry);

    const num = 40;
    const instPos = [];
    const instId = [];
    const instAngle = [];
    for (let i = 0; i < num; i++) {
      instPos.push(0, 0, 0);
      instId.push(i);
      instAngle.push(Math.random() * i, Math.random() * i, Math.random() * i);
    }
    instGeom.setAttribute('instPos', new THREE.InstancedBufferAttribute(new Float32Array(instPos), 3));
    instGeom.setAttribute('instId', new THREE.InstancedBufferAttribute(new Float32Array(instId), 1));
    instGeom.setAttribute('instAngle', new THREE.InstancedBufferAttribute(new Float32Array(instAngle), 3));
    instGeom.instanceCount = num;

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`${baseUrl}/textures/texture8.png`);
    const electricityMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sphereNum: {value: num},
        uTime: {value: 0},
        opacity: {value: 0},
        size: {value: 0},
        random: {value: 0},
        glowIndex: {value: 0},
        uTexture: {
          type: 't',
          value: texture,
        },

      },
      vertexShader: `
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                uniform float uTime;
                uniform float sphereNum;
                uniform float size;

                attribute vec3 instPos;
                attribute vec3 instAngle;
                attribute float instId;
            
                varying vec2 vUv;
                varying float vId;
                
                
                void main() {
                    mat3 rotX =
                            mat3(1.0, 0.0, 0.0, 0.0, cos(instAngle.x), sin(instAngle.x), 0.0, -sin(instAngle.x), cos(instAngle.x));
                    mat3 rotY =
                            mat3(cos(instAngle.y), 0.0, -sin(instAngle.y), 0.0, 1.0, 0.0, sin(instAngle.y), 0.0, cos(instAngle.y));
                    mat3 rotZ =
                            mat3(
                                cos(instAngle.z), sin(instAngle.z), 0.0,
                                -sin(instAngle.z), cos(instAngle.z), 0.0, 
                                0.0, 0.0 , 1.0
                            );
                        
                    vUv=uv;
                    vId=instId;
                    vec3 pos = vec3(position);
                    pos += instPos;
                    pos*=rotX;
                    pos*=rotY;
                    pos*=rotZ;
                    pos*=0.8*cos(uTime*100.);
                    pos*=size;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }
            `,
      fragmentShader: `
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                uniform float uTime;
                uniform float random;
                uniform float sphereNum;
                uniform float glowIndex;
                uniform float opacity;

                uniform sampler2D uTexture;
                
                varying vec2 vUv;
                varying float vId;
                
                void main() {
                    vec4 tex = texture2D(uTexture,vUv).rgba;   
                    if( tex.a < 0.01  )
                    {
                        discard;    
                    } 
                           
                    gl_FragColor=vec4(1.0,1.0,1.,tex.a);
                    gl_FragColor.a/=2.;
                    if(vId>=glowIndex-0.01 && vId<=glowIndex+0.09)
                        gl_FragColor.a*=1.;
                    else
                        gl_FragColor.a*=0.;
                    gl_FragColor.r=abs(sin(uTime));
                    gl_FragColor.g=abs(sin(uTime));
                    gl_FragColor.b=abs(cos(uTime));
                    if(glowIndex>sphereNum/2.)
                        gl_FragColor.a*=5.;
                    gl_FragColor.a*=opacity;
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
    electricityMaterial.freeze();

    const electricity = new THREE.Mesh(instGeom, electricityMaterial);
    const group = new THREE.Group();
    group.add(electricity);
    // app.add(group);
    let lightningfreq = 0;
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime === 0) {
        if (electricityMaterial.uniforms.opacity.value > 0.01) {
          electricityMaterial.uniforms.opacity.value /= 1.08;
          electricityMaterial.uniforms.size.value /= 1.01;
        }
      } else if (narutoRunTime === 1) {
        if (!sonicBoomInApp) {
          // console.log('add-electricity1');
          app.add(group);
          sonicBoomInApp = true;
        }
        electricityMaterial.uniforms.opacity.value = 1;
        electricityMaterial.uniforms.size.value = 4.5;
      } else if (narutoRunTime > 1) {
        if (electricityMaterial.uniforms.size.value > 1) {
          electricityMaterial.uniforms.size.value /= 1.1;
        } else {
          electricityMaterial.uniforms.size.value = 1;
        }
      }
      if (electricityMaterial.uniforms.opacity.value > 0.01) {
        group.rotation.copy(localPlayer.rotation);
        group.position.copy(localPlayer.position);

        group.position.x += 0.1 * currentDir.x;
        group.position.z += 0.1 * currentDir.z;

        if (localPlayer.avatar) {
          group.position.y -= localPlayer.avatar.height;
          group.position.y += 0.65;
        }
        electricityMaterial.uniforms.uTime.value = timestamp / 100;
        if (lightningfreq % 1 === 0) {
          electricityMaterial.uniforms.glowIndex.value = Math.floor(Math.random() * num);
        }

        lightningfreq++;
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-electricty1');
          app.remove(group);
          sonicBoomInApp = false;
        }
      }

      // app.updateMatrixWorld();
    });
  }
  // ##################################### electricity2 ##################################################
  {
    const electricityGeometry2 = new THREE.PlaneBufferGeometry(1.6, 1.6);
    const instGeom = new THREE.InstancedBufferGeometry().copy(electricityGeometry2);

    const num = 40;
    const instPos = [];
    const instId = [];
    const instAngle = [];
    for (let i = 0; i < num; i++) {
      instPos.push(0, 0, 0);
      instId.push(i);
      instAngle.push(Math.random() * i, Math.random() * i, Math.random() * i);
    }
    instGeom.setAttribute('instPos', new THREE.InstancedBufferAttribute(new Float32Array(instPos), 3));
    instGeom.setAttribute('instId', new THREE.InstancedBufferAttribute(new Float32Array(instId), 1));
    instGeom.setAttribute('instAngle', new THREE.InstancedBufferAttribute(new Float32Array(instAngle), 3));
    instGeom.instanceCount = num;

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(`${baseUrl}/textures/texture11.png`);
    const electricityMaterial = new THREE.ShaderMaterial({
      uniforms: {
        sphereNum: {value: num},
        uTime: {value: 0},
        opacity: {value: 0},
        size: {value: 0},
        random: {value: 0},
        glowIndex: {value: 0},
        uTexture: {
          type: 't',
          value: texture,
        },

      },
      vertexShader: `
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                uniform float uTime;
                uniform float sphereNum;
                uniform float size;

                attribute vec3 instPos;
                attribute vec3 instAngle;
                attribute float instId;
            
                varying vec2 vUv;
                varying float vId;
                
                
                void main() {
                    mat3 rotX =
                            mat3(1.0, 0.0, 0.0, 0.0, cos(instAngle.x), sin(instAngle.x), 0.0, -sin(instAngle.x), cos(instAngle.x));
                    mat3 rotY =
                            mat3(cos(instAngle.y), 0.0, -sin(instAngle.y), 0.0, 1.0, 0.0, sin(instAngle.y), 0.0, cos(instAngle.y));
                    mat3 rotZ =
                            mat3(
                                cos(instAngle.z), sin(instAngle.z), 0.0,
                                -sin(instAngle.z), cos(instAngle.z), 0.0, 
                                0.0, 0.0 , 1.0
                            );
                        
                    vUv=uv;
                    vId=instId;
                    vec3 pos = vec3(position);
                    pos += instPos;
                    pos*=rotX;
                    pos*=rotY;
                    pos*=rotZ;
                    //pos*=0.8*cos(uTime*100.);
                    pos*=size;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
                    ${THREE.ShaderChunk.logdepthbuf_vertex}
                }
            `,
      fragmentShader: `
                ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                uniform float uTime;
                uniform float opacity;
                uniform float random;
                uniform float sphereNum;
                uniform float glowIndex;

                uniform sampler2D uTexture;
                
                varying vec2 vUv;
                varying float vId;
                
                void main() {
                    vec4 tex = texture2D(uTexture,vUv).rgba;   
                    if( tex.a < 0.01  )
                    {
                        discard;    
                    } 
                           
                    gl_FragColor=vec4(1.0,1.0,1.,tex.a);
                    gl_FragColor.a/=2.;
                    if(vId>=glowIndex-0.01 && vId<=glowIndex+0.09)
                        gl_FragColor.a*=1.;
                    else
                        gl_FragColor.a*=0.;
                    gl_FragColor.r=abs(sin(uTime));
                    gl_FragColor.g=abs(sin(uTime));
                    gl_FragColor.b=abs(cos(uTime));
                    if(glowIndex>sphereNum/2.)
                        gl_FragColor.a*=5.;
                    gl_FragColor.a*=opacity;
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
    electricityMaterial.freeze();

    const electricity = new THREE.Mesh(instGeom, electricityMaterial);
    const group = new THREE.Group();
    group.add(electricity);
    // app.add(group);
    let lightningfreq = 0;
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime === 0) {
        if (electricityMaterial.uniforms.opacity.value > 0.01) {
          electricityMaterial.uniforms.opacity.value /= 1.08;
          electricityMaterial.uniforms.size.value /= 1.01;
        }
      } else if (narutoRunTime === 1) {
        if (!sonicBoomInApp) {
          // console.log('add-electricty2');
          app.add(group);
          sonicBoomInApp = true;
        }
        electricityMaterial.uniforms.opacity.value = 1;
        electricityMaterial.uniforms.size.value = 4.5;
      } else if (narutoRunTime > 1) {
        if (electricityMaterial.uniforms.size.value > 1) {
          electricityMaterial.uniforms.size.value /= 1.1;
        } else {
          electricityMaterial.uniforms.size.value = 1;
        }
      }
      if (electricityMaterial.uniforms.opacity.value > 0.01) {
        group.rotation.copy(localPlayer.rotation);
        group.position.copy(localPlayer.position);
        // localPlayer.getWorldDirection(localVector)
        // localVector.normalize();
        group.position.x += 0.1 * currentDir.x;
        group.position.z += 0.1 * currentDir.z;

        if (localPlayer.avatar) {
          group.position.y -= localPlayer.avatar.height;
          group.position.y += 0.65;
        }
        electricityMaterial.uniforms.uTime.value = timestamp / 100;
        if (lightningfreq % 1 === 0) {
          electricityMaterial.uniforms.glowIndex.value = Math.floor(Math.random() * num);
        }

        lightningfreq++;
      } else {
        if (sonicBoomInApp) {
          // console.log('remove-electricty2');
          app.remove(group);
          sonicBoomInApp = false;
        }
      }

      // app.updateMatrixWorld();
    });
  }
  // #################################### particle behind avatar 1 ###############################
  {
    const group = new THREE.Group();
    const particleCount = 2;
    const info = {
      velocity: [particleCount],
      rotate: [particleCount],
    };
    const acc = new THREE.Vector3(0, -0, 0);

    // ######## object #########
    let mesh = null;
    const dummy = new THREE.Object3D();

    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0x2167F2,
      map: electronicballTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    // particleMaterial.freeze();
    function addInstancedMesh() {
      mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.3), particleMaterial, particleCount);
      group.add(mesh);
      // app.add(group);
      setInstancedMeshPositions(mesh);
    }

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    function setInstancedMeshPositions(mesh1) {
      for (let i = 0; i < mesh1.count; i++) {
        mesh.getMatrixAt(i, matrix);
        dummy.scale.x = 0.00001;
        dummy.scale.y = 0.00001;
        dummy.scale.z = 0.00001;
        dummy.position.x = (Math.random()) * 0.2;
        dummy.position.y = -0.2;
        dummy.position.z = Math.random() * 10;
        info.velocity[i] = (new THREE.Vector3(
          0,
          0,
          1));
        info.velocity[i].divideScalar(20);
        info.rotate[i] = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5);
        dummy.updateMatrix();
        mesh1.setMatrixAt(i, dummy.matrix);
      }
      mesh1.instanceMatrix.needsUpdate = true;
    }
    addInstancedMesh();

    let sonicBoomInApp = false;
    const originPoint = new THREE.Vector3(0, 0, 0);
    useFrame(({timestamp}) => {
      if (mesh) {
        if (narutoRunTime > 0) {
          // console.log('sonic-boom-behind-particle')
          if (!sonicBoomInApp) {
            // console.log('add-particle1');
            app.add(group);
            sonicBoomInApp = true;
          }
          group.position.copy(localPlayer.position);
          group.rotation.copy(localPlayer.rotation);
          if (localPlayer.avatar) {
            group.position.y -= localPlayer.avatar.height;
            group.position.y += 0.65;
          }
          for (let i = 0; i < particleCount; i++) {
            mesh.getMatrixAt(i, matrix);
            position.setFromMatrixPosition(matrix);
            matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

            if (dummy.position.distanceTo(originPoint) > 5) {
              if (narutoRunTime > 0) {
                dummy.scale.x = 0.5;
                dummy.scale.y = 0.5;
                dummy.scale.z = 0.5;
              } else {
                dummy.scale.x = 0.00001;
                dummy.scale.y = 0.00001;
                dummy.scale.z = 0.00001;
              }

              dummy.position.x = (Math.random() - 0.5) * 0.2;
              dummy.position.y = (Math.random() - 0.5) * 0.2;
              dummy.position.z = 0;
              info.velocity[i].x = (Math.random() - 0.5) * 4;
              info.velocity[i].y = (Math.random() - 0.5) * 4;
              info.velocity[i].z = 10 + Math.random();
              info.velocity[i].divideScalar(20);
            }

            dummy.scale.x /= 1.04;
            dummy.scale.y /= 1.04;
            dummy.scale.z /= 1.04;

            if (narutoRunTime === 0) {
              dummy.scale.x /= 1.1;
              dummy.scale.y /= 1.1;
              dummy.scale.z /= 1.1;
            }
            dummy.rotation.copy(camera.rotation);
            if (localPlayer.rotation.x === 0) {
              dummy.rotation.y -= localPlayer.rotation.y;
            } else {
              dummy.rotation.y += localPlayer.rotation.y;
            }

            info.velocity[i].add(acc);
            dummy.position.add(info.velocity[i]);
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
            mesh.instanceMatrix.needsUpdate = true;
          }
        } else {
          if (sonicBoomInApp) {
            // console.log('remove-particle1');
            app.remove(group);
            sonicBoomInApp = false;
          }
          // group.position.y=-50000;
        }
      }
      // group.updateMatrixWorld();
    });
  }
  // #################################### particle behind avatar 2 ###############################
  {
    const group = new THREE.Group();
    const particleCount = 2;
    const info = {
      velocity: [particleCount],
      rotate: [particleCount],
    };
    const acc = new THREE.Vector3(0, -0, 0);

    // ######## object #########
    let mesh = null;
    const dummy = new THREE.Object3D();

    const particleMaterial = new THREE.MeshBasicMaterial({
      map: electronicballTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    // particleMaterial.freeze();
    function addInstancedMesh() {
      mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 0.3), particleMaterial, particleCount);
      group.add(mesh);
      // app.add(group);
      setInstancedMeshPositions(mesh);
    }

    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    function setInstancedMeshPositions(mesh1) {
      for (let i = 0; i < mesh1.count; i++) {
        mesh.getMatrixAt(i, matrix);
        dummy.scale.x = 0.00001;
        dummy.scale.y = 0.00001;
        dummy.scale.z = 0.00001;

        dummy.position.x = (Math.random()) * 0.2;
        dummy.position.y = -0.2;
        dummy.position.z = Math.random() * 10;
        info.velocity[i] = (new THREE.Vector3(
          0,
          0,
          1));
        info.velocity[i].divideScalar(20);
        info.rotate[i] = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5);
        dummy.updateMatrix();
        mesh1.setMatrixAt(i, dummy.matrix);
      }
      mesh1.instanceMatrix.needsUpdate = true;
    }
    addInstancedMesh();

    const originPoint = new THREE.Vector3(0, 0, 0);
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (mesh) {
        if (narutoRunTime > 0) {
          // console.log('sonic-boom-behind-particle2')
          if (!sonicBoomInApp) {
            // console.log('add-particle2');
            app.add(group);
            sonicBoomInApp = true;
          }
          group.position.copy(localPlayer.position);
          group.rotation.copy(localPlayer.rotation);
          if (localPlayer.avatar) {
            group.position.y -= localPlayer.avatar.height;
            group.position.y += 0.65;
          }
          for (let i = 0; i < particleCount; i++) {
            mesh.getMatrixAt(i, matrix);
            position.setFromMatrixPosition(matrix);
            matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

            if (dummy.position.distanceTo(originPoint) > 5) {
              if (narutoRunTime > 0) {
                dummy.scale.x = 0.5;
                dummy.scale.y = 0.5;
                dummy.scale.z = 0.5;
              } else {
                dummy.scale.x = 0.00001;
                dummy.scale.y = 0.00001;
                dummy.scale.z = 0.00001;
              }

              dummy.position.x = (Math.random() - 0.5) * 0.2;
              dummy.position.y = (Math.random() - 0.5) * 0.2;
              dummy.position.z = 0;
              info.velocity[i].x = (Math.random() - 0.5) * 3;
              info.velocity[i].y = (Math.random() - 0.5) * 3;
              info.velocity[i].z = 8 + Math.random();
              info.velocity[i].divideScalar(20);
            }

            dummy.scale.x /= 1.04;
            dummy.scale.y /= 1.04;
            dummy.scale.z /= 1.04;
            if (narutoRunTime === 0) {
              dummy.scale.x /= 1.1;
              dummy.scale.y /= 1.1;
              dummy.scale.z /= 1.1;
            }
            dummy.rotation.copy(camera.rotation);
            if (localPlayer.rotation.x === 0) {
              dummy.rotation.y -= localPlayer.rotation.y;
            } else {
              dummy.rotation.y += localPlayer.rotation.y;
            }
            info.velocity[i].add(acc);
            dummy.position.add(info.velocity[i]);
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
            mesh.instanceMatrix.needsUpdate = true;
          }
        } else {
          if (sonicBoomInApp) {
            // console.log('remove-particle2');
            app.remove(group);
            sonicBoomInApp = false;
          }
          // group.position.y=-50000;
        }
      }
      // group.updateMatrixWorld();
    });
  }
  // #################################### shockwave2 ########################################
  {
    const localVector = new THREE.Vector3();
    const _shake = () => {
      if (narutoRunTime >= 1 && narutoRunTime <= 5) {
        localVector.setFromMatrixPosition(localPlayer.matrixWorld);
        cameraManager.addShake(localVector, 0.2, 30, 500);
      }
    };
    let wave;
    const group = new THREE.Group();
    (async () => {
      const u = `${baseUrl}/assets/wave3.glb`;
      wave = await new Promise((accept, reject) => {
        const {gltfLoader} = useLoaders();
        gltfLoader.load(u, accept, function onprogress() {}, reject);
      });
      wave.scene.position.y = -5000;

      wave.scene.rotation.x = Math.PI / 2;
      group.add(wave.scene);
      // app.add(group);

      wave.scene.children[0].material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: {
            value: 0,
          },
          opacity: {
            value: 0,
          },
          avatarPos: {
            value: new THREE.Vector3(0, 0, 0),
          },
          iResolution: {value: new THREE.Vector3()},
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
        // side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,

        clipping: false,
        fog: false,
        lights: false,
      });
      wave.scene.children[0].material.freeze();
    })();

    // app.updateMatrixWorld();
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (wave) {
        if (narutoRunTime > 0) {
          if (!sonicBoomInApp) {
            // console.log('add-shockWave');
            app.add(group);
            sonicBoomInApp = true;
          }
          if (narutoRunTime === 1) {
            group.position.copy(localPlayer.position);
            group.position.x += 4.0 * currentDir.x;
            group.position.z += 4.0 * currentDir.z;
            group.rotation.copy(localPlayer.rotation);
            wave.scene.position.y = 0;
            if (localPlayer.avatar) {
              group.position.y -= localPlayer.avatar.height;
              group.position.y += 0.65;
            }
            wave.scene.scale.set(1, 1, 1);
            wave.scene.children[0].material.uniforms.opacity.value = 0;
          }

          if (wave.scene.scale.x <= 5) {
            _shake();
          }
        }
        if (wave.scene.children[0].material.uniforms.opacity.value < 1) {
          wave.scene.scale.set(wave.scene.scale.x + 0.15, wave.scene.scale.y + 0.001, wave.scene.scale.z + 0.15);
          wave.scene.children[0].material.uniforms.opacity.value += 0.003;
          wave.scene.children[0].material.uniforms.uTime.value = timestamp / 1000;
          wave.scene.children[0].material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
          wave.scene.children[0].material.uniforms.avatarPos.x = localPlayer.position.x;
          wave.scene.children[0].material.uniforms.avatarPos.y = localPlayer.position.y;
          wave.scene.children[0].material.uniforms.avatarPos.z = localPlayer.position.z;
        } else {
          if (sonicBoomInApp && narutoRunTime === 0) {
            // console.log('remove-shockWave');
            app.remove(group);
            sonicBoomInApp = false;
          }
        }
      }
    });
  }
  // ##################################### front dust ################################################
  {
    const particleCount = 20;
    const group = new THREE.Group();
    const info = {
      velocity: [particleCount],
    };
    const acc = new THREE.Vector3(-0.000, 0.0008, 0.0018);

    // ##################################################### get Dust geometry #####################################################
    const identityQuaternion = new THREE.Quaternion();
    const _getDustGeometry = geometry => {
      // console.log(geometry)
      const geometry2 = new THREE.BufferGeometry();
      ['position', 'normal', 'uv'].forEach(k => {
        geometry2.setAttribute(k, geometry.attributes[k]);
      });
      geometry2.setIndex(geometry.index);

      const positions = new Float32Array(particleCount * 3);
      const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
      geometry2.setAttribute('positions', positionsAttribute);
      const quaternions = new Float32Array(particleCount * 4);
      for (let i = 0; i < particleCount; i++) {
        identityQuaternion.toArray(quaternions, i * 4);
      }
      const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
      geometry2.setAttribute('quaternions', quaternionsAttribute);

      const startTimes = new Float32Array(particleCount);
      const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
      geometry2.setAttribute('startTimes', startTimesAttribute);

      const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
      opacityAttribute.setUsage(THREE.DynamicDrawUsage);
      geometry2.setAttribute('opacity', opacityAttribute);

      const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
      brokenAttribute.setUsage(THREE.DynamicDrawUsage);
      geometry2.setAttribute('broken', brokenAttribute);

      return geometry2;
    };

    // ##################################################### material #####################################################
    const dustMaterial = new THREE.MeshBasicMaterial({
      // clipping: false,
      fog: false,
      // lights: false,
    });
    dustMaterial.transparent = true;
    dustMaterial.depthWrite = false;
    dustMaterial.alphaMap = noiseMap;
    // dustMaterial.blending= THREE.AdditiveBlending;
    // dustMaterial.side=THREE.DoubleSide;
    // dustMaterial.opacity=0.2;
    dustMaterial.freeze();

    const uniforms = {
      uTime: {
        value: 0,
      },
    };
    dustMaterial.onBeforeCompile = shader => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader = 'attribute float opacity;attribute float broken;\n varying float vOpacity; varying float vBroken; varying vec3 vPos; \n ' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vPos = position;'].join('\n'),
      );
      shader.fragmentShader = 'uniform float uTime; varying float vBroken; varying float vOpacity; varying vec3 vPos;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          'vec4 diffuseColor = vec4( diffuse, opacity );',
                `
                  vec4 diffuseColor = vec4( diffuse, vOpacity);
      
                `,
        );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <alphamap_fragment>',
        [
          'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, vUv ).g;',
          'if ( broken < 0.0001 ) discard;',
        ].join('\n'),
      );
    };

    // ##################################################### load glb #####################################################
    // let dustGeometry;
    let dustApp;
    (async () => {
      const u = `${baseUrl}/assets/smoke.glb`;
      dustApp = await new Promise((accept, reject) => {
        const {gltfLoader} = useLoaders();
        gltfLoader.load(u, accept, function onprogress() {}, reject);
      });
      dustApp.scene.traverse(o => {
        if (o.isMesh) {
          addInstancedMesh(o.geometry);
        }
      });
    })();

    // ##################################################### object #####################################################
    let mesh = null;
    const dummy = new THREE.Object3D();

    function addInstancedMesh(dustGeometry) {
      const geometry = _getDustGeometry(dustGeometry);
      mesh = new THREE.InstancedMesh(geometry, dustMaterial, particleCount);
      group.add(mesh);
      // app.add(group);
      setInstancedMeshPositions(mesh);
    }
    const matrix = new THREE.Matrix4();
    function setInstancedMeshPositions(mesh1) {
      for (let i = 0; i < mesh1.count; i++) {
        mesh.getMatrixAt(i, matrix);
        dummy.scale.x = 0.00001;
        dummy.scale.y = 0.00001;
        dummy.scale.z = 0.00001;
        dummy.position.x = (Math.random() - 0.5) * 0.2;
        dummy.position.y = -0.2;
        dummy.position.z = i * 0.1;
        dummy.rotation.x = Math.random() * i;
        dummy.rotation.y = Math.random() * i;
        dummy.rotation.z = Math.random() * i;
        info.velocity[i] = (new THREE.Vector3(
          0,
          0,
          -0.8 - Math.random()));
        info.velocity[i].divideScalar(20);
        dummy.updateMatrix();
        mesh1.setMatrixAt(i, dummy.matrix);
      }
      mesh1.instanceMatrix.needsUpdate = true;
    }

    let currentRotate = 0;
    let preRotate = 0;
    const narutoEndTime = 0;
    let sonicBoomInApp = false;
    useFrame(({timestamp}) => {
      if (narutoRunTime === 1) {
        if (!sonicBoomInApp) {
          // console.log('add-dust');
          app.add(group);
          sonicBoomInApp = true;
        }
      }
      if (mesh) {
        group.position.copy(localPlayer.position);
        group.rotation.copy(localPlayer.rotation);
        if (localPlayer.avatar) {
          group.position.y -= localPlayer.avatar.height;
          group.position.y += 0.2;
        }

        group.position.x -= 0.3 * currentDir.x;
        group.position.z -= 0.3 * currentDir.z;

        if (localPlayer.rotation.x === 0) { currentRotate = -localPlayer.rotation.y; } else {
          if (localPlayer.rotation.y > 0) { currentRotate = (localPlayer.rotation.y - Math.PI); } else { currentRotate = (localPlayer.rotation.y + Math.PI); }
        }
        // console.log('sonic-boom-front-dust');

        const opacityAttribute = mesh.geometry.getAttribute('opacity');
        const brokenAttribute = mesh.geometry.getAttribute('broken');
        const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
        for (let i = 0; i < particleCount; i++) {
          mesh.getMatrixAt(i, matrix);
          matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

          if (lastStopSw === 1 && narutoRunTime === 0) {
            opacityAttribute.setX(i, 1);
            brokenAttribute.setX(i, Math.random() - 0.6);

            dummy.scale.x = 0.06 + Math.random() * 0.05;
            dummy.scale.y = 0.06 + Math.random() * 0.05;
            dummy.scale.z = 0.06 + Math.random() * 0.05;

            dummy.position.x = (Math.random() - 0.5) * 0.2;
            dummy.position.y = -0.2;
            dummy.position.z = (Math.random() - 0.5) * 0.2;

            info.velocity[i].x = 0;
            info.velocity[i].y = 0;
            info.velocity[i].z = -0.8 - Math.random();

            info.velocity[i].divideScalar(20);
          }

          if (dummy.position.z < 50) {
            opacityAttribute.setX(i, opacityAttribute.getX(i) - 0.04);
            if (brokenAttribute.getX(i) < 1) { brokenAttribute.setX(i, brokenAttribute.getX(i) + 0.045); } else { brokenAttribute.setX(i, 1); }
            dummy.rotation.z = timestamp / 500.0;

            dummy.scale.x *= 1.03;
            dummy.scale.y *= 1.03;
            dummy.scale.z *= 1.03;

            if (narutoRunTime > 0) {
              dummy.scale.x = 0.00001;
              dummy.scale.y = 0.00001;
              dummy.scale.z = 0.00001;
            }
            if (Math.abs(currentRotate - preRotate) >= 0.175) {
              dummy.scale.x = 0.00001;
              dummy.scale.y = 0.00001;
              dummy.scale.z = 0.00001;
            }
            info.velocity[i].add(acc);
            dummy.position.add(info.velocity[i]);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
          }
        }

        mesh.instanceMatrix.needsUpdate = true;
        opacityAttribute.needsUpdate = true;
        brokenAttribute.needsUpdate = true;
        startTimesAttribute.needsUpdate = true;
      }
      if (lastStopSw === 1 && narutoRunTime === 0) {
        lastStopSw = 0;

        // narutoEndTime=timestamp;
      }
      if (lastStopSw === 0) {
        if (sonicBoomInApp) {
          mesh.getMatrixAt(particleCount - 1, matrix);
          matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
          if (dummy.position.z > 40) {
            // console.log('remove-dust');
            app.remove(group);
            sonicBoomInApp = false;
          }
        }
      }
      // group.updateMatrixWorld();
      app.updateMatrixWorld();
      preRotate = currentRotate;
    });
  }
  // ##################################### main ball ##################################################
  // {

  //     const mainBallGeometry = new THREE.SphereBufferGeometry(1.9, 32,32);
  //     const instGeom = new THREE.InstancedBufferGeometry().copy(mainBallGeometry);

  //     const num = 60;
  //     let instPos = [];
  //     let instId = [];
  //     let instAngle = [];
  //     for (let i = 0; i < num; i++) {
  //         instPos.push(0, 0, 0);
  //         instId.push(i);
  //         instAngle.push(0, 0, 0);
  //     }
  //     instGeom.setAttribute("instPos", new THREE.InstancedBufferAttribute(new Float32Array(instPos), 3));
  //     instGeom.setAttribute("instId", new THREE.InstancedBufferAttribute(new Float32Array(instId), 1));
  //     instGeom.setAttribute("instAngle", new THREE.InstancedBufferAttribute(new Float32Array(instAngle), 3));
  //     instGeom.instanceCount = num;

  //     const mainballMaterial = new THREE.ShaderMaterial({
  //         uniforms: {
  //             sphereNum: { value: num },
  //             uTime: { value: 0 },
  //             random: { value: 0 },
  //             opacity: { value: 0 },
  //             size: { value: 1 }
  //         },
  //         vertexShader: `
  //             ${THREE.ShaderChunk.common}
  //             ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
  //             uniform float uTime;
  //             uniform float size;
  //             uniform float sphereNum;

  //             attribute vec3 instPos;
  //             attribute vec3 instAngle;
  //             attribute float instId;

  //             varying vec2 vUv;
  //             varying float vId;

  //             void main() {
  //                 vUv=uv;
  //                 vId=instId;
  //                 vec3 pos = vec3(position);
  //                 pos += instPos;
  //                 if(vId<=32.){
  //                     pos*=(instId*instId*instId*instId)/(sphereNum*sphereNum*sphereNum*sphereNum)+0.18;
  //                 }
  //                 else
  //                     pos*=(instId*instId)/(sphereNum*sphereNum);
  //                 pos*=size;
  //                 gl_Position = projectionMatrix * modelViewMatrix * vec4(pos,1.0);
  //                 ${THREE.ShaderChunk.logdepthbuf_vertex}
  //             }
  //         `,
  //         fragmentShader: `
  //             ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  //             uniform float uTime;
  //             uniform float opacity;
  //             uniform float random;
  //             uniform float sphereNum;

  //             varying vec2 vUv;
  //             varying float vId;

  //             void main() {
  //                 if(vId<=52.){
  //                     gl_FragColor=vec4(0.3984,0.4921,0.765625,(0.9-((vId*vId)/(sphereNum*sphereNum))));
  //                     if(vId>=33.99)
  //                         gl_FragColor.a/=10.5;
  //                     else{
  //                         gl_FragColor.a/=1.2;
  //                     }

  //                 }
  //                 else{
  //                     gl_FragColor=vec4(0.3984,0.4921,0.765625, 0.003*(vId/sphereNum));
  //                     gl_FragColor.a/=50.;
  //                 }
  //                 if(vId>=23.99){
  //                     gl_FragColor.a*=((vId*vId)/(sphereNum*sphereNum))*0.9;
  //                 }
  //                 if(vId<23.99){
  //                     gl_FragColor.a*=0.4*((vId*vId)/(sphereNum*sphereNum));
  //                 }
  //                 if(vId>=43.99){
  //                     gl_FragColor.a*=((vId*vId)/(sphereNum*sphereNum))*0.6;
  //                 }
  //                 gl_FragColor.a*=opacity;
  //                 ${THREE.ShaderChunk.logdepthbuf_fragment}

  //             }
  //         `,
  //         side: THREE.DoubleSide,
  //         transparent: true,
  //         depthWrite: false,
  //         blending: THREE.AdditiveBlending,
  //     });

  //     const mainBall = new THREE.Mesh(instGeom, mainballMaterial);
  //     const group = new THREE.Group();
  //     group.add(mainBall)
  //     //app.add(group);
  //     const localVector = new THREE.Vector3();
  //     useFrame(({timestamp}) => {

  //         group.rotation.copy(localPlayer.rotation);
  //         group.position.copy(localPlayer.position);
  //         localPlayer.getWorldDirection(localVector)
  //         localVector.normalize();
  //         group.position.x-=.1*localVector.x;
  //         group.position.z-=.1*localVector.z;

  //         if (localPlayer.avatar) {
  //             group.position.y -= localPlayer.avatar.height;
  //             group.position.y += 0.65;
  //         }

  //         if(narutoRunTime==0){
  //             mainballMaterial.uniforms.opacity.value/=1.05;
  //             mainballMaterial.uniforms.size.value/=1.01;
  //         }
  //         else if(narutoRunTime==1){
  //             mainballMaterial.uniforms.opacity.value=1;
  //             mainballMaterial.uniforms.size.value=4.5;

  //         }
  //         else if(narutoRunTime>1 ){
  //             if(mainballMaterial.uniforms.size.value>1){
  //                 mainballMaterial.uniforms.size.value/=1.1;
  //             }
  //             else{
  //                 mainballMaterial.uniforms.size.value=1;
  //             }

  //         }
  //         // else if(narutoRunTime>=10){
  //         //     electronicball.update(timeDiff, Electronicball.UPDATES.LATE);

  //         // }

  //         mainballMaterial.uniforms.uTime.value=timestamp/100000;
  //         app.updateMatrixWorld();

  //     });
  // }
  // ########################################## flame ##########################################
  // {
  //     const group = new THREE.Group();
  //     const vertflame = `
  //         ${THREE.ShaderChunk.common}
  //         ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
  //         varying vec2 vUv;
  //         uniform float uTime;
  //         uniform float strength;
  //         uniform sampler2D perlinnoise;
  //         void main() {
  //             vUv = uv*strength;

  //             vec3 pos = vec3(position.x,position.y,position.z);
  //             vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*50.,vUv.x + uTime*1.),1.)).rgb;
  //             if(pos.y >= 1.87){
  //                 pos = vec3(position.x*(sin((position.y - 0.64)*1.27)-0.12),position.y,position.z*(sin((position.y - 0.64)*1.27)-0.12));
  //             } else{
  //                 pos = vec3(position.x*(sin((position.y/2. -  .01)*.11)+0.79),position.y,position.z*(sin((position.y/2. -  .01)*.11)+0.79));
  //             }
  //             pos.xz *= noisetex.r;
  //             gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
  //             ${THREE.ShaderChunk.logdepthbuf_vertex}
  //         }
  //     `;

  //     const fragflame = `
  //         ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  //         varying vec2 vUv;
  //         uniform sampler2D perlinnoise;
  //         uniform float uTime;

  //         uniform vec3 color;
  //         varying vec3 vNormal;

  //         void main() {
  //             vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*2.,vUv.x - uTime*1.),1.)).rgb;

  //             gl_FragColor = vec4(noisetex.r);
  //             if(gl_FragColor.r >= 0.1){
  //                 gl_FragColor = vec4(color,gl_FragColor.r);
  //             }
  //             else{
  //                 gl_FragColor = vec4(0.);
  //             }
  //             gl_FragColor *= vec4(smoothstep(0.2,0.628,vUv.y));
  //             gl_FragColor.xyz/=1.5;
  //             //gl_FragColor.a/=2.;
  //             ${THREE.ShaderChunk.logdepthbuf_fragment}

  //         }
  //     `;

  //     let flameMaterial;
  //     function flame() {
  //         const geometry = new THREE.CylinderBufferGeometry(0.5, 0.1, 5.3, 50, 50, true);
  //         flameMaterial = new THREE.ShaderMaterial({
  //             uniforms: {
  //                 perlinnoise: {
  //                     type: "t",
  //                     value: new THREE.TextureLoader().load(
  //                         "/practice/sonic-boom/wave9.png"
  //                     )
  //                 },
  //                 color: {
  //                     value: new THREE.Vector3(0.120, 0.280, 1.920)
  //                 },
  //                 uTime: {
  //                     type: "f",
  //                     value: 0.0
  //                 },
  //                 strength: {
  //                     type: "f",
  //                     value: 0.0
  //                 },
  //             },
  //             // wireframe:true,
  //             vertexShader: vertflame,
  //             fragmentShader: fragflame,
  //             transparent: true,
  //             depthWrite: false,
  //             blending: THREE.AdditiveBlending,
  //             side: THREE.DoubleSide,
  //         });

  //         const mesh = new THREE.Mesh(geometry, flameMaterial);
  //         mesh.setRotationFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -90 * Math.PI / 180 );
  //         group.add(mesh);
  //         //app.add(group);
  //     }
  //     flame();

  //     useFrame(({timestamp}) => {
  //         group.position.copy(localPlayer.position);
  //         group.position.y-=0.55;
  //         group.rotation.copy(localPlayer.rotation);

  //         let dum = new THREE.Vector3();
  //         localPlayer.getWorldDirection(dum)
  //         dum = dum.normalize();
  //         group.position.x+=2.5*dum.x;
  //         group.position.z+=2.5*dum.z;

  //         if(narutoRunTime>=90 ){
  //             group.scale.set(1,1,1);
  //             flameMaterial.uniforms.strength.value=1.0;
  //         }
  //         else{
  //             //group.scale.set(0,0,0);
  //             flameMaterial.uniforms.strength.value-=0.015;
  //         }
  //         if(narutoRunTime>0 && narutoRunTime<90){
  //             group.scale.set(0,0,0);
  //         }

  //         flameMaterial.uniforms.uTime.value=timestamp/20000;

  //         app.updateMatrixWorld();

  //     });
  // }
  // ########################################## lightning ##########################################
  // {
  //     const group = new THREE.Group();
  //     const vertlightning = `
  //         ${THREE.ShaderChunk.common}
  //         ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
  //         varying vec2 vUv;
  //         varying vec3 vPos;
  //         uniform float uTime;
  //         uniform float strength;
  //         uniform sampler2D perlinnoise;
  //         void main() {
  //             vUv = uv*strength;
  //             vPos=position;
  //             vec3 pos = vec3(position.x,position.y,position.z);
  //             vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*50.,vUv.x + uTime*1.),1.)).rgb;
  //             if(pos.y >= 1.87){
  //                 pos = vec3(position.x*(sin((position.y - 0.64)*1.27)-0.12),position.y,position.z*(sin((position.y - 0.64)*1.27)-0.12));
  //             } else{
  //                 pos = vec3(position.x*(sin((position.y/2. -  .01)*.11)+0.79),position.y,position.z*(sin((position.y/2. -  .01)*.11)+0.79));
  //             }
  //             pos.xz *= noisetex.r;
  //             gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
  //             ${THREE.ShaderChunk.logdepthbuf_vertex}
  //         }
  //     `;

  //     const fraglightning = `
  //         ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  //         varying vec2 vUv;
  //         uniform sampler2D perlinnoise;
  //         uniform float uTime;
  //         uniform float random;

  //         uniform vec3 color;
  //         varying vec3 vNormal;
  //         #define PI 3.1415926

  //         float pat(vec2 uv,float p,float q,float s,float glow)
  //         {
  //             float t =abs(cos(uTime))+1.;
  //             float z = cos(q *random * uv.x) * cos(p *random * uv.y) + cos(q * random * uv.y) * cos(p * random * uv.x);

  //             z += sin(uTime*50.0 - uv.y-uv.y * s)*0.35;
  //             float dist=abs(z)*(5./glow);
  //             return dist;
  //         }
  //         void main() {
  //             vec2 uv = vUv.yx;
  //             float d = pat(uv, 1.0, 2.0, 10.0, 0.35);
  //             vec3 col = color*0.5/d;
  //             vec4 fragColor = vec4(col,1.0);

  //             vec3 noisetex = texture2D(perlinnoise,mod(1.*vec2(vUv.y+uTime*2.,vUv.x - uTime*1.),1.)).rgb;

  //             gl_FragColor = vec4(noisetex.r);
  //             if(gl_FragColor.r >= 0.0){
  //                 gl_FragColor = fragColor;
  //             }
  //             else{
  //                 gl_FragColor = vec4(0.);
  //             }
  //             gl_FragColor *= vec4(smoothstep(0.2,0.628,vUv.y));
  //             //gl_FragColor.a*=cos(uTime*10.);
  //             ${THREE.ShaderChunk.logdepthbuf_fragment}

  //         }
  //     `;

  //     let lightningMaterial;
  //     function lightning() {
  //         const geometry = new THREE.CylinderBufferGeometry(0.65, 0.15, 5.3, 50, 50, true);
  //         lightningMaterial = new THREE.ShaderMaterial({
  //             uniforms: {
  //                 perlinnoise: {
  //                     type: "t",
  //                     value: new THREE.TextureLoader().load(
  //                         "/practice/sonic-boom/wave9.png"
  //                     )
  //                 },
  //                 color: {
  //                     value: new THREE.Vector3(0.120, 0.280, 1.920)
  //                 },
  //                 uTime: {
  //                     type: "f",
  //                     value: 0.0
  //                 },
  //                 random: {
  //                     type: "f",
  //                     value: 0.0
  //                 },
  //                 strength: {
  //                     type: "f",
  //                     value: 0.0
  //                 },
  //             },
  //             // wireframe:true,
  //             vertexShader: vertlightning,
  //             fragmentShader: fraglightning,
  //             transparent: true,
  //             depthWrite: false,
  //             blending: THREE.AdditiveBlending,
  //             side: THREE.DoubleSide
  //         });

  //         const mesh = new THREE.Mesh(geometry, lightningMaterial);
  //         mesh.setRotationFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), -90 * Math.PI / 180 );
  //         mesh.rotation.y=Math.PI;
  //         group.add(mesh);
  //         //app.add(group);
  //     }
  //     lightning();

  //     let lightningfreq=0;
  //     useFrame(({timestamp}) => {
  //         group.position.copy(localPlayer.position);
  //         group.position.y-=0.55;
  //         group.rotation.copy(localPlayer.rotation);

  //         let dum = new THREE.Vector3();
  //         localPlayer.getWorldDirection(dum)
  //         dum = dum.normalize();
  //         group.position.x+=2.5*dum.x;
  //         group.position.z+=2.5*dum.z;

  //         if(narutoRunTime>=90 ){
  //             group.scale.set(1,1,1);
  //             lightningMaterial.uniforms.strength.value=1.0;

  //         }
  //         else{
  //             //group.scale.set(0,0,0);
  //             lightningMaterial.uniforms.strength.value-=0.015;
  //         }

  //         if(narutoRunTime>0 && narutoRunTime<90){
  //             group.scale.set(0,0,0);
  //         }

  //         if(lightningfreq%1==0){
  //             lightningMaterial.uniforms.random.value=Math.random()*Math.PI;
  //         }
  //         lightningMaterial.uniforms.uTime.value=timestamp/10000;

  //         //lightningMaterial.uniforms.strength.value=Math.abs(Math.cos(timestamp/10000));

  //         app.updateMatrixWorld();
  //         lightningfreq++;

  //     });
  // }
  // ########################################### particle #############################################

  // {
  // const electronicball = new Electronicball();
  // app.add(electronicball);
  // app.add(electronicball.batchRenderer);
  // app.updateMatrixWorld();

  // const startTime = performance.now();
  // let lastTimestamp = startTime;
  // electronicball.update(0, Electronicball.UPDATES.INIT);

  // const localVector = new THREE.Vector3();

  // useFrame(({timestamp}) => {

  //     const now = timestamp;
  //     const timeDiff = (now - lastTimestamp) / 1000.0;
  //     lastTimestamp = now;

  //     electronicball.position.copy(localPlayer.position);
  //     localPlayer.getWorldDirection(localVector)
  //     localVector.normalize();
  //     //console.log(dum);
  //     electronicball.position.x-=1.2*localVector.x;
  //     electronicball.position.z-=1.2*localVector.z;

  //     // if(!localPlayer.hasAction('fly') && !localPlayer.hasAction('jump')){
  //         if (localPlayer.avatar) {
  //             electronicball.position.y -= localPlayer.avatar.height;
  //             electronicball.position.y += 0.65;
  //         }
  //     /* }
  //     else{
  //         electronicball.position.y-=50000;
  //     } */
  //     if(narutoRunTime==0){
  //         electronicball.update(timeDiff, Electronicball.UPDATES.FIRST);

  //         electronicball.position.x+=1.2*localVector.x;
  //         electronicball.position.z+=1.2*localVector.z;
  //     }
  //     else if(narutoRunTime==1){
  //         electronicball.update(timeDiff, Electronicball.UPDATES.SECOND);

  //     }
  //     // else if(narutoRunTime>0 && narutoRunTime<80){

  //     //     electronicball.update(timeDiff,1);

  //     // }
  //     else if(narutoRunTime>0 && narutoRunTime<10){
  //         electronicball.update(timeDiff, Electronicball.UPDATES.EARLY);

  //     }
  //     else if(narutoRunTime>=10){
  //         electronicball.update(timeDiff, Electronicball.UPDATES.LATE);

  //     }

  //     app.updateMatrixWorld();

  // });
  // }

  // ############################################# shock wave ######################################################

  //   {
  //     const localVector = new THREE.Vector3();
  //     const _shake = () => {
  //         localVector.setFromMatrixPosition(localPlayer.matrixWorld);
  //         cameraManager.addShake( localVector, 0.5, 10, 5);
  //     };
  //     let wave;
  //     (async () => {
  //         const u = `${baseUrl}wave3.glb`;
  //         wave = await new Promise((accept, reject) => {
  //             const {gltfLoader} = useLoaders();
  //             gltfLoader.load(u, accept, function onprogress() {}, reject);

  //         });
  //         wave.scene.position.y+=0.05;
  //         wave.scene.position.y=-5000;
  //         //app.add(wave.scene);

  //         wave.scene.children[0].material= new THREE.ShaderMaterial({
  //             uniforms: {
  //                 uTime: {
  //                     value: 0,
  //                 },
  //                 avatarPos:{
  //                     value: new THREE.Vector3(0,0,0)
  //                 },
  //                 iResolution: { value: new THREE.Vector3() },
  //             },
  //             vertexShader: `\

  //                 ${THREE.ShaderChunk.common}
  //                 ${THREE.ShaderChunk.logdepthbuf_pars_vertex}

  //                 uniform float uTime;

  //                 varying vec2 vUv;
  //                 varying vec3 vPos;

  //                 void main() {
  //                   vUv=uv;
  //                   vPos=position;
  //                   vec4 modelPosition = modelMatrix * vec4(position, 1.0);
  //                   vec4 viewPosition = viewMatrix * modelPosition;
  //                   vec4 projectionPosition = projectionMatrix * viewPosition;

  //                   gl_Position = projectionPosition;
  //                   ${THREE.ShaderChunk.logdepthbuf_vertex}
  //                 }
  //               `,
  //             fragmentShader: `\
  //                 ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
  //                 uniform float uTime;
  //                 uniform vec3 iResolution;
  //                 uniform vec3 avatarPos;
  //                 varying vec2 vUv;
  //                 varying vec3 vPos;

  //                 float noise(vec3 point) {
  //                     float r = 0.;
  //                     for (int i=0;i<16;i++) {
  //                         vec3 D, p = point + mod(vec3(i,i/4,i/8) , vec3(4.0,2.0,2.0)) +
  //                         1.7*sin(vec3(i,5*i,8*i)), C=floor(p), P=p-C-.5, A=abs(P);
  //                         C += mod(C.x+C.y+C.z,2.) * step(max(A.yzx,A.zxy),A) * sign(P);
  //                         D=34.*sin(987.*float(i)+876.*C+76.*C.yzx+765.*C.zxy);P=p-C-.5;
  //                         r+=sin(6.3*dot(P,fract(D)-.5))*pow(max(0.,1.-2.*dot(P,P)),4.);
  //                     }
  //                     return .5 * sin(r);
  //                 }

  //                 void mainImage( out vec4 fragColor, in vec2 fragCoord ){

  //                     fragColor = vec4(
  //                         vec3(0.5,0.8,0.4)
  //                         +vec3(
  //                             noise(10.6*vec3(vPos.z*sin(mod(uTime,1.)/3.),vPos.z,vPos.x*cos(mod(uTime,1.)/3.))
  //                         ))
  //                         , distance(avatarPos,vPos)-.95);//pow(distance(avatarPos,vPos)-.95,1.)
  //                 }

  //                 void main() {
  //                     mainImage(gl_FragColor, vUv * iResolution.xy);
  //                     gl_FragColor.a*=2.;
  //                     //gl_FragColor.xyz*=10.;
  //                   ${THREE.ShaderChunk.logdepthbuf_fragment}
  //                 }
  //               `,
  //             //side: THREE.DoubleSide,
  //             transparent: true,
  //             depthWrite: false,
  //             blending: THREE.AdditiveBlending,
  //         });

  //     })();

  //     app.updateMatrixWorld();

  //     useFrame(({timestamp}) => {
  //         let dum = new THREE.Vector3();
  //         localPlayer.getWorldDirection(dum)
  //         dum = dum.normalize();

  //         if(wave){
  //             if(ioManager.keys.doubleTap === true){
  //                 if(wave.scene.scale.x>5){
  //                     wave.scene.scale.set(10,10,10);
  //                     wave.scene.position.y=-5000;
  //                 }
  //                 else{
  //                     wave.scene.scale.set(wave.scene.scale.x+.1,wave.scene.scale.y+0.03,wave.scene.scale.z+.1);
  //                     wave.scene.position.copy(localPlayer.position);
  //                     wave.scene.position.y=0.5;
  //                     //_shake();
  //                 }

  //             }
  //             else{
  //                 wave.scene.scale.set(1,1,1);
  //                 wave.scene.position.y=-5000;
  //             }

  //             wave.scene.children[0].material.uniforms.uTime.value=timestamp/1000;
  //             wave.scene.children[0].material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
  //             wave.scene.children[0].material.uniforms.avatarPos.x=localPlayer.position.x;
  //             wave.scene.children[0].material.uniforms.avatarPos.y=localPlayer.position.y;
  //             wave.scene.children[0].material.uniforms.avatarPos.z=localPlayer.position.z;
  //         }
  //         app.updateMatrixWorld();
  //     });
  //   }

  app.setComponent('renderPriority', 'low');

  return app;
};
