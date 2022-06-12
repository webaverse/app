import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useCameraManager, useLoaders, useInternals} = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');


export default () => {
  const app = useApp();
  const localPlayer = useLocalPlayer();
  const cameraManager = useCameraManager();
  //const {renderer, camera, scene} = useInternals();
  let {scene, camera, renderer} = useInternals();
  const textureLoader = new THREE.TextureLoader()
  let renderTarget, depthMaterial;
//   const normalSampler = textureLoader.load(`${baseUrl}/textures/waterNormal2.png`)
//   const waterNormalTexture1 = textureLoader.load(`${baseUrl}/textures/waterNormal2.png`)
//   const waterNormalTexture2 = textureLoader.load(`${baseUrl}/textures/waterNormal3.png`)
//   normalSampler.wrapS = normalSampler.wrapT = THREE.RepeatWrapping;
//   waterNormalTexture1.wrapS = waterNormalTexture1.wrapT = THREE.RepeatWrapping;
//   waterNormalTexture2.wrapS = waterNormalTexture2.wrapT = THREE.RepeatWrapping;

    
    //################################################# front wave #################################################
    {
        const params = {
            foamColor: 0xffffff,
            waterColor: 0x14c6a5,
            threshold: 0.1
        };
        // camera = new THREE.PerspectiveCamera(
        //     70,
        //     window.innerWidth / window.innerHeight,
        //     0.1,
        //     100
        // );
        //camera.position.set(0, 70, 10);
        
        // scene = new THREE.Scene();
        // scene.background = new THREE.Color(0x1e485e);

        // let ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
        // scene.add(ambientLight);

        // let dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        // dirLight.position.set(0, 5, 5);
        // scene.add(dirLight);

        let boxGeometry = new THREE.BoxBufferGeometry(10, 1, 1);
        let boxMaterial = new THREE.MeshLambertMaterial({ color: 0xea4d10 });

        let box1 = new THREE.Mesh(boxGeometry, boxMaterial);
        box1.position.z = 4.5;
        scene.add(box1);

        let box2 = new THREE.Mesh(boxGeometry, boxMaterial);
        box2.position.z = -4.5;
        scene.add(box2);

        let box3 = new THREE.Mesh(boxGeometry, boxMaterial);
        box3.position.x = -5;
        box3.rotation.y = Math.PI * 0.5;
        scene.add(box3);

        let box4 = new THREE.Mesh(boxGeometry, boxMaterial);
        box4.position.x = 5;
        box4.rotation.y = Math.PI * 0.5;
        scene.add(box4);

        let box5 = new THREE.Mesh(new THREE.BoxBufferGeometry(), boxMaterial);
        box5.rotation.y = Math.PI * 0.1;
        box5.rotation.x = Math.PI * 0.05;
        scene.add(box5);

        //renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.antialias = true;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.gammaOutput = true;
        document.body.appendChild(renderer.domElement);


        const supportsDepthTextureExtension = !!renderer.extensions.get(
            "WEBGL_depth_texture"
        );
        let pixelRatio = renderer.getPixelRatio();

        renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth * pixelRatio,
            window.innerHeight * pixelRatio
        );
        renderTarget.texture.minFilter = THREE.NearestFilter;
        renderTarget.texture.magFilter = THREE.NearestFilter;
        renderTarget.texture.generateMipmaps = false;
        renderTarget.stencilBuffer = false;

        if (supportsDepthTextureExtension === true) {
            renderTarget.depthTexture = new THREE.DepthTexture();
            renderTarget.depthTexture.type = THREE.UnsignedShortType;
            renderTarget.depthTexture.minFilter = THREE.NearestFilter;
            renderTarget.depthTexture.maxFilter = THREE.NearestFilter;
        }
    
        depthMaterial = new THREE.MeshDepthMaterial();
        depthMaterial.depthPacking = THREE.RGBADepthPacking;
        depthMaterial.blending = THREE.NoBlending;

        const dudvMap = new THREE.TextureLoader().load(
            "https://i.imgur.com/hOIsXiZ.png"
        );
        dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;

        const uniforms = {
            uTime: {
                value: 0.0
            },
            threshold: {
                value: 0.1
            },
            tDudv: {
                value: null
            },
            tDepth: {
                value: null
            },
            cameraNear: {
                value: 0
            },
            cameraFar: {
                value: 0
            },
            resolution: {
                value: new THREE.Vector2()
            },
            foamColor: {
                value: new THREE.Color()
            },
            waterColor: {
                value: new THREE.Color()
            },
            
        }
        const geometry = new THREE.PlaneBufferGeometry(10, 10);
        const waterMaterial = new THREE.ShaderMaterial({
          defines: {
            DEPTH_PACKING: supportsDepthTextureExtension === true ? 0 : 1,
            ORTHOGRAPHIC_CAMERA: 0
          },
          uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib["fog"], uniforms]),
          fog: true,
          vertexShader: `\
              
            ${THREE.ShaderChunk.common}
            ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            #include <fog_pars_vertex>

            varying vec2 vUv;
            void main() {
                vUv = uv;

                #include <begin_vertex>
                #include <project_vertex>
                #include <fog_vertex>
                ${THREE.ShaderChunk.logdepthbuf_vertex}
            }`,
          fragmentShader: `\
            
            ${THREE.ShaderChunk.emissivemap_pars_fragment}
            ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
            #include <common>
            #include <packing>
            #include <fog_pars_fragment>
      
            varying vec2 vUv;
            uniform sampler2D tDepth;
            uniform sampler2D tDudv;
            uniform vec3 waterColor;
            uniform vec3 foamColor;
            uniform float cameraNear;
            uniform float cameraFar;
            uniform float uTime;
            uniform float threshold;
            uniform vec2 resolution;
      
            float getDepth( const in vec2 screenPosition ) {
                #if DEPTH_PACKING == 1
                    return unpackRGBAToDepth( texture2D( tDepth, screenPosition ) );
                #else
                    return texture2D( tDepth, screenPosition ).x;
                #endif
            }
      
            float getViewZ( const in float depth ) {
                #if ORTHOGRAPHIC_CAMERA == 1
                    return orthographicDepthToViewZ( depth, cameraNear, cameraFar );
                #else
                    return perspectiveDepthToViewZ( depth, cameraNear, cameraFar );
                #endif
            }
      
            void main() {
      
                vec2 screenUV = gl_FragCoord.xy / resolution;
      
                float fragmentLinearEyeDepth = getViewZ( gl_FragCoord.z );
                float linearEyeDepth = getViewZ( getDepth( screenUV ) );
      
                float diff = saturate( fragmentLinearEyeDepth - linearEyeDepth );
      
                vec2 displacement = texture2D( tDudv, ( vUv * 2.0 ) - uTime * 0.05 ).rg;
                displacement = ( ( displacement * 2.0 ) - 1.0 ) * 1.0;
                diff += displacement.x;
      
                gl_FragColor.rgb = mix( foamColor, waterColor, step( threshold, diff ) );
                gl_FragColor.a = 1.0;
      
                #include <tonemapping_fragment>
                #include <encodings_fragment>
                #include <fog_fragment>
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                ${THREE.ShaderChunk.emissivemap_fragment}
      
            }`,
          //side: THREE.DoubleSide,
        //   transparent: true,
        //   depthWrite: false,
          //blending: THREE.AdditiveBlending,

        //   clipping: false,
        //   fog: false,
        //   lights: false,
        });

        // waterMaterial.uniforms.cameraNear.value = camera.near;
        // waterMaterial.uniforms.cameraFar.value = camera.far;
        // waterMaterial.uniforms.resolution.value.set(
        //     window.innerWidth * pixelRatio,
        //     window.innerHeight * pixelRatio
        // );
        // waterMaterial.uniforms.tDudv.value = dudvMap;
        // waterMaterial.uniforms.tDepth.value =
        //     supportsDepthTextureExtension === true
        //     ? renderTarget.depthTexture
        //     : renderTarget.texture;

        const water = new THREE.Mesh( geometry, waterMaterial );
        water.rotation.x = -Math.PI / 2;
        app.add( water );

        // const geometry2 = new THREE.SphereGeometry( 2, 32, 16 );
        // const material2 = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
        // const sphere = new THREE.Mesh( geometry2, material2 );
        // app.add( sphere );

        if(!localPlayer.hasAction('fly')){
            console.log('add');
            //localPlayer.addAction({type:'swim'})
            const flyAction = {
                type: 'fly',
                time: 0,
            };
            localPlayer.setControlAction(flyAction);
        }
        
        useFrame(({timestamp}) => {
            camera.position.set(0, 7, 10);
            //renderer.clear();
            if(localPlayer.avatar)
            localPlayer.avatar.visible = false;
            water.visible = false; // we don't want the depth of the water
            scene.overrideMaterial = depthMaterial;

            renderer.setRenderTarget(renderTarget);
            renderer.render(scene, camera);
            renderer.setRenderTarget(null);

            scene.overrideMaterial = null;
            water.visible = true;

            // beauty pass
            water.material.uniforms.threshold.value = params.threshold;
            water.material.uniforms.uTime.value = timestamp / 1000;
            water.material.uniforms.foamColor.value.set(params.foamColor);
            water.material.uniforms.waterColor.value.set(params.waterColor);

            waterMaterial.uniforms.cameraNear.value = camera.near;
            waterMaterial.uniforms.cameraFar.value = camera.far;
            waterMaterial.uniforms.resolution.value.set(
                window.innerWidth * pixelRatio,
                window.innerHeight * pixelRatio
            );
            waterMaterial.uniforms.tDudv.value = dudvMap;
            waterMaterial.uniforms.tDepth.value =
                supportsDepthTextureExtension === true
                ? renderTarget.depthTexture
                : renderTarget.texture;
            
            app.updateMatrixWorld();
            // renderer.clearDepth();
            // renderer.render(scene, camera);
        
        });
    }
  
  app.setComponent('renderPriority', 'low');
  
  return app;
};


