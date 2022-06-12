import * as THREE from 'three';
import { Water } from './Water.js';
import metaversefile from 'metaversefile';

const {useApp, useFrame, useLocalPlayer, useCameraManager, useLoaders, useInternals, usePhysics, useCleanup} = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');

export default () => {
  const app = useApp();
  const localPlayer = useLocalPlayer();
  
  const {renderer, camera} = useInternals();
  
  const textureLoader = new THREE.TextureLoader()
  const splashTexture = textureLoader.load(`${baseUrl}/textures/splash1.png`);
  const splashTexture2 = textureLoader.load(`${baseUrl}/textures/splash2.png`);
  const splashTexture3 = textureLoader.load(`${baseUrl}/textures/splash3.png`);
  const splashTexture4 = textureLoader.load(`${baseUrl}/textures/splash.png`);
  const rippleTexture = textureLoader.load(`${baseUrl}/textures/ripple3.png`);
  const noiseMap = textureLoader.load(`${baseUrl}/textures/noise.jpg`);
  const noiseMap2 = textureLoader.load(`${baseUrl}/textures/noise2.png`);
  const noiseMap3 = textureLoader.load(`${baseUrl}/textures/noise3.png`);
  const wave2 = textureLoader.load(`${baseUrl}/textures/wave2.jpeg`);

  const waterNormalTexture1 = textureLoader.load(`${baseUrl}/textures/waterNormal2.png`)
  const waterNormalTexture2 = textureLoader.load(`${baseUrl}/textures/waterNormal3.png`)
  waterNormalTexture1.wrapS = waterNormalTexture1.wrapT = THREE.RepeatWrapping;
  waterNormalTexture2.wrapS = waterNormalTexture2.wrapT = THREE.RepeatWrapping;
  
  let waterHeight=0;
  let secondSplashSw=0;
  

  let currentSpeed;

  let contactWater=false;

  let floatOnWater = false;
  let floatHalfOnWater = false;
  
  let shallowWater = false;

  let fallindSpeed=0;

  let belowWater=false;

  let currentRise=0;
  
  let currentDir=new THREE.Vector3();
  //################################################ trace player direction ########################################
  {
    let localVector = new THREE.Vector3();
    let prePos=0;
    let count=0;
    useFrame(({timestamp}) => {
        localVector.x=0;
        localVector.y=0;
        localVector.z=-1;
        currentDir = localVector.applyQuaternion( localPlayer.quaternion );
        currentDir.normalize();

        //console.log(localPlayer.characterPhysics.velocity.y) 
    
        fallindSpeed=0-localPlayer.characterPhysics.velocity.y;
        if(localPlayer.avatar){
            currentSpeed = localVector.set(localPlayer.avatar.velocity.x, 0, localPlayer.avatar.velocity.z).length();
            if(localPlayer.position.y-localPlayer.avatar.height <=(app.position.y-waterHeight) ){
                contactWater=true;
            }
            else{
                if(localPlayer.hasAction('swim')){
                    console.log('remove');
                    localPlayer.removeAction('swim');
                }
                contactWater=false;
            }
            if(
                localPlayer.position.y - 0.9 >(app.position.y-waterHeight)
            ){
                if(localPlayer.hasAction('swim')){
                    console.log('remove');
                    localPlayer.removeAction('swim');
                }
                floatHalfOnWater=true;
            }
            else{
                floatHalfOnWater=false;
            }
            if(
                localPlayer.position.y>(app.position.y-waterHeight)
                && (localPlayer.position.y-(app.position.y-waterHeight))<localPlayer.avatar.height/1.2
            ){
                floatOnWater=true;
            }
            else{
                floatOnWater=false;
            }
            if(
                localPlayer.position.y>(app.position.y-waterHeight)
                && (localPlayer.position.y-(app.position.y-waterHeight))<localPlayer.avatar.height
            ){
                shallowWater=true;
            }
            else{
                shallowWater=false;
            }
            if(
                localPlayer.position.y<(app.position.y-waterHeight)
                //&& ((app.position.y-waterHeight)-localPlayer.position.y)<localPlayer.avatar.height
            ){
                if(!localPlayer.hasAction('swim')){
                    console.log('add');
                    const swimAction = {
                        type: 'swim',
                        time: 0,
                    };
                    localPlayer.setControlAction(swimAction);
                }
                belowWater=true;
            }
            else{
                belowWater=false;
            }
            
            if(localPlayer.position.y-prePos>0){
                currentRise=1;
            }
            else if(localPlayer.position.y-prePos<0){
                currentRise=0;
            }
            else{
                currentRise=-1;
            }
            prePos=localPlayer.position.y;
            
            
            

        }
        
            
           
          
    });
  }
  {
    let alreadyPlaySplash = false;
    let lastTimePlaySplash = 0;
    let v=0;
    useFrame(({timestamp}) => {
        
       if(currentRise===1 && !belowWater && !alreadyPlaySplash && contactWater && localPlayer.characterPhysics.velocity.y>1.5){
            v = localPlayer.characterPhysics.velocity.y;
            alreadyPlaySplash = true;
            lastTimePlaySplash=timestamp;
            //console.log(v);
       }
       if(currentRise===0 || (currentRise===-1 && timestamp-lastTimePlaySplash>1000)){
           alreadyPlaySplash=false;
       }
       
            
           
          
    });

  }


//%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% jump %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

//################################################################## lower splash ###################################################################
{
    const particleCount = 50;
    const group=new THREE.Group();
    let info = {
        velocity: [particleCount]
    }
    let acc = new THREE.Vector3(-0.000, 0, 0.0018);

    //##################################################### get Dust geometry #####################################################
    const identityQuaternion = new THREE.Quaternion();
    const _getDustGeometry = geometry => {
        //console.log(geometry)
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

        // const startTimes = new Float32Array(particleCount);
        // const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
        // geometry2.setAttribute('startTimes', startTimesAttribute);

        const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        opacityAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('opacity', opacityAttribute);

        const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
        brokenAttribute.setUsage(THREE.DynamicDrawUsage);
        geometry2.setAttribute('broken', brokenAttribute);
    
        return geometry2;
    };

    //##################################################### material #####################################################
    let dustMaterial= new THREE.MeshBasicMaterial();
    dustMaterial.transparent=true; 
    dustMaterial.depthWrite=false;
    dustMaterial.alphaMap=noiseMap;
    dustMaterial.blending= THREE.AdditiveBlending;
    //dustMaterial.side=THREE.DoubleSide;
    //dustMaterial.opacity=0.2;

    const uniforms = {
        uTime: {
            value: 0
        },
    }
    dustMaterial.onBeforeCompile = shader => {
        shader.uniforms.uTime = uniforms.uTime;
        shader.vertexShader = 'attribute float opacity;attribute float broken;\n varying float vOpacity; varying float vBroken; varying vec3 vPos; \n ' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vPos = position;'].join('\n')
        );
        shader.fragmentShader = 'uniform float uTime; varying float vBroken; varying float vOpacity; varying vec3 vPos;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader
        .replace(
            `vec4 diffuseColor = vec4( diffuse, opacity );`,
            `
              vec4 diffuseColor = vec4( diffuse, vOpacity);
  
            `
        );
        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <alphamap_fragment>',
            [
              'vec3 noise = texture2D(alphaMap,mod(1.*vec2(5.*vUv.x,5.*vUv.y-uTime*1. ),1.)).rgb;',
              'float broken = abs( sin( 1.0 - vBroken ) ) - noise.g;',
              'if ( broken < 0.0001 ) discard;'
            ].join('\n')
        );
    };
    
    //##################################################### load glb #####################################################
    //let dustGeometry;
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

    

    //##################################################### object #####################################################
    let mesh = null;
    let dummy = new THREE.Object3D();


    function addInstancedMesh(dustGeometry) {
        const geometry = _getDustGeometry(dustGeometry);
        mesh = new THREE.InstancedMesh(geometry, dustMaterial, particleCount);
        group.add(mesh);
        app.add(group);
        setInstancedMeshPositions(mesh);
        
    }
    let matrix = new THREE.Matrix4();
    function setInstancedMeshPositions(mesh1) {
        for (let i = 0; i < mesh1.count; i++) {
            mesh.getMatrixAt(i, matrix);
            dummy.scale.x = .00001;
            dummy.scale.y = .00001;
            dummy.scale.z = .00001;
            dummy.position.x = (Math.random()-0.5)*0.2;
            dummy.position.y = -0.2;
            dummy.position.z = i*0.1;
            dummy.rotation.x=Math.random()*i;
            dummy.rotation.y=Math.random()*i;
            dummy.rotation.z=Math.random()*i;
            info.velocity[i] = (new THREE.Vector3(
                0,
                0,
                -0.8-Math.random()));
            info.velocity[i].divideScalar(20);
            dummy.updateMatrix();
            mesh1.setMatrixAt(i, dummy.matrix);
        }
        mesh1.instanceMatrix.needsUpdate = true;
    }
   

    
    let jumpSw=0;
    useFrame(({timestamp}) => {
        if (contactWater){
            if(jumpSw===0)
                jumpSw=1;
        }
        else{
            if(jumpSw=2)
                jumpSw=0;
        }

        
        
    
        
        if (mesh) {
            const opacityAttribute = mesh.geometry.getAttribute('opacity');
            const brokenAttribute = mesh.geometry.getAttribute('broken');
            //const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
            for (let i = 0; i < particleCount; i++) {
                mesh.getMatrixAt(i, matrix);
                matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                
                if (jumpSw===1 && fallindSpeed>11) {
                    
                    
                    opacityAttribute.setX(i, 0.7);
                    brokenAttribute.setX(i, 0.2);
                    
                    dummy.scale.x = (0.02+Math.random()*0.0125);
                    dummy.scale.y = (0.02+Math.random()*0.0125);
                    dummy.scale.z = (0.02+Math.random()*0.0125);
                    
                    
                    
                    dummy.position.x = Math.cos(i)*0.2;
                    dummy.position.y = 0;
                    dummy.position.z = Math.sin(i)*0.2;
                    
                    // info.velocity[i].x=0;
                    // info.velocity[i].y=0;
                    // info.velocity[i].z=-0.8-Math.random();
                    
                        
                    //info.velocity[i].divideScalar(20);
                    
                }
                
                // opacityAttribute.setX(i, opacityAttribute.getX(i)-0.04);
                
                    
                // dummy.rotation.x+=0.1*(Math.random()-0.5);
                // dummy.rotation.y+=0.1*(Math.random()-0.5);
                // dummy.rotation.z+=0.1*(Math.random()-0.5);
                //if(dummy.scale.x<0.15){
                    dummy.scale.x+=0.01;
                    dummy.scale.y+=0.01;
                    dummy.scale.z+=0.01;
                //}
                //else{
                    if(brokenAttribute.getX(i)<1){
                        brokenAttribute.setX(i, brokenAttribute.getX(i)+0.025);
                        opacityAttribute.setX(i, opacityAttribute.getX(i)-0.0025);
                        //dummy.position.y+=0.02
                    }
                    else{
                        opacityAttribute.setX(i, 0);
                        if(i==particleCount-1){
                            secondSplashSw=1;
                        }    
                    }
                    
                //}
                
                
                
                
                //acc.x=0.005*(Math.random()-0.5);
                //if(dummy.position.distanceTo(originPoint)>2.5 )
                // info.velocity[i].add(acc);
                // dummy.position.add(info.velocity[i]);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);

            }
            if (jumpSw===1 && fallindSpeed>11){
                jumpSw=2;
                group.position.copy(localPlayer.position);
            }
            
            group.position.y = waterHeight;
            mesh.instanceMatrix.needsUpdate = true;
            opacityAttribute.needsUpdate = true;
            brokenAttribute.needsUpdate = true;
            //startTimesAttribute.needsUpdate = true;

        }
        group.updateMatrixWorld();
        
    });
  }
    //###################################################################### higher splash ######################################################################
    {
        const particleCount = 50;
        const group=new THREE.Group();
        let matrix = new THREE.Matrix4();
        let dummy = new THREE.Object3D();
        let info = {
            velocity: [particleCount]
        }
        let acc = new THREE.Vector3(0, -0.005, 0);
    
        //##################################################### get geometry #####################################################
        const identityQuaternion = new THREE.Quaternion();
        const _getSplashGeometry = geometry => {
            //console.log(geometry)
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
    
            // const startTimes = new Float32Array(particleCount);
            // const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
            // geometry2.setAttribute('startTimes', startTimesAttribute);
    
            const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            opacityAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('opacity', opacityAttribute);
    
            const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            brokenAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('broken', brokenAttribute);

            const scales = new Float32Array(particleCount);
            const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scaleAttribute);
        
            return geometry2;
        };
    
        //##################################################### material #####################################################
        const splashMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                perlinnoise:{
                    value: splashTexture
                },
                noiseMap:{
                    value: noiseMap
                },
                cameraBillboardQuaternion: {
                    value: new THREE.Quaternion(),
                },
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
                uniform float uTime;
                uniform vec4 cameraBillboardQuaternion;
        
                varying vec2 vUv;
                varying vec3 vPos;
                varying float vBroken;
                varying float vOpacity;
                attribute vec3 positions;
                attribute float scales;
                attribute vec4 quaternions;
                attribute float broken;
                attribute float opacity;
                vec3 qtransform(vec3 v, vec4 q) { 
                  return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
                }
                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }
            
                void main() {
                vBroken=broken;
                vOpacity=opacity;
                vUv=uv;
                vPos=position;
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
                varying float vBroken;
                varying float vOpacity;
                varying vec2 vUv;
                varying vec3 vPos;
                uniform sampler2D perlinnoise;
                uniform sampler2D noiseMap;
                
                
                
                
                
                void main() {
                    vec3 noise = texture2D(
                        noiseMap,
                        mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
                    ).rgb;
                    vec4 ripple = texture2D(
                        perlinnoise,
                        vUv
                    );


                    gl_FragColor = ripple;
                    if(gl_FragColor.r<0.1){
                        discard;
                    }
                    else{
                        gl_FragColor=vec4(1.0,1.0,1.0,1.0);
                    }
                    //float broken = abs( sin( 1.0 - mod(uTime,1.0) ) ) - noise.r;
                    float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
                    if ( broken < 0.0001 ) discard;

                    gl_FragColor.a*=vOpacity;
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            //blending: THREE.AdditiveBlending,
            
        });
        
       
    
        
    
        //##################################################### object #####################################################
        let mesh=null;
        const addInstancedMesh=()=>{
            const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
            const geometry =_getSplashGeometry(geometry2)
            mesh = new THREE.InstancedMesh(
                geometry,
                splashMaterial,
                particleCount
            );
            group.add(mesh);
            app.add(group);
            const positionsAttribute = mesh.geometry.getAttribute('positions');
            const scalesAttribute = mesh.geometry.getAttribute('scales');
            const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
            for (let i = 0; i < particleCount; i++) {
                mesh.getMatrixAt(i, matrix);
                matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                
                
                let angle = i / (particleCount-1) * Math.PI;
                positionsAttribute.setXYZ(i,.1* Math.sin(angle), 0, .1* Math.cos(angle));
                
                // let randScale = 0.7+0.5*(Math.random());
                // scalesAttribute.setX(i, 1);
                
                // let quaternion = new THREE.Quaternion();
                // quaternion.setFromAxisAngle(new THREE.Vector3((Math.random()-0.5)*0.25,1,(Math.random()-0.5)*0.25),angle);
                
                //quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                info.velocity[i] = (new THREE.Vector3(
                    1*(Math.random()-0.5),
                    1*(Math.random()-0.5),
                    2.5+1*(Math.random())));
                info.velocity[i].divideScalar(20);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
            positionsAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            quaternionsAttribute.needsUpdate = true;
        }
        addInstancedMesh();
        app.updateMatrixWorld();


        let alreadyPlaySplash = false;
        let lastTimePlaySplash = 0;
        let v=0;
        let jumpSw=0;
        let quaternion = new THREE.Quaternion();
        useFrame(({timestamp}) => {
            if (contactWater){
                if(jumpSw===0)
                    jumpSw=1;
            }
            else{
                if(jumpSw=2)
                    jumpSw=0;
            }
            if(currentRise===1 && !belowWater && !alreadyPlaySplash && contactWater && localPlayer.characterPhysics.velocity.y>1.5){
                v = localPlayer.characterPhysics.velocity.y;
                alreadyPlaySplash = true;
                lastTimePlaySplash=timestamp;
                //console.log(v);
            }
            if(currentRise===0 || (currentRise===-1 && timestamp-lastTimePlaySplash>1000)){
                v=-1;
                alreadyPlaySplash=false;
            }
       
           
            
            if (mesh) {
                const opacityAttribute = mesh.geometry.getAttribute('opacity');
                const brokenAttribute = mesh.geometry.getAttribute('broken');
                // const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
                const positionsAttribute = mesh.geometry.getAttribute('positions');
                const scalesAttribute = mesh.geometry.getAttribute('scales');
                //const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
                let falling = fallindSpeed>10?10:fallindSpeed;
                for (let i = 0; i < particleCount; i++) {
                    mesh.getMatrixAt(i, matrix);
                    matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                    
                    if(jumpSw===1  && fallindSpeed>6){
                        info.velocity[i].x=0.1*(Math.random()-0.5);
                        info.velocity[i].y=1.2+1.0*(falling/10);
                        info.velocity[i].z=0.1*(Math.random()-0.5);
                        
                            
                        info.velocity[i].divideScalar(20);
                        positionsAttribute.setXYZ(i, (Math.random()-0.5)*0.2*(falling/10),(Math.random())*0.8-0.2,(Math.random()-0.5)*0.2*(falling/10));
                        brokenAttribute.setX(i, Math.random()+0.1);
                        opacityAttribute.setX(i, 1);
                        scalesAttribute.setX(i, 1);
                        acc.y=-0.005;
                        //acc.y =-0.0025 * (1+(falling/10));
                        
                        // quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*Math.PI);
                        // quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);

                    }
                    else if(v>0){
                        info.velocity[i].x=0.5*(Math.sin(i));
                        info.velocity[i].y=1+0.5*Math.random();
                        info.velocity[i].z=0.5*(Math.cos(i));
                        
                            
                        info.velocity[i].divideScalar(20);
                        positionsAttribute.setXYZ(i, (Math.sin(i))*0.05,0,(Math.cos(i))*0.05);
                        brokenAttribute.setX(i, Math.random()+0.35);
                        //brokenAttribute.setX(i, Math.random()-0.8);
                        opacityAttribute.setX(i, 1);
                        scalesAttribute.setX(i, 1);
                        acc.y=-0.002;
                        //acc.y =-0.0025 * (1+(falling/10));
                        
                        // quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*Math.PI);
                        // quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                    }
                    

                    if(dummy.position.y>=-100){

                        
                        positionsAttribute.setXYZ(  i, 
                                                    positionsAttribute.getX(i)+info.velocity[i].x,
                                                    positionsAttribute.getY(i)+info.velocity[i].y,
                                                    positionsAttribute.getZ(i)+info.velocity[i].z
                                                );
                        scalesAttribute.setX(i, scalesAttribute.getX(i)-0.015);
                        opacityAttribute.setX(i, opacityAttribute.getX(i)-0.015);
                        if(brokenAttribute.getX(i)<1.0)
                            brokenAttribute.setX(i, brokenAttribute.getX(i)+0.02);
                        // startTimesAttribute.setX(i, startTimesAttribute.getX(i)-0.008);
                        // //dummy.rotation.copy(camera.rotation);
                        // //dummy.rotation.x=timestamp*i*0.0001;
                        // // dummy.rotation.y+=0.1*(Math.random()-0.5);
                        // if(info.velocity[i].x<0)
                        //     dummy.rotation.z=timestamp*(i%10)*0.0001;
                        // else
                        //     dummy.rotation.z=-timestamp*(i%10)*0.0001;
                        
                        // dummy.scale.x*=1.02;
                        // dummy.scale.y*=1.02;
                        // dummy.scale.z*=1.02;
                        
                        
                        
                       
                        info.velocity[i].add(acc);
                        // dummy.position.add(info.velocity[i]);
                        // dummy.updateMatrix();
                        // mesh.setMatrixAt(i, dummy.matrix);
                    }
                    
    
                }
                if(jumpSw===1 && fallindSpeed>6){
                    group.position.copy(localPlayer.position);
                    secondSplashSw=0;
                    jumpSw=2;
                    group.position.y = waterHeight-0.5;
                }
                if(v>0){
                    group.position.copy(localPlayer.position);
                    secondSplashSw=0;
                    v=-1;
                    group.position.y = waterHeight;
                }
                
                // // group.rotation.copy(localPlayer.rotation);
                // if (localPlayer.avatar) {
                //   group.position.y -= localPlayer.avatar.height;
                //   group.position.y += 0.5;
                // }
                
                // localPlayer.getWorldDirection(dum)
                // dum = dum.normalize();
                // group.position.x+=0.3*dum.x;
                // group.position.z+=0.3*dum.z;
                //group.rotation.copy(camera.rotation);
                mesh.instanceMatrix.needsUpdate = true;
                positionsAttribute.needsUpdate = true;
                opacityAttribute.needsUpdate = true;
                brokenAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
                //quaternionsAttribute.needsUpdate = true;
                // startTimesAttribute.needsUpdate = true;
                mesh.material.uniforms.uTime.value=timestamp/1000;
                mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
    
            }
            group.updateMatrixWorld();
        });
    }

    

     
    //#################################################################### droplet particle ########################################################################
    {
        const dropletgroup = new THREE.Group();
        const dropletRipplegroup=new THREE.Group();
        const particleCount = 50;
        let info = {
            velocity: [particleCount],
            alreadyHaveRipple: [particleCount]
        }
        const acc = new THREE.Vector3(0, -0.002, 0);


        //##################################################### get ripple geometry #####################################################
        const identityQuaternion = new THREE.Quaternion();
        const _getRippleGeometry = geometry => {
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
    
            const waveFreq = new Float32Array(particleCount);
            const waveFreqAttribute = new THREE.InstancedBufferAttribute(waveFreq, 1);
            geometry2.setAttribute('waveFreq', waveFreqAttribute);
    
            const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            opacityAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('opacity', opacityAttribute);
    
            const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            brokenAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('broken', brokenAttribute);

            const scales = new Float32Array(particleCount);
            const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scaleAttribute);
        
            return geometry2;
        };
        //##################################################### ripple material #####################################################
        const rippleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                noiseMap:{
                    value: noiseMap
                }
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
                uniform float uTime;
        
                varying vec2 vUv;
                varying vec3 vPos;
                varying float vBroken;
                varying float vOpacity;
                varying float vWaveFreq;
                attribute vec3 positions;
                attribute float scales;
                attribute float opacity;
                attribute float waveFreq;
                attribute vec4 quaternions;
                attribute float broken;
                vec3 qtransform(vec3 v, vec4 q) { 
                  return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
                }
            
                void main() {
                vOpacity=opacity;
                vBroken=broken;
                vWaveFreq=waveFreq;
                vUv=uv;
                vPos=position;
                vec3 pos = position;
                pos = qtransform(pos, quaternions);
                pos*=scales;
                pos+=positions;
                
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
                varying float vWaveFreq;
                varying float vBroken;
                varying float vOpacity;
                varying vec2 vUv;
                varying vec3 vPos;
                uniform sampler2D noiseMap;
                
                void main() {
                    
                    vec2 wavedUv = vec2(
                        vUv.x,
                        vUv.y + sin(vUv.x * (2.+vWaveFreq) * cos(uTime*2.)) * 0.05
                    );
                    float strength = 1.0 - step(0.01, abs(distance(wavedUv, vec2(0.5)) - 0.25));

                    gl_FragColor = vec4(vec3(strength), 1.0);
                    gl_FragColor.a*=vOpacity;

                    float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
                    if ( broken < 0.0001 ) discard;
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            
        });

    
        //################################################################ droplet object #########################################################
        let dropletMesh = null;
        let dummy = new THREE.Object3D();
        let matrix = new THREE.Matrix4();
    
        function addInstancedMesh() {
            dropletMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({map:splashTexture4, color: 0xF7D994, transparent:true, opacity:1, depthWrite:false, blending:THREE.AdditiveBlending}), particleCount);
            dropletgroup.add(dropletMesh);
            app.add(dropletgroup);
            setInstancedMeshPositions(dropletMesh);
        }
        function setInstancedMeshPositions(mesh1) {
            for (let i = 0; i < mesh1.count; i++) {
                dropletMesh.getMatrixAt(i, matrix);
                matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                dummy.position.y=-500;
                info.velocity[i] = (new THREE.Vector3(
                    (Math.random() - 0.5)*3.,
                    Math.random() * 1.,
                    (Math.random() - 0.5)*3.));
                info.velocity[i].divideScalar(20);
                info.alreadyHaveRipple[i] =false;
                dummy.updateMatrix();
                mesh1.setMatrixAt(i, dummy.matrix);
            }
            mesh1.instanceMatrix.needsUpdate = true;
        }
        addInstancedMesh();

        //################################################################ ripple object #########################################################
        let rippleMesh=null;
        let quaternion = new THREE.Quaternion();
        
        let euler = new THREE.Euler();
        const addInstancedMesh2=()=>{
            const geometry2 = new THREE.PlaneGeometry( 0.45, 0.45 );
            const geometry =_getRippleGeometry(geometry2)
            rippleMesh = new THREE.InstancedMesh(
                geometry,
                rippleMaterial,
                particleCount
            );
            dropletRipplegroup.add(rippleMesh);
            app.add(dropletRipplegroup);
            const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
            const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
            
            for (let i = 0; i < particleCount; i++) {
               
                positionsAttribute.setXYZ(i,.1* Math.random(), .1* Math.random(), 0);
                
              
                euler.x=-Math.PI/2;
                euler.y=0;
                euler.z=0;
                quaternion.setFromEuler(euler);
                quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
            }
            positionsAttribute.needsUpdate = true;
            quaternionsAttribute.needsUpdate = true;
        }
        addInstancedMesh2();




        
        
        let alreadyPlaySplash = false;
        let lastTimePlaySplash = 0;
        let v=0;
    
        let jumpSw=0;
        
        useFrame(({timestamp}) => {
            if (contactWater){
                if(jumpSw===0)
                    jumpSw=1;
            }
            else{
                if(jumpSw=2)
                    jumpSw=0;
            }
            if(currentRise===1 && !belowWater && !alreadyPlaySplash && contactWater && localPlayer.characterPhysics.velocity.y>1.5){
                v = localPlayer.characterPhysics.velocity.y;
                alreadyPlaySplash = true;
                lastTimePlaySplash=timestamp;
                //console.log(v);
            }
            if(currentRise===0 || (currentRise===-1 && timestamp-lastTimePlaySplash>1000)){
                v=-1;
                alreadyPlaySplash=false;
            }
          if (dropletMesh && rippleMesh) {
            const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
            const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
            const waveFreqAttribute = rippleMesh.geometry.getAttribute('waveFreq');
            const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
            const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
            let falling = fallindSpeed>10?10:fallindSpeed;
            let dropletNum = particleCount*(falling/10);
            falling=falling<5?7:falling;
            let riseSpeed = v>5?5:v;
            let dropletNum2 = particleCount*(riseSpeed/10);
            for (let i = 0; i < particleCount; i++) {
                dropletMesh.getMatrixAt(i, matrix);
                matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
 
                if (jumpSw==1) {
                    
                    let rand=Math.random();
                    dummy.scale.x = rand;
                    dummy.scale.y = rand;
                    dummy.scale.z = rand;
                    dummy.position.x = 0;
                    dummy.position.y = 0;
                    dummy.position.z = 0;
                    
                    info.velocity[i].x=(Math.random() -0.5)*1*(falling/10);
                    info.velocity[i].y=Math.random() *1.6*(falling/10);
                    info.velocity[i].z=(Math.random() -0.5)*1*(falling/10);
                    
                    info.velocity[i].divideScalar(20);
                    info.alreadyHaveRipple[i]=false;
                    if(i>dropletNum){
                        dummy.scale.x = 0.001;
                        dummy.scale.y = 0.001;
                        dummy.scale.z = 0.001;
                    }
                }
                else if(v>0){
                    let rand=Math.random();
                    dummy.scale.x = rand;
                    dummy.scale.y = rand;
                    dummy.scale.z = rand;
                    dummy.position.x = 0;
                    dummy.position.y = 0;
                    dummy.position.z = 0;
                    
                    info.velocity[i].x=(Math.random() -0.5)*1*(riseSpeed/5);
                    info.velocity[i].y=Math.random() *1.6*(riseSpeed/5);
                    info.velocity[i].z=(Math.random() -0.5)*1*(riseSpeed/5);
                    
                    info.velocity[i].divideScalar(20);
                    info.alreadyHaveRipple[i]=false;
                    if(i>dropletNum2){
                        dummy.scale.x = 0.001;
                        dummy.scale.y = 0.001;
                        dummy.scale.z = 0.001;
                    }
                    
                }
                if(dummy.position.y>=-100){
                    info.velocity[i].add(acc);
                    dummy.scale.x /=1.035;
                    dummy.scale.y /=1.035;
                    dummy.scale.z /=1.035;
                    dummy.position.add(info.velocity[i]);

                    dummy.rotation.copy(camera.rotation);
                    

                    dummy.updateMatrix();
                    
                    dropletMesh.setMatrixAt(i, dummy.matrix);
                    dropletMesh.instanceMatrix.needsUpdate = true;
                }
                if(dummy.position.y<0 && !info.alreadyHaveRipple[i] && dummy.scale.x>0.1){
                    dummy.scale.x=0.0001;
                    dummy.scale.y=0.0001;
                    dummy.scale.z=0.0001;
                    dummy.updateMatrix();
                    dropletMesh.setMatrixAt(i, dummy.matrix);
                    dropletMesh.instanceMatrix.needsUpdate = true;
                    positionsAttribute.setXYZ(i,dummy.position.x,0,dummy.position.z);
                    scalesAttribute.setX(i,Math.random()*0.2);
                    opacityAttribute.setX(i,0.5+0.3*Math.random());
                    waveFreqAttribute.setX(i, Math.random()*(i%10));
                    brokenAttribute.setX(i, Math.random()-0.8);
                    info.alreadyHaveRipple[i]=true;
                }
                opacityAttribute.setX(i,opacityAttribute.getX(i)-0.013);
                scalesAttribute.setX(i,scalesAttribute.getX(i)+0.02);
                if(brokenAttribute.getX(i)<1)
                    brokenAttribute.setX(i, brokenAttribute.getX(i)+0.02);
                
    
            }
            dropletRipplegroup.position.y = waterHeight;
            positionsAttribute.needsUpdate = true;
            opacityAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            brokenAttribute.needsUpdate = true;
            waveFreqAttribute.needsUpdate = true;
            rippleMesh.material.uniforms.uTime.value=timestamp/1000;
            if(jumpSw==1){
                dropletgroup.position.copy(localPlayer.position);
                dropletRipplegroup.position.copy(localPlayer.position);
                jumpSw=2;
            }
            if(v>0){
                dropletgroup.position.copy(localPlayer.position);
                dropletRipplegroup.position.copy(localPlayer.position);
                v=-1;
            }
            
            dropletgroup.position.y = waterHeight;
            dropletRipplegroup.position.y = waterHeight;
    
    
        }
        
        });
      }
    //###################################################################### float splash ######################################################################
    {
        const particleCount = 5;
        const group=new THREE.Group();
    
        //##################################################### get ripple geometry #####################################################
        const identityQuaternion = new THREE.Quaternion();
        const _getRippleGeometry = geometry => {
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
    
            const waveFreq = new Float32Array(particleCount);
            const waveFreqAttribute = new THREE.InstancedBufferAttribute(waveFreq, 1);
            geometry2.setAttribute('waveFreq', waveFreqAttribute);
    
            const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            opacityAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('opacity', opacityAttribute);
    
            const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            brokenAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('broken', brokenAttribute);

            const scales = new Float32Array(particleCount);
            const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scaleAttribute);

            const playerRotation = new Float32Array(particleCount);
            const playerRotAttribute = new THREE.InstancedBufferAttribute(playerRotation, 1);
            geometry2.setAttribute('playerRotation', playerRotAttribute);

            const speed = new Float32Array(particleCount);
            const speedAttribute = new THREE.InstancedBufferAttribute(speed, 1);
            geometry2.setAttribute('speed', speedAttribute);
        
            return geometry2;
        };
    
        //##################################################### material #####################################################
        const splashMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                noiseMap:{
                    value: noiseMap
                },
                perlinnoise:{
                    value: splashTexture
                }
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
                uniform float uTime;
        
                varying vec2 vUv;
                varying vec3 vPos;
                varying float vBroken;
                varying float vOpacity;
                varying float vWaveFreq;
                varying float vSpeed;
                attribute vec3 positions;
                attribute float scales;
                attribute float opacity;
                attribute float waveFreq;
                attribute vec4 quaternions;
                attribute float broken;
                attribute float speed;
                attribute float playerRotation;
                vec3 qtransform(vec3 v, vec4 q) { 
                  return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
                }
            
                void main() {

                    mat3 rotY =
                        mat3(cos(playerRotation), 0.0, -sin(playerRotation), 0.0, 1.0, 0.0, sin(playerRotation), 0.0, cos(playerRotation));
                    mat3 rotX =
                        mat3(1.0, 0.0, 0.0, 0.0, cos(PI/2.), sin(PI/2.), 0.0, -sin(PI/2.), cos(PI/2.));
                    
                    mat3 rotZ = mat3(
                        cos(-PI/2.), sin(-PI/2.), 0.0,
                        -sin(-PI/2.), cos(-PI/2.), 0.0, 
                        0.0, 0.0 , 1.0
                    );

                vOpacity=opacity;
                vBroken=broken;
                vWaveFreq=waveFreq;
                vSpeed=speed;
                vUv=uv;
                vPos=position;
                vec3 pos = position;
                pos = qtransform(pos, quaternions);
                pos*=rotY;
                pos*=scales;
                pos+=positions;
                //pos*=rotX;
                
                
                
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
                varying float vWaveFreq;
                varying float vBroken;
                varying float vOpacity;
                varying float vSpeed;
                varying vec2 vUv;
                varying vec3 vPos;
                uniform sampler2D noiseMap;
                uniform sampler2D perlinnoise;
                //#define PI 3.1415926


                void main() {
                    
                    vec4 splash = texture2D(
                        perlinnoise,
                        vUv
                    );
                    if(splash.r>0.1){
                        gl_FragColor = vec4(1.0);
                    }
                    
                    gl_FragColor.a*=vOpacity;
                    
                    
                    //float broken = abs( sin( 1.0 - vBroken ) ) - noise2.g;
                    float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
                    if ( broken < 0.0001 ) discard;
                    
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            //blending: THREE.AdditiveBlending,
            
        });
        
       
    
        
    
        //##################################################### object #####################################################
        let rippleMesh=null;
        let quaternion = new THREE.Quaternion();
        
        const addInstancedMesh2=()=>{
            const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
            const geometry =_getRippleGeometry(geometry2)
            rippleMesh = new THREE.InstancedMesh(
                geometry,
                splashMaterial,
                particleCount
            );
            group.add(rippleMesh);
            app.add(group);
            
            const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
            for (let i = 0; i < particleCount; i++) {
                quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
                quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
            }
            quaternionsAttribute.needsUpdate = true;
        }
        addInstancedMesh2();
        app.updateMatrixWorld();
       
        let jumpSw=0;
        useFrame(({timestamp}) => {
            if (contactWater){
                if(jumpSw===0)
                    jumpSw=1;
            }
            else{
                if(jumpSw=2)
                    jumpSw=0;
            }
           
            
            
            if (rippleMesh) {
                const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
                const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
                const waveFreqAttribute = rippleMesh.geometry.getAttribute('waveFreq');
                const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
                const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
                const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
                const speedAttribute = rippleMesh.geometry.getAttribute('speed');
                const playerRotationAttribute = rippleMesh.geometry.getAttribute('playerRotation');
                let falling = fallindSpeed>10?10:fallindSpeed; 
                for (let i = 0; i < particleCount; i++) {
                    if(jumpSw===1){
                        playerRotationAttribute.setX(i,Math.random()*Math.PI);
                        waveFreqAttribute.setX(i, Math.random());
                        //speedAttribute.setX(i,currentSpeed);
                        brokenAttribute.setX(i,0.15+Math.random()*(1-falling/10));
                        scalesAttribute.setX(i,0.2+Math.random()*0.1);
                        opacityAttribute.setX(i,0.15);
                        positionsAttribute.setXYZ(i,(Math.random()-0.5)*0.5*(falling/10), 0, (Math.random()-0.5)*0.5*(falling/10));
                    }
                    
                    scalesAttribute.setX(i,scalesAttribute.getX(i)+0.04);
                    if(brokenAttribute.getX(i)<1)
                        brokenAttribute.setX(i, brokenAttribute.getX(i)+0.009);
                    
    
                }
                
                
                
                if(jumpSw==1){
                    group.position.copy(localPlayer.position);
                    jumpSw=2;
                }
                
                
                group.position.y = waterHeight;
                positionsAttribute.needsUpdate = true;
                opacityAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
                speedAttribute.needsUpdate = true;
                brokenAttribute.needsUpdate = true;
                waveFreqAttribute.needsUpdate = true;
                quaternionsAttribute.needsUpdate = true;
                playerRotationAttribute.needsUpdate = true;
                rippleMesh.material.uniforms.uTime.value=timestamp/1000;
    
            }
            app.updateMatrixWorld();
            
        });
      }
    
    //######################################################################  3 layers ripple ######################################################################
    {
        const identityQuaternion = new THREE.Quaternion();
        const count = 3;

        
        const _getRippleGeometry = geometry => {
            const geometry2 = new THREE.BufferGeometry();
            ['position', 'normal', 'uv'].forEach(k => {
              geometry2.setAttribute(k, geometry.attributes[k]);
            });
            geometry2.setIndex(geometry.index);
            
            const positions = new Float32Array(count * 3);
            const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
            geometry2.setAttribute('positions', positionsAttribute);
            const quaternions = new Float32Array(count * 4);
            for (let i = 0; i < count; i++) {
              identityQuaternion.toArray(quaternions, i * 4);
            }
            const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
            geometry2.setAttribute('quaternions', quaternionsAttribute);

            // const startTimes = new Float32Array(count);
            // const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
            // geometry2.setAttribute('startTimes', startTimesAttribute);

            const scales = new Float32Array(count);
            const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scaleAttribute);
        
            return geometry2;
        };

        //######################################################################### material #########################################################################
        const rippleMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                opacity: {
                    value: 0,
                },
                uBroken: {
                    value: 0,
                },
                perlinnoise:{
                    value: rippleTexture
                },
                noiseMap:{
                    value: noiseMap
                }
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
                uniform float uTime;
        
                varying vec2 vUv;
                varying vec3 vPos;
                attribute vec3 positions;
                attribute float scales;
                attribute vec4 quaternions;

                vec3 qtransform(vec3 v, vec4 q) { 
                  return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
                }
            
                void main() {
                vUv=uv;
                vPos=position;
                vec3 pos = position;
                pos+=positions;
                pos*=scales;
                pos = qtransform(pos, quaternions);
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
                uniform float opacity;
                uniform float uBroken;
                varying vec2 vUv;
                varying vec3 vPos;
                uniform sampler2D perlinnoise;
                uniform sampler2D noiseMap;
                
                
                
                
                
                void main() {
                    vec3 ripple = texture2D(
                        perlinnoise,
                        mod(1.*vec2(5.*vUv.x,2.*vUv.y-uTime*5. ),1.)
                    ).rgb; 

                    vec3 noise = texture2D(
                        noiseMap,
                        mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
                    ).rgb;
                    


                    gl_FragColor = vec4(ripple.rgb,1.0);
                    
                    if(gl_FragColor.r >= 0.65){
                       gl_FragColor =  vec4(1.,1.,1.,1.);
                    }else{
                        gl_FragColor = vec4(0.,0.,1.,0.);
                    }
                    float broken = abs( sin( pow(1.0 - vUv.y,1.) ) ) - noise.g;
                    if ( broken < 0.0001 ) discard;
                    gl_FragColor.a*=opacity;
                    if(uTime>0.48)
                        gl_FragColor.a=0.;
                    
                    //gl_FragColor=vec4(1.0,1.0,0.,1.0);
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            //side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            
        });


        let rippleApp;
        let group = new THREE.Group();
        let sw=0;
        (async () => {
            const u = `${baseUrl}/assets/torus2.glb`;
            rippleApp = await new Promise((accept, reject) => {
                const {gltfLoader} = useLoaders();
                gltfLoader.load(u, accept, function onprogress() {}, reject);
                
            });
            rippleApp.scene.traverse(o => {
                if (o.isMesh) {
                  addInstancedMesh(o.geometry);
                }
            });
            
            
        })();

        let quaternion = new THREE.Quaternion();
        let euler = new THREE.Euler();
        let mesh=null;
        const addInstancedMesh=(rippleGeometry)=>{
            const geometry = _getRippleGeometry(rippleGeometry);
            mesh = new THREE.InstancedMesh(
                geometry,
                rippleMaterial,
                count
            );
            group.add(mesh);
            app.add(group);
            const positionsAttribute = mesh.geometry.getAttribute('positions');
            const scalesAttribute = mesh.geometry.getAttribute('scales');
            const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
            for (let i = 0; i < count; i++) {
                
                let randScale = 0.5+0.4*i*(Math.random());
                let randPos = 0.15*(Math.random());
                positionsAttribute.setXYZ(i, randPos, (Math.random()-0.5)*0.5, randPos);
                scalesAttribute.setX(i, randScale);
                
                euler.x=(Math.random()-0.5)*0.25;
                euler.y=(Math.random()-0.5);
                euler.z=(Math.random()-0.5)*0.25;
                
                
                quaternion.setFromEuler(euler);
                quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                
               
            }
            positionsAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            quaternionsAttribute.needsUpdate = true;
        }

        app.updateMatrixWorld();

        let alreadyPlaySplash = false;
        let lastTimePlaySplash = 0;
        let v=0;
    
        let jumpSw=0;
        let type=1;
        useFrame(({timestamp}) => {
            if (contactWater){
                if(jumpSw===0)
                    jumpSw=1;
            }
            else{
                if(jumpSw=2)
                    jumpSw=0;
            }

            if(currentRise===1 && !belowWater && !alreadyPlaySplash && contactWater && localPlayer.characterPhysics.velocity.y>1.5){
                v = localPlayer.characterPhysics.velocity.y;
                alreadyPlaySplash = true;
                lastTimePlaySplash=timestamp;
                //console.log(v);
            }
            if(currentRise===0 || (currentRise===-1 && timestamp-lastTimePlaySplash>1000)){
                v=-1;
                alreadyPlaySplash=false;
            }

            if (mesh) {
                // const opacityAttribute = mesh.geometry.getAttribute('opacity');
                // const brokenAttribute = mesh.geometry.getAttribute('broken');
                // const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
                const positionsAttribute = mesh.geometry.getAttribute('positions');
                const scalesAttribute = mesh.geometry.getAttribute('scales');
                const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
                let falling = fallindSpeed>10?10:fallindSpeed;
                let riseSpeed = v>5?5:v;
                for (let i = 0; i < count; i++) {
                    if(jumpSw==1){
                        
                        
                        
                        if(fallindSpeed<7 && i<count-1){
                            scalesAttribute.setX(i, 0);
                            positionsAttribute.setXYZ(i, 0,-50000, 0);
                        }
                        else{
                            let randScale = (0.3*(falling/10)*(i+1)+0.2*(Math.random()))/3;
                            scalesAttribute.setX(i, randScale);
                            positionsAttribute.setXYZ(i, 0, (Math.random()-0.5)*0.1, 0);
                        }
                        
                        euler.x=(Math.random()-0.5)*0.05;
                        euler.y=(Math.random()-0.5);
                        euler.z=(Math.random()-0.5)*0.05;
                        
                        
                        quaternion.setFromEuler(euler);
                        quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                    }
                    else if(v>0){
                        
                        
                        if(i!==1){
                            scalesAttribute.setX(i, 0);
                            positionsAttribute.setXYZ(i, 0,-50000, 0);
                        }
                        else{
                            let randScale = (0.3*(riseSpeed/5)*(i+1)+0.2*(Math.random()))/3;
                            scalesAttribute.setX(i, randScale);
                            positionsAttribute.setXYZ(i, 0, (Math.random()-0.5)*0.1, 0);
                        }
                        
                        euler.x=(Math.random()-0.5)*0.05;
                        euler.y=(Math.random()-0.5);
                        euler.z=(Math.random()-0.5)*0.05;
                        
                        
                        quaternion.setFromEuler(euler);
                        quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                    }
                    
                   
                    scalesAttribute.setX(i, scalesAttribute.getX(i)+0.01*(i+1)*0.25);
    
                }
                positionsAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
                quaternionsAttribute.needsUpdate = true;
                // opacityAttribute.needsUpdate = true;
                // brokenAttribute.needsUpdate = true;
                // startTimesAttribute.needsUpdate = true;
            }

           
           
            if(jumpSw==1){
                type=1;
                group.position.copy(localPlayer.position);
                rippleMaterial.uniforms.uTime.value=0.3;
                rippleMaterial.uniforms.opacity.value = 1;
                jumpSw=2;
            }
            if(v>0){
                type=2;
                group.position.copy(localPlayer.position);
                rippleMaterial.uniforms.uTime.value=0.3;
                rippleMaterial.uniforms.opacity.value = 1;
                v=-1;
            }
            
            if(rippleMaterial.uniforms.uTime.value>0.43)
                rippleMaterial.uniforms.opacity.value-=0.05;
                
            if(type===1){
                rippleMaterial.uniforms.uTime.value +=0.0035 
            }
            else{
                rippleMaterial.uniforms.uTime.value +=0.0045 
            }
            
            
            
            // if (localPlayer.avatar) {
            //     group.position.y -= localPlayer.avatar.height;
            //     group.position.y += 0.65;
            // }
            group.position.y=waterHeight-0.1;
            app.updateMatrixWorld();
        });
    }

    //###################################################################### 1 layer ripple ######################################################################
    {
        let ripple;
        let group = new THREE.Group();
        let sw=0;
        (async () => {
            const u = `${baseUrl}/assets/torus5.glb`;
            ripple = await new Promise((accept, reject) => {
                const {gltfLoader} = useLoaders();
                gltfLoader.load(u, accept, function onprogress() {}, reject);

            });
            //ripple.scene.position.y=-5000;

            
            group.add(ripple.scene);
            app.add(group);

            ripple.scene.children[0].material= new THREE.ShaderMaterial({
                uniforms: {
                    uTime: {
                        value: 0,
                    },
                    opacity: {
                        value: 0,
                    },
                    uThickness:{
                        value:1
                    },
                    uBroken:{
                        value:0
                    },
                    uFrequency:{
                        value:80
                    },
                    avatarPos:{
                        value: new THREE.Vector3(0,0,0)
                    },
                    iResolution: { value: new THREE.Vector3() },
                    perlinnoise:{
                        value: wave2
                    },
                    // noiseMap:{
                    //     value: noiseMap
                    // }
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
                    uniform float uThickness;
                    uniform float uFrequency; 
                    uniform float uBroken;
                    varying vec2 vUv;
                    varying vec3 vPos;
                    
                    uniform sampler2D perlinnoise;
                    //uniform sampler2D noiseMap;
                    
                    //const float uFrequency = 80.0; 
                    const float rSpeed = .08;
                    //const float uThickness = 1.0;
                    const float radiusEnd = .45;
                    const float radiusStart = .08;
                    const float PI = 3.1415926535897932384626433832795;
                    
                    float radialNoise(vec2 uv){ 
                        //Matches sampling to speed of ripples 
                        uv.y -= rSpeed*uTime;
                        //uv.x*=mod(uTime/100.,0.1);
                        const int octaves = 2;
                        //Increasing scale makes noise more fine-grained
                        const float scale = .35;
                        //Increasing power makes noise more 'solid' at outer ripple edge    
                        float power = 2.2;
                        float total = 0.0;
                        for(int i = 0; i<octaves; i++){
                            total += texture(perlinnoise,uv*(power*scale)).r*(1.0/power);
                            power *=2.;
                        }
                        return total;
                    }
                    
                    void main() {

                        vec2 uv = vUv;
                        
            
                        vec2 center = vec2(.5, .5);
                        vec2 toCenter = uv-center;
                        float dist = length(toCenter);
                        float distScalar = max(.0,1.0 - dist/radiusEnd);
                        float ripple = sin((dist-rSpeed*uTime)*uFrequency);
                        ripple = max(0.0,ripple);
                        ripple = pow(ripple,uThickness);
                        ripple = (dist>radiusStart) ? ripple*distScalar : 0.0;
                        
                        
                        float angle = atan(toCenter.x,toCenter.y);
                        angle = (angle + PI) / (2.0 * PI);
                        float noise = radialNoise(vec2(angle,dist))*uBroken;
                        
                        float total = ripple;
                        total -= noise;
                        total = total < .01 ? 0.0 : 1.0;
                        
                        
                        gl_FragColor = vec4(total);
                        gl_FragColor.a*=opacity;

                        // float broken = abs( sin( 1.0 - uBroken ) ) - texture2D( noiseMap, vec2(vUv.x,vUv.y-rSpeed*uTime) ).g;
                        // if ( broken < 0.0001 ) discard;
                        
                        
                    ${THREE.ShaderChunk.logdepthbuf_fragment}
                    }
                `,
                //side: THREE.DoubleSide,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending,
            });
            sw=1;

        })();
        app.updateMatrixWorld();
        
        let jumpSw=0;
        useFrame(({timestamp}) => {
            if (contactWater){
                if(jumpSw===0)
                    jumpSw=1;
            }
            else{
                if(jumpSw=2)
                    jumpSw=0;
            }

            if(sw==1){
                
                if(jumpSw==1 && fallindSpeed>11){
                    group.position.copy(localPlayer.position);
                    ripple.scene.children[0].material.uniforms.uTime.value = 0;
                    ripple.scene.children[0].material.uniforms.opacity.value = 1;
                    ripple.scene.children[0].material.uniforms.uThickness.value = 1;
                    ripple.scene.children[0].material.uniforms.uFrequency.value = 80;
                    ripple.scene.children[0].material.uniforms.uBroken.value = 0.1;
                    ripple.scene.scale.set(0.01,0.01,0.01);
                    jumpSw=2;
                }
                
                ripple.scene.children[0].material.uniforms.uTime.value += 0.025;
                ripple.scene.children[0].material.uniforms.opacity.value-=0.01;
                ripple.scene.children[0].material.uniforms.uThickness.value += 0.01;
                //if(ripple.scene.children[0].material.uniforms.uBroken.value<1)
                ripple.scene.children[0].material.uniforms.uBroken.value *= 1.04;
                
                // if(ripple.scene.children[0].material.uniforms.uFrequency.value >10)
                //     ripple.scene.children[0].material.uniforms.uFrequency.value -= 0.25;
                ripple.scene.scale.x+=0.01;
                ripple.scene.scale.z+=0.01;

            }
            
            // if (localPlayer.avatar) {
            //     group.position.y -= localPlayer.avatar.height;
            //     group.position.y += 0.65;
            // }
            group.position.y=waterHeight;
            app.updateMatrixWorld();
        });
    }

    //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%% moving %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

    //###################################################################### ripple follow player ######################################################################
    {
        const particleCount = 30;
        const dropletRipplegroup=new THREE.Group();
    
        //##################################################### get ripple geometry #####################################################
        const identityQuaternion = new THREE.Quaternion();
        const _getRippleGeometry = geometry => {
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
    
            const waveFreq = new Float32Array(particleCount);
            const waveFreqAttribute = new THREE.InstancedBufferAttribute(waveFreq, 1);
            geometry2.setAttribute('waveFreq', waveFreqAttribute);
    
            const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            opacityAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('opacity', opacityAttribute);
    
            const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            brokenAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('broken', brokenAttribute);

            const scales = new Float32Array(particleCount);
            const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scaleAttribute);

            const playerRotation = new Float32Array(particleCount);
            const playerRotAttribute = new THREE.InstancedBufferAttribute(playerRotation, 1);
            geometry2.setAttribute('playerRotation', playerRotAttribute);

            const speed = new Float32Array(particleCount);
            const speedAttribute = new THREE.InstancedBufferAttribute(speed, 1);
            geometry2.setAttribute('speed', speedAttribute);

            const rand = new Float32Array(particleCount);
            const randAttribute = new THREE.InstancedBufferAttribute(rand, 1);
            geometry2.setAttribute('random', randAttribute);
        
            return geometry2;
        };
    
        //##################################################### material #####################################################
        const splashMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                noiseMap:{
                    value: noiseMap3
                },
                noiseMap2:{
                    value: noiseMap
                }
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
                uniform float uTime;
        
                varying vec2 vUv;
                varying vec3 vPos;
                varying float vBroken;
                varying float vOpacity;
                varying float vWaveFreq;
                varying float vSpeed;
                varying float vRand;
                attribute vec3 positions;
                attribute float scales;
                attribute float random;
                attribute float opacity;
                attribute float waveFreq;
                attribute vec4 quaternions;
                attribute float broken;
                attribute float speed;
                attribute float playerRotation;
                vec3 qtransform(vec3 v, vec4 q) { 
                  return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
                }
            
                void main() {

                    mat3 rotY =
                        mat3(cos(playerRotation), 0.0, -sin(playerRotation), 0.0, 1.0, 0.0, sin(playerRotation), 0.0, cos(playerRotation));
                    mat3 rotX =
                        mat3(1.0, 0.0, 0.0, 0.0, cos(PI/2.), sin(PI/2.), 0.0, -sin(PI/2.), cos(PI/2.));
                    
                    mat3 rotZ = mat3(
                        cos(-PI/2.), sin(-PI/2.), 0.0,
                        -sin(-PI/2.), cos(-PI/2.), 0.0, 
                        0.0, 0.0 , 1.0
                    );

                vOpacity=opacity;
                vBroken=broken;
                vWaveFreq=waveFreq;
                vSpeed=speed;
                vRand=random;
                vUv=uv;
                vPos=position;
                vec3 pos = position;
                pos = qtransform(pos, quaternions);
                pos*=rotY;
                pos*=scales;
                pos+=positions;
                //pos*=rotX;
                
                
                
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
                varying float vWaveFreq;
                varying float vBroken;
                varying float vOpacity;
                varying float vSpeed;
                varying float vRand;
                varying vec2 vUv;
                varying vec3 vPos;
                uniform sampler2D noiseMap;
                uniform sampler2D noiseMap2;
                //#define PI 3.1415926


                const float rFrequency = 10.0; 
                const float rSpeed = .08;
                const float rThickness = 50.0;
                const float radiusEnd = .45;
                const float radiusStart = .08;
                const float PI = 3.1415926535897932384626433832795;

                //Noise that moves radially outwards via polar coordinates
                float radialNoise(vec2 uv){ 
                    //Matches sampling to speed of ripples 
                    uv.y -= rSpeed*uTime;
                    
                    const int octaves = 2;
                    //Increasing scale makes noise more fine-grained
                    const float scale = .15;
                    //Increasing power makes noise more 'solid' at outer ripple edge    
                    float power = 2.2;
                    float total = 0.0;
                    for(int i = 0; i<octaves; i++){
                        total += texture(noiseMap,uv*(power*scale)+vRand).r*(1.0/power);
                        power *=2.0;
                    }
                    return total;
                }
                
                void main() {
                    vec2 uv = vUv;
                    

                    vec2 center= vec2(.5, .5);
                    
                    
                    vec2 toCenter = uv-center;
                    float dist = length(toCenter);

                    
                    float distScalar = max(0.0,1.0 - dist/radiusEnd);
                    float ripple = sin((dist-rSpeed)*rFrequency);
                    ripple = max(0.0,ripple);
                    ripple = pow(ripple,rThickness);
                    ripple = (dist>radiusStart) ? ripple*distScalar : 0.0;
                    
                    
                    float angle = atan(toCenter.x,toCenter.y);
                    angle = (angle + PI) / (2.0 * PI);
                    float noise = radialNoise(vec2(angle,dist));
                    
                    
                    float total = ripple;
                    total -= noise;
                    total = total < vRand/10. ? 0.0 : 1.0;
                    
                    gl_FragColor = vec4(total);
                    if(vSpeed>0.1){
                        if(vUv.y<0.45){
                            gl_FragColor.a=0.;
                        }
                    }
                    gl_FragColor.a*=vOpacity;     

                   
                    vec3 noise2 = texture2D(
                                            noiseMap2,
                                            vec2(
                                                vUv.x,
                                                vUv.y
                                            )
                                        ).rgb;
                    
                    
                    float broken = abs( sin( 1.0 - vBroken ) ) - noise2.g;
                    //float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
                    if ( broken < 0.0001 ) discard;
                    
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            
        });
        
       
    
        
    
        //##################################################### object #####################################################
        let rippleMesh=null;
        let quaternion = new THREE.Quaternion();
        
        const addInstancedMesh2=()=>{
            const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
            const geometry =_getRippleGeometry(geometry2)
            rippleMesh = new THREE.InstancedMesh(
                geometry,
                splashMaterial,
                particleCount
            );
            dropletRipplegroup.add(rippleMesh);
            app.add(dropletRipplegroup);
            
            const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
            for (let i = 0; i < particleCount; i++) {
                quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
                quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
            }
            quaternionsAttribute.needsUpdate = true;
        }
        addInstancedMesh2();
        app.updateMatrixWorld();
       
        let currentIndex=0;
        let lastEmmitTime=0;
        let localVector = new THREE.Vector3();
        useFrame(({timestamp}) => {
            
            if(currentIndex>=particleCount){
                currentIndex=0;
            }
            
            
            if (rippleMesh) {
                const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
                const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
                const waveFreqAttribute = rippleMesh.geometry.getAttribute('waveFreq');
                const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
                const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
                const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
                const speedAttribute = rippleMesh.geometry.getAttribute('speed');
                const playerRotationAttribute = rippleMesh.geometry.getAttribute('playerRotation');
                const randAttribute = rippleMesh.geometry.getAttribute('random');
                for (let i = 0; i < particleCount; i++) {
                    
                    // if(jumpSw===1){
                        //positionsAttribute.setXYZ(i,1.*Math.cos(i* Math.random()), 1.*Math.sin(i* Math.random()),0);
                    //     scalesAttribute.setX(i,Math.random()*0.2);
                    //     opacityAttribute.setX(i,0.5+0.3*Math.random());
                    //     waveFreqAttribute.setX(i, Math.random()*(i%10));
                    //     brokenAttribute.setX(i, Math.random()-0.8);
                    // }
                    
                    
                    opacityAttribute.setX(i,opacityAttribute.getX(i)-0.013);
                    scalesAttribute.setX(i,scalesAttribute.getX(i)+0.1*(currentSpeed+0.3));
                    if(brokenAttribute.getX(i)<1)
                        brokenAttribute.setX(i, brokenAttribute.getX(i)+0.01);
                    
    
                }
                if(timestamp - lastEmmitTime > 150*Math.pow((1.1-currentSpeed),0.3)  && currentSpeed>0.005 && shallowWater){

                    
                   
                    
                    if(localPlayer.rotation.x!==0){
                        playerRotationAttribute.setX(currentIndex,Math.PI+localPlayer.rotation.y);
                    }
                    else{
                        playerRotationAttribute.setX(currentIndex,-localPlayer.rotation.y);
                    }
                    waveFreqAttribute.setX(currentIndex, Math.random()*(currentIndex%10));
                    speedAttribute.setX(currentIndex,currentSpeed);
                    brokenAttribute.setX(currentIndex,0.1);
                    scalesAttribute.setX(currentIndex,1.5+Math.random()*0.1);
                    opacityAttribute.setX(currentIndex,0.7+0.3*Math.random());
                    positionsAttribute.setXYZ(currentIndex,localPlayer.position.x+(Math.random()-0.5)*0.1, 0, localPlayer.position.z+(Math.random()-0.5)*0.1);
                    randAttribute.setX(currentIndex,Math.random()*0.5)
                    currentIndex++;
                    lastEmmitTime=timestamp;
                }
                
                
                // if(jumpSw==1){
                //     dropletRipplegroup.position.copy(localPlayer.position);
                //     jumpSw=0;
                // }
                
                
                dropletRipplegroup.position.y = waterHeight;
                positionsAttribute.needsUpdate = true;
                randAttribute.needsUpdate = true;
                opacityAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
                speedAttribute.needsUpdate = true;
                brokenAttribute.needsUpdate = true;
                waveFreqAttribute.needsUpdate = true;
                quaternionsAttribute.needsUpdate = true;
                playerRotationAttribute.needsUpdate = true;
                rippleMesh.material.uniforms.uTime.value=timestamp/1000;
    
            }
            app.updateMatrixWorld();
            
        });
      }
      //###################################################################### circle splash follow player ######################################################################
    {
        const particleCount = 25;
        const group=new THREE.Group();
        let matrix = new THREE.Matrix4();
        let dummy = new THREE.Object3D();
        let info = {
            velocity: [particleCount]
        }
        let acc = new THREE.Vector3(0, -0.002, 0);
    
        //##################################################### get geometry #####################################################
        const identityQuaternion = new THREE.Quaternion();
        const _getSplashGeometry = geometry => {
            //console.log(geometry)
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

            const scales = new Float32Array(particleCount);
            const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scaleAttribute);
        
            return geometry2;
        };
    
        //##################################################### material #####################################################
        const splashMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                perlinnoise:{
                    value: splashTexture
                },
                noiseMap:{
                    value: noiseMap
                },
                cameraBillboardQuaternion: {
                    value: new THREE.Quaternion(),
                },
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
                uniform float uTime;
                uniform vec4 cameraBillboardQuaternion;
        
                varying vec2 vUv;
                varying vec3 vPos;
                varying float vBroken;
                varying float vOpacity;
                attribute vec3 positions;
                attribute float scales;
                attribute vec4 quaternions;
                attribute float broken;
                attribute float opacity;
                // vec3 qtransform(vec3 v, vec4 q) { 
                //   return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
                // }
                vec3 rotateVecQuat(vec3 position, vec4 q) {
                    vec3 v = position.xyz;
                    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
                }
            
                void main() {
                vBroken=broken;
                vOpacity=opacity;
                vUv=uv;
                vPos=position;
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
                varying float vBroken;
                varying float vOpacity;
                varying vec2 vUv;
                varying vec3 vPos;
                uniform sampler2D perlinnoise;
                uniform sampler2D noiseMap;
                
                
                
                
                
                void main() {
                    // vec3 ripple2 = texture2D(
                    //     perlinnoise,
                    //     mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
                    // ).rgb; 

                    vec3 noise = texture2D(
                        noiseMap,
                        mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
                    ).rgb;
                    vec4 ripple = texture2D(
                        perlinnoise,
                        vUv
                    );


                    gl_FragColor = ripple;
                    if(gl_FragColor.r<0.1){
                        discard;
                    }
                    else{
                        gl_FragColor=vec4(1.0,1.0,1.0,1.0);
                    }
                    //float broken = abs( sin( 1.0 - mod(uTime,1.0) ) ) - noise.r;
                    float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
                    if ( broken < 0.0001 ) discard;

                    gl_FragColor.a*=vOpacity;

                    
                    // if(gl_FragColor.r >= 0.65){
                    //    gl_FragColor =  vec4(1.,1.,1.,1.);
                    // }else{
                    //     gl_FragColor = vec4(0.,0.,1.,0.);
                    // }
                    // float broken = abs( sin( pow(1.0 - vUv.y,1.) ) ) - noise.g;
                    // if ( broken < 0.0001 ) discard;
                    // gl_FragColor.a*=opacity;
                    // if(uTime>0.5)
                    //     gl_FragColor.a=0.;
                    
                    //gl_FragColor=vec4(1.0,1.0,1.0,1.0);
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            //blending: THREE.AdditiveBlending,
            
        });
        
       
    
        
    
        //##################################################### object #####################################################
        let mesh=null;
        const addInstancedMesh=()=>{
            const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
            const geometry =_getSplashGeometry(geometry2)
            mesh = new THREE.InstancedMesh(
                geometry,
                splashMaterial,
                particleCount
            );
            group.add(mesh);
            app.add(group);
            const positionsAttribute = mesh.geometry.getAttribute('positions');
            const scalesAttribute = mesh.geometry.getAttribute('scales');
            const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
            for (let i = 0; i < particleCount; i++) {
                mesh.getMatrixAt(i, matrix);
                matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                
                
                let angle = i / (particleCount-1) * Math.PI;
                positionsAttribute.setXYZ(i,.1* Math.sin(angle), 0, .1* Math.cos(angle));
                
                // let randScale = 0.7+0.5*(Math.random());
                // scalesAttribute.setX(i, 1);
                
                // let quaternion = new THREE.Quaternion();
                // quaternion.setFromAxisAngle(new THREE.Vector3((Math.random()-0.5)*0.25,1,(Math.random()-0.5)*0.25),angle);
                
                //quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                info.velocity[i] = (new THREE.Vector3(
                    1*(Math.random()-0.5),
                    1*(Math.random()-0.5),
                    2.5+1*(Math.random())));
                info.velocity[i].divideScalar(20);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
            positionsAttribute.needsUpdate = true;
            scalesAttribute.needsUpdate = true;
            quaternionsAttribute.needsUpdate = true;
        }
        addInstancedMesh();
        app.updateMatrixWorld();
       
        let jumpSw=0;
        let quaternion = new THREE.Quaternion();
        useFrame(({timestamp}) => {
            if (contactWater){
                if(jumpSw===0)
                    jumpSw=1;
            }
            else{
                if(jumpSw=2)
                    jumpSw=0;
            }
            
           
            
            if (mesh) {
                const opacityAttribute = mesh.geometry.getAttribute('opacity');
                const brokenAttribute = mesh.geometry.getAttribute('broken');
                // const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
                const positionsAttribute = mesh.geometry.getAttribute('positions');
                const scalesAttribute = mesh.geometry.getAttribute('scales');
                const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
                for (let i = 0; i < particleCount; i++) {
                    mesh.getMatrixAt(i, matrix);
                    matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                    
                    if(currentSpeed>0.2 && positionsAttribute.getY(i)<-0.1 && floatOnWater){
                        info.velocity[i].x=0.4*(Math.cos(i));
                        info.velocity[i].y=0.15+0.15*(Math.random());
                        info.velocity[i].z=0.4*(Math.sin(i));
                        
                            
                        info.velocity[i].divideScalar(20);
                        
                        quaternion.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.random()*Math.PI);
                        
                        quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                        positionsAttribute.setXYZ(i, (Math.cos(i))*0.1,0,(Math.sin(i))*0.1);
                        brokenAttribute.setX(i, Math.random()*0.3+0.4);
                        opacityAttribute.setX(i, 0.8);
                        scalesAttribute.setX(i, Math.random()*0.25);
                    }
                    

                    if(dummy.position.y>=-100){

                        
                        positionsAttribute.setXYZ(  i, 
                                                    positionsAttribute.getX(i)+info.velocity[i].x,
                                                    positionsAttribute.getY(i)+info.velocity[i].y,
                                                    positionsAttribute.getZ(i)+info.velocity[i].z
                                                );

                        opacityAttribute.setX(i, opacityAttribute.getX(i)-0.015);
                        if(brokenAttribute.getX(i)<1.0)
                            brokenAttribute.setX(i, brokenAttribute.getX(i)+0.02);
                        // startTimesAttribute.setX(i, startTimesAttribute.getX(i)-0.008);
                        // //dummy.rotation.copy(camera.rotation);
                        // //dummy.rotation.x=timestamp*i*0.0001;
                        // // dummy.rotation.y+=0.1*(Math.random()-0.5);
                        // if(info.velocity[i].x<0)
                        //     dummy.rotation.z=timestamp*(i%10)*0.0001;
                        // else
                        //     dummy.rotation.z=-timestamp*(i%10)*0.0001;
                        
                        // dummy.scale.x*=1.02;
                        // dummy.scale.y*=1.02;
                        // dummy.scale.z*=1.02;
                        
                        
                        
                       
                        info.velocity[i].add(acc);
                        // dummy.position.add(info.velocity[i]);
                        // dummy.updateMatrix();
                        // mesh.setMatrixAt(i, dummy.matrix);
                    }
                    
    
                }
                if(currentSpeed>0.2  && floatOnWater){
                    group.position.copy(localPlayer.position);
                    secondSplashSw=0;
                    jumpSw=2;
                }
                
                // // group.rotation.copy(localPlayer.rotation);
                // if (localPlayer.avatar) {
                //   group.position.y -= localPlayer.avatar.height;
                //   group.position.y += 0.5;
                // }
                group.position.y = waterHeight;
                // localPlayer.getWorldDirection(dum)
                // dum = dum.normalize();
                // group.position.x+=0.3*dum.x;
                // group.position.z+=0.3*dum.z;
                //group.rotation.copy(camera.rotation);
                mesh.instanceMatrix.needsUpdate = true;
                positionsAttribute.needsUpdate = true;
                opacityAttribute.needsUpdate = true;
                brokenAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
                quaternionsAttribute.needsUpdate = true;
                // startTimesAttribute.needsUpdate = true;
                mesh.material.uniforms.uTime.value=timestamp/1000;
                mesh.material.uniforms.cameraBillboardQuaternion.value.copy(camera.quaternion);
    
            }
            group.updateMatrixWorld();
        });
      }
    
      //###################################################################### floating splash follow player ######################################################################
    {
        const particleCount = 30;
        const dropletRipplegroup=new THREE.Group();
    
        //##################################################### get ripple geometry #####################################################
        const identityQuaternion = new THREE.Quaternion();
        const _getRippleGeometry = geometry => {
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
    
            const waveFreq = new Float32Array(particleCount);
            const waveFreqAttribute = new THREE.InstancedBufferAttribute(waveFreq, 1);
            geometry2.setAttribute('waveFreq', waveFreqAttribute);
    
            const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            opacityAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('opacity', opacityAttribute);
    
            const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
            brokenAttribute.setUsage(THREE.DynamicDrawUsage);
            geometry2.setAttribute('broken', brokenAttribute);

            const scales = new Float32Array(particleCount);
            const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
            geometry2.setAttribute('scales', scaleAttribute);

            const playerRotation = new Float32Array(particleCount);
            const playerRotAttribute = new THREE.InstancedBufferAttribute(playerRotation, 1);
            geometry2.setAttribute('playerRotation', playerRotAttribute);

            const speed = new Float32Array(particleCount);
            const speedAttribute = new THREE.InstancedBufferAttribute(speed, 1);
            geometry2.setAttribute('speed', speedAttribute);
        
            return geometry2;
        };
    
        //##################################################### material #####################################################
        const splashMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: {
                    value: 0,
                },
                noiseMap:{
                    value: noiseMap
                },
                perlinnoise:{
                    value: splashTexture
                }
            },
            vertexShader: `\
                
                ${THREE.ShaderChunk.common}
                ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
                uniform float uTime;
        
                varying vec2 vUv;
                varying vec3 vPos;
                varying float vBroken;
                varying float vOpacity;
                varying float vWaveFreq;
                varying float vSpeed;
                attribute vec3 positions;
                attribute float scales;
                attribute float opacity;
                attribute float waveFreq;
                attribute vec4 quaternions;
                attribute float broken;
                attribute float speed;
                attribute float playerRotation;
                vec3 qtransform(vec3 v, vec4 q) { 
                  return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
                }
            
                void main() {

                    mat3 rotY =
                        mat3(cos(playerRotation), 0.0, -sin(playerRotation), 0.0, 1.0, 0.0, sin(playerRotation), 0.0, cos(playerRotation));
                    mat3 rotX =
                        mat3(1.0, 0.0, 0.0, 0.0, cos(PI/2.), sin(PI/2.), 0.0, -sin(PI/2.), cos(PI/2.));
                    
                    mat3 rotZ = mat3(
                        cos(-PI/2.), sin(-PI/2.), 0.0,
                        -sin(-PI/2.), cos(-PI/2.), 0.0, 
                        0.0, 0.0 , 1.0
                    );

                vOpacity=opacity;
                vBroken=broken;
                vWaveFreq=waveFreq;
                vSpeed=speed;
                vUv=uv;
                vPos=position;
                vec3 pos = position;
                pos = qtransform(pos, quaternions);
                pos*=rotY;
                pos*=scales;
                pos+=positions;
                //pos*=rotX;
                
                
                
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
                varying float vWaveFreq;
                varying float vBroken;
                varying float vOpacity;
                varying float vSpeed;
                varying vec2 vUv;
                varying vec3 vPos;
                uniform sampler2D noiseMap;
                uniform sampler2D perlinnoise;
                //#define PI 3.1415926


                void main() {
                    
                    vec4 splash = texture2D(
                        perlinnoise,
                        vUv
                    );
                    if(splash.r>0.1){
                        gl_FragColor = vec4(1.0);
                    }
                    
                    gl_FragColor.a*=vOpacity;
                    
                    
                    //float broken = abs( sin( 1.0 - vBroken ) ) - noise2.g;
                    float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
                    if ( broken < 0.0001 ) discard;
                    
                ${THREE.ShaderChunk.logdepthbuf_fragment}
                }
            `,
            side: THREE.DoubleSide,
            transparent: true,
            depthWrite: false,
            //blending: THREE.AdditiveBlending,
            
        });
        
       
    
        
    
        //##################################################### object #####################################################
        let rippleMesh=null;
        let quaternion = new THREE.Quaternion();
        
        const addInstancedMesh2=()=>{
            const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
            const geometry =_getRippleGeometry(geometry2)
            rippleMesh = new THREE.InstancedMesh(
                geometry,
                splashMaterial,
                particleCount
            );
            dropletRipplegroup.add(rippleMesh);
            app.add(dropletRipplegroup);
            
            const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
            for (let i = 0; i < particleCount; i++) {
                quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
                quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
            }
            quaternionsAttribute.needsUpdate = true;
        }
        addInstancedMesh2();
        app.updateMatrixWorld();
       
       
        let currentIndex=0;
        let lastEmmitTime=0;
        let localVector = new THREE.Vector3();
        useFrame(({timestamp}) => {
            
            if(currentIndex>=particleCount){
                currentIndex=0;
            }
            
            
            
            if (rippleMesh) {
                const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
                const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
                const waveFreqAttribute = rippleMesh.geometry.getAttribute('waveFreq');
                const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
                const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
                const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
                const speedAttribute = rippleMesh.geometry.getAttribute('speed');
                const playerRotationAttribute = rippleMesh.geometry.getAttribute('playerRotation');
                for (let i = 0; i < particleCount; i++) {
                    
                    // if(jumpSw===1){
                        //positionsAttribute.setXYZ(i,1.*Math.cos(i* Math.random()), 1.*Math.sin(i* Math.random()),0);
                    //     scalesAttribute.setX(i,Math.random()*0.2);
                    //     opacityAttribute.setX(i,0.5+0.3*Math.random());
                    //     waveFreqAttribute.setX(i, Math.random()*(i%10));
                    //     brokenAttribute.setX(i, Math.random()-0.8);
                    // }
                    
                    
                    //opacityAttribute.setX(i,opacityAttribute.getX(i)-0.003);
                    scalesAttribute.setX(i,scalesAttribute.getX(i)+0.05*(currentSpeed+0.3));
                    if(brokenAttribute.getX(i)<1)
                        brokenAttribute.setX(i, brokenAttribute.getX(i)+0.005);
                    
    
                }
                if(timestamp - lastEmmitTime > 300*Math.pow((1.1-currentSpeed),0.3)  && currentSpeed>0.2 && floatOnWater){

                    
                   
                    
                    
                    playerRotationAttribute.setX(currentIndex,Math.random()*Math.PI);
                    waveFreqAttribute.setX(currentIndex, Math.random()*(currentIndex%10));
                    speedAttribute.setX(currentIndex,currentSpeed);
                    brokenAttribute.setX(currentIndex,0.3+0.2*Math.random());
                    scalesAttribute.setX(currentIndex,1.2+Math.random()*0.1);
                    opacityAttribute.setX(currentIndex,0.15);
                    positionsAttribute.setXYZ(currentIndex,localPlayer.position.x-0.2*currentDir.x, 0, localPlayer.position.z-0.2*currentDir.z);
                    currentIndex++;
                    lastEmmitTime=timestamp;
                }
                
                
                // if(jumpSw==1){
                //     dropletRipplegroup.position.copy(localPlayer.position);
                //     jumpSw=0;
                // }
                
                
                dropletRipplegroup.position.y = waterHeight;
                positionsAttribute.needsUpdate = true;
                opacityAttribute.needsUpdate = true;
                scalesAttribute.needsUpdate = true;
                speedAttribute.needsUpdate = true;
                brokenAttribute.needsUpdate = true;
                waveFreqAttribute.needsUpdate = true;
                quaternionsAttribute.needsUpdate = true;
                playerRotationAttribute.needsUpdate = true;
                rippleMesh.material.uniforms.uTime.value=timestamp/1000;
    
            }
            app.updateMatrixWorld();
            
        });
      }
      //#################################################################### droplet follow player ########################################################################
    {
        const dropletgroup = new THREE.Group();
        const particleCount = 10;
        let info = {
            velocity: [particleCount],
            startTimes: [particleCount]
        }
        const acc = new THREE.Vector3(0, -0.002, 0);


        

    
        //################################################################ droplet object #########################################################
        let dropletMesh = null;
        let dummy = new THREE.Object3D();
        let matrix = new THREE.Matrix4();
    
        function addInstancedMesh() {
            dropletMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({map:splashTexture4, color: 0xF7D994, transparent:true, opacity:1, depthWrite:false, blending:THREE.AdditiveBlending}), particleCount);
            // dropletgroup.add(dropletMesh);
            // app.add(dropletgroup);
            app.add(dropletMesh)
            setInstancedMeshPositions(dropletMesh);
        }
        function setInstancedMeshPositions(mesh1) {
            for (let i = 0; i < particleCount; i++) {
                dropletMesh.getMatrixAt(i, matrix);
                matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                dummy.position.y=-500;
                dummy.scale.x = 1;
                dummy.scale.y = 1;
                dummy.scale.z = 1;
                info.velocity[i] = (new THREE.Vector3(
                    (Math.random() - 0.5)*3.,
                    Math.random() * 1.,
                    (Math.random() - 0.5)*3.));
                info.velocity[i].divideScalar(20);
                info.startTimes[i] =0;
                dummy.updateMatrix();
                mesh1.setMatrixAt(i, dummy.matrix);
            }
            mesh1.instanceMatrix.needsUpdate = true;
        }
        addInstancedMesh();

    
       
        let localVector=new THREE.Vector3();
        useFrame(({timestamp}) => {
           
          if (dropletMesh) {
            
            for (let i = 0; i < particleCount; i++) {
                dropletMesh.getMatrixAt(i, matrix);
                matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                
                
                if (currentSpeed> 0.2 && floatOnWater) {
                    if(info.startTimes[i]===0){
                        let rand=Math.random();
                        dummy.scale.x = rand;
                        dummy.scale.y = rand;
                        dummy.scale.z = rand;
                        info.startTimes[i]=timestamp;
                    }
                    
                    if(timestamp - info.startTimes[i] > 100){
                        if(dummy.scale.x<0.1){
                            let rand=Math.random();
                            dummy.scale.x = rand;
                            dummy.scale.y = rand;
                            dummy.scale.z = rand;
                            dummy.position.x = localPlayer.position.x-0.4*currentDir.x + (Math.random()-0.5)*0.5;
                            dummy.position.y = waterHeight;
                            dummy.position.z = localPlayer.position.z-0.4*currentDir.z + (Math.random()-0.5)*0.5; 
                            info.startTimes[i]=timestamp;
                            info.velocity[i].x=-0.005*currentDir.x;
                            info.velocity[i].y=0;
                            info.velocity[i].z=-0.005*currentDir.z;
                        }
                        
                    }
                   
                    
                    
                    // info.velocity[i].x=(Math.random() -0.5)*1;
                    // info.velocity[i].y=Math.random() *1.6;
                    // info.velocity[i].z=(Math.random() -0.5)*1;
                    
                    // info.velocity[i].divideScalar(20);
                    // info.alreadyHaveRipple[i]=false;
                }
                if(dummy.scale.x>=0.01){
                    //info.velocity[i].add(acc);
                    dummy.scale.x /=1.035;
                    dummy.scale.y /=1.035;
                    dummy.scale.z /=1.035;
                    dummy.position.add(info.velocity[i]);

                    dummy.rotation.copy(camera.rotation);
                    

                    dummy.updateMatrix();
                    
                    dropletMesh.setMatrixAt(i, dummy.matrix);
                    dropletMesh.instanceMatrix.needsUpdate = true;
                }
                
                
                
                
    
            }
           
            
            
            // if(jumpSw==1){
            //     dropletgroup.position.copy(localPlayer.position);
            //     jumpSw=0;
            // }
            
            dropletgroup.position.y = waterHeight-0.5;
    
    
        }
        
        });
      }

      

    


    //###################################################################### sea ######################################################################
    {
        
    
        // const material = new THREE.ShaderMaterial({
        //     vertexShader: `\
                
        //         ${THREE.ShaderChunk.common}
        //         ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
        //         void main() {
        //         vec4 modelPosition = modelMatrix * vec4(position, 1.0);
        //         vec4 viewPosition = viewMatrix * modelPosition;
        //         vec4 projectionPosition = projectionMatrix * viewPosition;
        
        //         gl_Position = projectionPosition;
        //         ${THREE.ShaderChunk.logdepthbuf_vertex}
        //         }
        //     `,
        //     fragmentShader: `\
        //         ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
                
        //         void main() {
                    
        //             gl_FragColor = vec4(0.0291, 0.970, 0.923, 1.0);
        //             //gl_FragColor.rgb *= 0.5;
        //             gl_FragColor.a = 0.25;
        //         ${THREE.ShaderChunk.logdepthbuf_fragment}
        //         }
        //     `,
        //     side: THREE.DoubleSide,
        //     transparent: true,
        //     depthWrite: false,
        //     blending: THREE.AdditiveBlending,
    
        //     clipping: false,
        //     fog: false,
        //     lights: false,
        // });
        // const geometry = new THREE.CircleGeometry( 600, 32 );
        // const sea = new THREE.Mesh( geometry, material );
        // sea.position.y = waterHeight;
        // sea.rotation.x = -Math.PI / 2;
        // app.add(sea);
        
        // const physics = usePhysics();
        // const material2 = new THREE.MeshBasicMaterial( {color: 0x000000, transparent:true, opacity:0, depthWrite:false, blending: THREE.AdditiveBlending} );
        // const plane = new THREE.Mesh(geometry, material2);

        // plane.position.y = waterHeight-1.;
        // plane.rotation.x = -Math.PI / 2;
        // let physicsId;
        // physicsId = physics.addGeometry(plane);
        //physicsIds.push(physicsId);
        //app.add(plane);


        // reflector
        const water = new Water(
            new THREE.CircleGeometry( 600, 32 ),
            {
                textureWidth: 1024,
                textureHeight: 1024,
                waterNormals: new THREE.TextureLoader().load( `${baseUrl}/textures/waternormals.jpg`, function ( texture ) {
    
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    
                } ),
                waterNormalTexture1: new THREE.TextureLoader().load( `${baseUrl}/textures/waterNormal2.png`, function ( texture ) {
    
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    
                } ),
                waterNormalTexture2: new THREE.TextureLoader().load( `${baseUrl}/textures/waterNormal3.png`, function ( texture ) {
    
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    
                } ),
                distortionScale: 3.7,
            }
        );
        water.rotation.x = -Math.PI / 2;
        water.position.y = waterHeight + 0.1;
        app.add(water);
        water.material.depthWrite = false;
        water.material.blending = THREE.AdditiveBlending;
        
        water.material.uniforms[ 'size' ].value /= 5.;
        
        useFrame(({timestamp}) => {
            water.material.uniforms[ 'time' ].value = timestamp /5000;
            water.material.uniforms[ 'iResolution' ].value.x = window.innerWidth;
            water.material.uniforms[ 'iResolution' ].value.y = window.innerHeight;
            water.material.uniforms[ 'iResolution' ].value.z = 1;
            app.updateMatrixWorld();
        });
        // useCleanup(() => {
        //     physics.removeGeometry(physicsId);
        // });
    }
   
  app.setComponent('renderPriority', 'low');
  
  return app;
};
 // {
    //     const geometry = new THREE.PlaneGeometry( 1200, 1200 );
        
    //     const vertexShader = `
    //       ${THREE.ShaderChunk.common}
    //       ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
    //       varying vec2 vUv;
    //       varying vec3 vPos;
    //       uniform float iTime;
      
    //       void main() {
    //           vPos=position;
    //           vUv = uv;
    //           vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    //           vec4 viewPosition = viewMatrix * modelPosition;
    //           vec4 projectedPosition = projectionMatrix * viewPosition;
      
    //           gl_Position = projectedPosition;
    //           ${THREE.ShaderChunk.logdepthbuf_vertex}
    //       }
    //       `;
    //       const fragmentShader = `
    //       ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    //       #include <common>
          
    //       uniform vec3 iResolution;
    //       uniform float iTime;
    //       varying vec2 vUv;
    //       varying vec3 vPos;
          
        


    //     #define WATER_COL vec3(0., 0.5, 1.0)
    //     #define WATER2_COL vec3(0.0, 0.4180, 0.8758)
    //     #define FOAM_COL vec3(0.8, 0.8180, 0.8758)
        
    //     #define M_2PI 6.283185307
    //     #define M_6PI 18.84955592
        
    //     float circ(vec2 pos, vec2 c, float s)
    //     {
    //         c = abs(pos - c);
    //         c = min(c, 1.0 - c);
        
    //         return smoothstep(0.0, 0.002, sqrt(s) - sqrt(dot(c, c))) * -1.0;
    //     }
        
    //     // Foam pattern for the water constructed out of a series of circles
    //     float waterlayer(vec2 uv)
    //     {
    //         uv = mod(uv, 1.0); // Clamp to [0..1]
    //         float ret = 1.0;
    //         ret += circ(uv, vec2(0.37378, 0.277169), 0.0268181);
    //         ret += circ(uv, vec2(0.0317477, 0.540372), 0.0193742);
    //         ret += circ(uv, vec2(0.430044, 0.882218), 0.0232337);
    //         ret += circ(uv, vec2(0.641033, 0.695106), 0.0117864);
    //         ret += circ(uv, vec2(0.0146398, 0.0791346), 0.0299458);
    //         ret += circ(uv, vec2(0.43871, 0.394445), 0.0289087);
    //         ret += circ(uv, vec2(0.909446, 0.878141), 0.028466);
    //         ret += circ(uv, vec2(0.310149, 0.686637), 0.0128496);
    //         ret += circ(uv, vec2(0.928617, 0.195986), 0.0152041);
    //         ret += circ(uv, vec2(0.0438506, 0.868153), 0.0268601);
    //         ret += circ(uv, vec2(0.308619, 0.194937), 0.00806102);
    //         ret += circ(uv, vec2(0.349922, 0.449714), 0.00928667);
    //         ret += circ(uv, vec2(0.0449556, 0.953415), 0.023126);
    //         ret += circ(uv, vec2(0.117761, 0.503309), 0.0151272);
    //         ret += circ(uv, vec2(0.563517, 0.244991), 0.0292322);
    //         ret += circ(uv, vec2(0.566936, 0.954457), 0.00981141);
    //         ret += circ(uv, vec2(0.0489944, 0.200931), 0.0178746);
    //         ret += circ(uv, vec2(0.569297, 0.624893), 0.0132408);
    //         ret += circ(uv, vec2(0.298347, 0.710972), 0.0114426);
    //         ret += circ(uv, vec2(0.878141, 0.771279), 0.00322719);
    //         ret += circ(uv, vec2(0.150995, 0.376221), 0.00216157);
    //         ret += circ(uv, vec2(0.119673, 0.541984), 0.0124621);
    //         ret += circ(uv, vec2(0.629598, 0.295629), 0.0198736);
    //         ret += circ(uv, vec2(0.334357, 0.266278), 0.0187145);
    //         ret += circ(uv, vec2(0.918044, 0.968163), 0.0182928);
    //         ret += circ(uv, vec2(0.965445, 0.505026), 0.006348);
    //         ret += circ(uv, vec2(0.514847, 0.865444), 0.00623523);
    //         ret += circ(uv, vec2(0.710575, 0.0415131), 0.00322689);
    //         ret += circ(uv, vec2(0.71403, 0.576945), 0.0215641);
    //         ret += circ(uv, vec2(0.748873, 0.413325), 0.0110795);
    //         ret += circ(uv, vec2(0.0623365, 0.896713), 0.0236203);
    //         ret += circ(uv, vec2(0.980482, 0.473849), 0.00573439);
    //         ret += circ(uv, vec2(0.647463, 0.654349), 0.0188713);
    //         ret += circ(uv, vec2(0.651406, 0.981297), 0.00710875);
    //         ret += circ(uv, vec2(0.428928, 0.382426), 0.0298806);
    //         ret += circ(uv, vec2(0.811545, 0.62568), 0.00265539);
    //         ret += circ(uv, vec2(0.400787, 0.74162), 0.00486609);
    //         ret += circ(uv, vec2(0.331283, 0.418536), 0.00598028);
    //         ret += circ(uv, vec2(0.894762, 0.0657997), 0.00760375);
    //         ret += circ(uv, vec2(0.525104, 0.572233), 0.0141796);
    //         ret += circ(uv, vec2(0.431526, 0.911372), 0.0213234);
    //         ret += circ(uv, vec2(0.658212, 0.910553), 0.000741023);
    //         ret += circ(uv, vec2(0.514523, 0.243263), 0.0270685);
    //         ret += circ(uv, vec2(0.0249494, 0.252872), 0.00876653);
    //         ret += circ(uv, vec2(0.502214, 0.47269), 0.0234534);
    //         ret += circ(uv, vec2(0.693271, 0.431469), 0.0246533);
    //         ret += circ(uv, vec2(0.415, 0.884418), 0.0271696);
    //         ret += circ(uv, vec2(0.149073, 0.41204), 0.00497198);
    //         ret += circ(uv, vec2(0.533816, 0.897634), 0.00650833);
    //         ret += circ(uv, vec2(0.0409132, 0.83406), 0.0191398);
    //         ret += circ(uv, vec2(0.638585, 0.646019), 0.0206129);
    //         ret += circ(uv, vec2(0.660342, 0.966541), 0.0053511);
    //         ret += circ(uv, vec2(0.513783, 0.142233), 0.00471653);
    //         ret += circ(uv, vec2(0.124305, 0.644263), 0.00116724);
    //         ret += circ(uv, vec2(0.99871, 0.583864), 0.0107329);
    //         ret += circ(uv, vec2(0.894879, 0.233289), 0.00667092);
    //         ret += circ(uv, vec2(0.246286, 0.682766), 0.00411623);
    //         ret += circ(uv, vec2(0.0761895, 0.16327), 0.0145935);
    //         ret += circ(uv, vec2(0.949386, 0.802936), 0.0100873);
    //         ret += circ(uv, vec2(0.480122, 0.196554), 0.0110185);
    //         ret += circ(uv, vec2(0.896854, 0.803707), 0.013969);
    //         ret += circ(uv, vec2(0.292865, 0.762973), 0.00566413);
    //         ret += circ(uv, vec2(0.0995585, 0.117457), 0.00869407);
    //         ret += circ(uv, vec2(0.377713, 0.00335442), 0.0063147);
    //         ret += circ(uv, vec2(0.506365, 0.531118), 0.0144016);
    //         ret += circ(uv, vec2(0.408806, 0.894771), 0.0243923);
    //         ret += circ(uv, vec2(0.143579, 0.85138), 0.00418529);
    //         ret += circ(uv, vec2(0.0902811, 0.181775), 0.0108896);
    //         ret += circ(uv, vec2(0.780695, 0.394644), 0.00475475);
    //         ret += circ(uv, vec2(0.298036, 0.625531), 0.00325285);
    //         ret += circ(uv, vec2(0.218423, 0.714537), 0.00157212);
    //         ret += circ(uv, vec2(0.658836, 0.159556), 0.00225897);
    //         ret += circ(uv, vec2(0.987324, 0.146545), 0.0288391);
    //         ret += circ(uv, vec2(0.222646, 0.251694), 0.00092276);
    //         ret += circ(uv, vec2(0.159826, 0.528063), 0.00605293);
    //         return max(ret, 0.0);
    //     }
        
    //     // Procedural texture generation for the water
    //     vec3 water(vec2 uv, vec3 cdir)
    //     {
    //         uv *= vec2(5.25);
        
    //         // Parallax height distortion with two directional waves at
    //         // slightly different angles.
    //         vec2 a = 0.025 * cdir.xz / cdir.y; // Parallax offset
    //         float h = sin(uv.x + iTime); // Height at UV
    //         uv += a * h;
    //         h = sin(0.841471 * uv.x - 0.540302 * uv.y + iTime);
    //         uv += a * h;
            
    //         // Texture distortion
    //         float d1 = mod(uv.x + uv.y, M_2PI);
    //         float d2 = mod((uv.x + uv.y + 0.25) * 1.3, M_6PI);
    //         d1 = iTime * 0.07 + d1;
    //         d2 = iTime * 0.5 + d2;
    //         vec2 dist = vec2(
    //             sin(d1) * 0.15 + sin(d2) * 0.05,
    //             cos(d1) * 0.15 + cos(d2) * 0.05
    //         );
            
    //         vec3 ret = mix(WATER_COL, WATER2_COL, waterlayer(uv + dist.xy));
    //         //ret = mix(ret, FOAM_COL, waterlayer(vec2(1.0) - uv - dist.yx));
    //         return ret;
    //     }
        
        
    //     void mainImage( out vec4 fragColor, in vec2 fragCoord )
    //     {
    //         fragColor = vec4(water(fragCoord/32., vec3(0,1,0)),1);
    //     }
      
    //       void main() {
    //         //vec4 test;
    //         //rippleColor(test, vUv * iResolution.xy);
    //         //if(test.r<0.8 && test.g<0.8)
    //           mainImage(gl_FragColor, vUv * iResolution.xy);
    //           //gl_FragColor.a*=0.9;
    //           //gl_FragColor=vec4(0.0546, 0.896, 0.910,1.0);
    //         //else
    //           //gl_FragColor = test;
    //         ${THREE.ShaderChunk.logdepthbuf_fragment}
    //       }
    //   `;
           
           
    //     const uniforms = {
    //         iTime: { value: 0 },
    //         iResolution: { value: new THREE.Vector3() },
            
    //     };
    //     const material = new THREE.ShaderMaterial({
    //         vertexShader,
    //         fragmentShader,
    //         uniforms,
    //         transparent: true,
    //         side: THREE.DoubleSide,
    //         depthWrite:false,
    //         blending:THREE.AdditiveBlending
    
    
    //     });
        
           
    //     const plane = new THREE.Mesh( geometry, material );
    //     plane.rotation.x=Math.PI/2;
    //     plane.position.y=waterHeight;
    //     app.add( plane );
        
    //     app.updateMatrixWorld();
        
    //     useFrame(({timestamp}) => {
            
    //       uniforms.iTime.value = timestamp /500;
    //       uniforms.iResolution.value.set(window.innerWidth, window.innerHeight, 1);
          
        
    //     });
    //   }
  

  

//###################################################################### little ripple ######################################################################
    // {
    //     const particleCount = 10;
    //     const dropletRipplegroup=new THREE.Group();
    
    //     //##################################################### get ripple geometry #####################################################
    //     const identityQuaternion = new THREE.Quaternion();
    //     const _getRippleGeometry = geometry => {
    //         const geometry2 = new THREE.BufferGeometry();
    //         ['position', 'normal', 'uv'].forEach(k => {
    //           geometry2.setAttribute(k, geometry.attributes[k]);
    //         });
    //         geometry2.setIndex(geometry.index);
            
    //         const positions = new Float32Array(particleCount * 3);
    //         const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
    //         geometry2.setAttribute('positions', positionsAttribute);
    //         const quaternions = new Float32Array(particleCount * 4);
    //         for (let i = 0; i < particleCount; i++) {
    //           identityQuaternion.toArray(quaternions, i * 4);
    //         }
    //         const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
    //         geometry2.setAttribute('quaternions', quaternionsAttribute);
    
    //         const waveFreq = new Float32Array(particleCount);
    //         const waveFreqAttribute = new THREE.InstancedBufferAttribute(waveFreq, 1);
    //         geometry2.setAttribute('waveFreq', waveFreqAttribute);
    
    //         const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('opacity', opacityAttribute);
    
    //         const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         brokenAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('broken', brokenAttribute);

    //         const scales = new Float32Array(particleCount);
    //         const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
    //         geometry2.setAttribute('scales', scaleAttribute);
        
    //         return geometry2;
    //     };
    
    //     //##################################################### material #####################################################
    //     const splashMaterial = new THREE.ShaderMaterial({
    //         uniforms: {
    //             uTime: {
    //                 value: 0,
    //             },
    //             noiseMap:{
    //                 value: noiseMap
    //             }
    //         },
    //         vertexShader: `\
                
    //             ${THREE.ShaderChunk.common}
    //             ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
    //             uniform float uTime;
        
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             varying float vBroken;
    //             varying float vOpacity;
    //             varying float vWaveFreq;
    //             attribute vec3 positions;
    //             attribute float scales;
    //             attribute float opacity;
    //             attribute float waveFreq;
    //             attribute vec4 quaternions;
    //             attribute float broken;
    //             vec3 qtransform(vec3 v, vec4 q) { 
    //               return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
    //             }
            
    //             void main() {
    //             vOpacity=opacity;
    //             vBroken=broken;
    //             vWaveFreq=waveFreq;
    //             vUv=uv;
    //             vPos=position;
    //             vec3 pos = position;
    //             pos*=scales;
    //             pos+=positions;
    //             pos = qtransform(pos, quaternions);
    //             vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    //             vec4 viewPosition = viewMatrix * modelPosition;
    //             vec4 projectionPosition = projectionMatrix * viewPosition;
        
    //             gl_Position = projectionPosition;
    //             ${THREE.ShaderChunk.logdepthbuf_vertex}
    //             }
    //         `,
    //         fragmentShader: `\
    //             ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    //             uniform float uTime;
    //             varying float vWaveFreq;
    //             varying float vBroken;
    //             varying float vOpacity;
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             uniform sampler2D noiseMap;
                
    //             void main() {
                    
    //                 vec2 wavedUv = vec2(
    //                     vUv.x,
    //                     vUv.y + sin(vUv.x * vWaveFreq * cos(uTime)) * 0.05
    //                 );
    //                 float strength = 1.0 - step(0.01, abs(distance(wavedUv, vec2(0.5)) - 0.25));

    //                 gl_FragColor = vec4(vec3(strength), 1.0);
    //                 gl_FragColor.a*=vOpacity;

    //                 float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
    //                 if ( broken < 0.0001 ) discard;
    //             ${THREE.ShaderChunk.logdepthbuf_fragment}
    //             }
    //         `,
    //         side: THREE.DoubleSide,
    //         transparent: true,
    //         depthWrite: false,
    //         blending: THREE.AdditiveBlending,
            
    //     });
        
       
    
        
    
    //     //##################################################### object #####################################################
    //     let rippleMesh=null;
    //     let quaternion = new THREE.Quaternion();
        
    //     let euler = new THREE.Euler();
    //     const addInstancedMesh2=()=>{
    //         const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
    //         const geometry =_getRippleGeometry(geometry2)
    //         rippleMesh = new THREE.InstancedMesh(
    //             geometry,
    //             splashMaterial,
    //             particleCount
    //         );
    //         dropletRipplegroup.add(rippleMesh);
    //         app.add(dropletRipplegroup);
    //         const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
    //         const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
            
    //         for (let i = 0; i < particleCount; i++) {
               
    //             positionsAttribute.setXYZ(i,.1* Math.random(), .1* Math.random(), 0);
                
              
    //             euler.x=Math.PI/2;
    //             euler.y=0;
    //             euler.z=0;
    //             quaternion.setFromEuler(euler);
    //             quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
    //         }
    //         positionsAttribute.needsUpdate = true;
    //         quaternionsAttribute.needsUpdate = true;
    //     }
    //     addInstancedMesh2();
    //     app.updateMatrixWorld();
       
    //     let jumpSw=0;
    //     let highSw=0;
    //     useFrame(({timestamp}) => {
    //         if (localPlayer.position.y>2.5){
    //             highSw=1;    
    //         }
    //         else if (localPlayer.position.y<2){
    //             if(highSw===1){
    //                 jumpSw=1;
    //                 highSw=0;
    //             }    
                
    //         }
            
           
            
    //         if (rippleMesh) {
    //             const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
    //             const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
    //             const waveFreqAttribute = rippleMesh.geometry.getAttribute('waveFreq');
    //             const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
    //             const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
    //             for (let i = 0; i < particleCount; i++) {
                    
    //                 if(jumpSw===1){
    //                     positionsAttribute.setXYZ(i,1.*Math.cos(i* Math.random()), 1.*Math.sin(i* Math.random()),0);
    //                     scalesAttribute.setX(i,Math.random()*0.2);
    //                     opacityAttribute.setX(i,0.5+0.3*Math.random());
    //                     waveFreqAttribute.setX(i, Math.random()*(i%10));
    //                     brokenAttribute.setX(i, Math.random()-0.8);
    //                 }
                    

    //                 opacityAttribute.setX(i,opacityAttribute.getX(i)-0.013);
    //                 scalesAttribute.setX(i,scalesAttribute.getX(i)+0.02);
    //                 if(brokenAttribute.getX(i)<1)
    //                     brokenAttribute.setX(i, brokenAttribute.getX(i)+0.008);
                    
    
    //             }
    //             if(jumpSw==1){
    //                 dropletRipplegroup.position.copy(localPlayer.position);
    //                 jumpSw=0;
    //             }
                
                
    //             dropletRipplegroup.position.y = waterHeight;
    //             positionsAttribute.needsUpdate = true;
    //             opacityAttribute.needsUpdate = true;
    //             scalesAttribute.needsUpdate = true;
    //             brokenAttribute.needsUpdate = true;
    //             waveFreqAttribute.needsUpdate = true;
    //             rippleMesh.material.uniforms.uTime.value=timestamp/1000;
    
    //         }
    //         dropletRipplegroup.updateMatrixWorld();
    //     });
    //   }

  //###################################################################### splash particle ######################################################################
    // {
    //     const particleCount = 250;
    //     const group=new THREE.Group();
    //     let info = {
    //         velocity: [particleCount]
    //     }
    //     let acc = new THREE.Vector3(0, -0.005, 0);
    
    //     //##################################################### get Dust geometry #####################################################
    //     const identityQuaternion = new THREE.Quaternion();
    //     const _getDustGeometry = geometry => {
    //         //console.log(geometry)
    //         const geometry2 = new THREE.BufferGeometry();
    //         ['position', 'normal', 'uv'].forEach(k => {
    //           geometry2.setAttribute(k, geometry.attributes[k]);
    //         });
    //         geometry2.setIndex(geometry.index);
            
    //         const positions = new Float32Array(particleCount * 3);
    //         const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
    //         geometry2.setAttribute('positions', positionsAttribute);
    //         const quaternions = new Float32Array(particleCount * 4);
    //         for (let i = 0; i < particleCount; i++) {
    //           identityQuaternion.toArray(quaternions, i * 4);
    //         }
    //         const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
    //         geometry2.setAttribute('quaternions', quaternionsAttribute);
    
    //         const startTimes = new Float32Array(particleCount);
    //         const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
    //         geometry2.setAttribute('startTimes', startTimesAttribute);
    
    //         const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('opacity', opacityAttribute);
    
    //         const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         brokenAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('broken', brokenAttribute);
        
    //         return geometry2;
    //     };
    
    //     //##################################################### material #####################################################
    //     let dustMaterial= new THREE.MeshBasicMaterial();
    //     dustMaterial.transparent=true; 
    //     dustMaterial.depthWrite=false;
    //     dustMaterial.alphaMap=noiseMap;
    //     dustMaterial.map=splashTexture;
    //     dustMaterial.blending= THREE.AdditiveBlending;
    //     dustMaterial.side=THREE.DoubleSide;
    //     //dustMaterial.opacity=0.2;
    
    //     const uniforms = {
    //         uTime: {
    //             value: 0
    //         },
    //     }
    //     dustMaterial.onBeforeCompile = shader => {
            
    //         shader.uniforms.uTime = uniforms.uTime;
    //         shader.vertexShader = 'attribute float startTimes;attribute float opacity;attribute float broken;\n varying float vStartTimes;varying float vOpacity; varying float vBroken; varying vec3 vPos; \n ' + shader.vertexShader;
    //         shader.vertexShader = shader.vertexShader.replace(
    //           '#include <begin_vertex>',
    //           ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vPos = position;vStartTimes=startTimes;  '].join('\n')
    //         );
    //         shader.fragmentShader = 'uniform float uTime; varying float vBroken; varying float vStartTimes; varying float vOpacity; varying vec3 vPos;\n' + shader.fragmentShader;
    //         shader.fragmentShader = shader.fragmentShader
    //         .replace(
    //             `vec4 diffuseColor = vec4( diffuse, opacity );`,
    //             `
                
                
    //              vec4 diffuseColor = vec4( vec3(vStartTimes,vStartTimes+0.1,1.0), vOpacity);
    //             `
    //         );
    //         shader.fragmentShader = shader.fragmentShader.replace(
    //             '#include <alphamap_fragment>',
    //             [
    //               'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, vUv ).g;',
    //               'if ( broken < 0.0001 ) discard;'
    //             ].join('\n')
    //         );
    //     };
        
       
    
        
    
    //     //##################################################### object #####################################################
    //     let mesh = null;
    //     let dummy = new THREE.Object3D();
    //     let color=new THREE.Color(1.0,1.0,1.0);
    
    //     function addInstancedMesh() {
    //         const geometry2 = new THREE.PlaneGeometry( .5, .5 );
    //         const geometry = _getDustGeometry(geometry2);
            
    //         mesh = new THREE.InstancedMesh(geometry, dustMaterial, particleCount);
    //         group.add(mesh);
    //         app.add(group);
    //         setInstancedMeshPositions(mesh);
            
    //     }
    //     let matrix = new THREE.Matrix4();
    //     function setInstancedMeshPositions(mesh1) {
    //         for (let i = 0; i < mesh1.count; i++) {
                
    //             mesh.getMatrixAt(i, matrix);
                
    //             dummy.scale.x = .00001;
    //             dummy.scale.y = .00001;
    //             dummy.scale.z = .00001;
    //             dummy.position.x = (Math.random()-0.5)*0.2;
    //             dummy.position.y = 0.5*(Math.random());
    //             dummy.position.z = i*0.1;
    //             // dummy.rotation.x=Math.random()*i;
    //             // dummy.rotation.y=Math.random()*i;
    //             // dummy.rotation.z=Math.random()*i;
    //             info.velocity[i] = (new THREE.Vector3(
    //                 0,
    //                 0,
    //                 -0.8-Math.random()));
    //             info.velocity[i].divideScalar(20);
    //             dummy.updateMatrix();
    //             mesh1.setMatrixAt(i, dummy.matrix);
    //         }
    //         mesh1.instanceMatrix.needsUpdate = true;
    //     }
       
    
        
    //     let sw=0;
    //     addInstancedMesh();
    //     let jumpSw=0;
    //     let highSw=0;
    //     useFrame(({timestamp}) => {
    //         if (localPlayer.position.y>2.5){
    //             highSw=1;    
    //         }
    //         else if (localPlayer.position.y<2){
    //             if(highSw===1){
    //                 jumpSw=1;
    //                 highSw=0;
    //             }    
                
    //         }
            
    //         group.position.copy(localPlayer.position);
    //         // group.rotation.copy(localPlayer.rotation);
    //         if (localPlayer.avatar) {
    //           group.position.y -= localPlayer.avatar.height;
    //           group.position.y += 0.2;
    //         }
    //         // localPlayer.getWorldDirection(dum)
    //         // dum = dum.normalize();
    //         // group.position.x+=0.3*dum.x;
    //         // group.position.z+=0.3*dum.z;
    //         group.rotation.copy(camera.rotation);
            
    //         if (mesh) {
    //             const opacityAttribute = mesh.geometry.getAttribute('opacity');
    //             const brokenAttribute = mesh.geometry.getAttribute('broken');
    //             const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
    //             for (let i = 0; i < particleCount; i++) {
    //                 mesh.getMatrixAt(i, matrix);
    //                 matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                    
    //                 //if (/*dummy.position.distanceTo(originPoint)>1.5*/ narutoRunTime>0) {
    //                 if(jumpSw==1){    
                        
                        
                        
    //                     opacityAttribute.setX(i, 1);
    //                     brokenAttribute.setX(i, Math.random()-0.2);
    //                     startTimesAttribute.setX(i, 1);
    //                     //if(particleEmmitCount!==-1 ){
    //                         let rand=Math.random()*1;
    //                         dummy.scale.set(rand,rand,rand)
    //                         // dummy.scale.x = 0.5+Math.random()*0.5;
    //                         // dummy.scale.y = 0.5+Math.random()*0.5;
    //                         // dummy.scale.z = 0.5+Math.random()*0.5;
                            
    //                     // }
    //                     // else{
    //                     //     dummy.scale.x = .00001;
    //                     //     dummy.scale.y = .00001;
    //                     //     dummy.scale.z = .00001;
    //                     //     //opacityAttribute.setX(i, 0.01);
    //                     // }
                        
                        
    //                     dummy.position.x = 0;
    //                     dummy.position.y = -1*(Math.random());
    //                     dummy.position.z = 0.;
                        
    //                     info.velocity[i].x=2*(Math.random()-0.5);
    //                     info.velocity[i].y=2+1*(Math.random());
    //                     info.velocity[i].z=2*(Math.random()-0.5);
                        
                            
    //                     info.velocity[i].divideScalar(20);
                        
    //                 }
                    
                   
                   

    //                 if(dummy.position.y>=-100){
    //                     opacityAttribute.setX(i, opacityAttribute.getX(i)-0.015);
    //                     if(brokenAttribute.getX(i)<=1.0)
    //                         brokenAttribute.setX(i, brokenAttribute.getX(i)+0.015);
    //                     startTimesAttribute.setX(i, startTimesAttribute.getX(i)-0.008);
    //                     //dummy.rotation.copy(camera.rotation);
    //                     //dummy.rotation.x=timestamp*i*0.0001;
    //                     // dummy.rotation.y+=0.1*(Math.random()-0.5);
    //                     if(info.velocity[i].x<0)
    //                         dummy.rotation.z=timestamp*(i%10)*0.0001;
    //                     else
    //                         dummy.rotation.z=-timestamp*(i%10)*0.0001;
                        
    //                     dummy.scale.x*=1.02;
    //                     dummy.scale.y*=1.02;
    //                     dummy.scale.z*=1.02;
                        
                        
                        
                       
    //                     info.velocity[i].add(acc);
    //                     dummy.position.add(info.velocity[i]);
    //                     dummy.updateMatrix();
    //                     mesh.setMatrixAt(i, dummy.matrix);
    //                 }
                    
    
    //             }
    //             if(jumpSw==1){
    //                 jumpSw=0;
    //             }
    //             mesh.instanceMatrix.needsUpdate = true;
    //             opacityAttribute.needsUpdate = true;
    //             brokenAttribute.needsUpdate = true;
    //             startTimesAttribute.needsUpdate = true;
    
    //         }
    //         group.updateMatrixWorld();
    //         sw=0;
    //     });
    //   }
      
    
    
    //  //###################################################################### splash particle2 ######################################################################
    // {
    //     const particleCount = 250;
    //     const group=new THREE.Group();
    //     let info = {
    //         velocity: [particleCount]
    //     }
    //     let acc = new THREE.Vector3(0, -0.005, 0);
    
    //     //##################################################### get Dust geometry #####################################################
    //     const identityQuaternion = new THREE.Quaternion();
    //     const _getDustGeometry = geometry => {
    //         //console.log(geometry)
    //         const geometry2 = new THREE.BufferGeometry();
    //         ['position', 'normal', 'uv'].forEach(k => {
    //           geometry2.setAttribute(k, geometry.attributes[k]);
    //         });
    //         geometry2.setIndex(geometry.index);
            
    //         const positions = new Float32Array(particleCount * 3);
    //         const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
    //         geometry2.setAttribute('positions', positionsAttribute);
    //         const quaternions = new Float32Array(particleCount * 4);
    //         for (let i = 0; i < particleCount; i++) {
    //           identityQuaternion.toArray(quaternions, i * 4);
    //         }
    //         const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
    //         geometry2.setAttribute('quaternions', quaternionsAttribute);
    
    //         const startTimes = new Float32Array(particleCount);
    //         const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
    //         geometry2.setAttribute('startTimes', startTimesAttribute);
    
    //         const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('opacity', opacityAttribute);
    
    //         const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         brokenAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('broken', brokenAttribute);
        
    //         return geometry2;
    //     };
    
    //     //##################################################### material #####################################################
    //     let dustMaterial= new THREE.MeshBasicMaterial();
    //     dustMaterial.transparent=true; 
    //     dustMaterial.depthWrite=false;
    //     dustMaterial.alphaMap=noiseMap;
    //     dustMaterial.map=splashTexture2;
    //     dustMaterial.blending= THREE.AdditiveBlending;
    //     dustMaterial.side=THREE.DoubleSide;
    //     //dustMaterial.opacity=0.2;
    
    //     const uniforms = {
    //         uTime: {
    //             value: 0
    //         },
    //     }
    //     dustMaterial.onBeforeCompile = shader => {
            
    //         shader.uniforms.uTime = uniforms.uTime;
    //         shader.vertexShader = 'attribute float startTimes;attribute float opacity;attribute float broken;\n varying float vStartTimes;varying float vOpacity; varying float vBroken; varying vec3 vPos; \n ' + shader.vertexShader;
    //         shader.vertexShader = shader.vertexShader.replace(
    //           '#include <begin_vertex>',
    //           ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vPos = position;vStartTimes=startTimes;  '].join('\n')
    //         );
    //         shader.fragmentShader = 'uniform float uTime; varying float vBroken; varying float vStartTimes; varying float vOpacity; varying vec3 vPos;\n' + shader.fragmentShader;
    //         shader.fragmentShader = shader.fragmentShader
    //         .replace(
    //             `vec4 diffuseColor = vec4( diffuse, opacity );`,
    //             `
                
                
    //              vec4 diffuseColor = vec4( vec3(vStartTimes,vStartTimes+0.1,1.0), vOpacity);
    //             `
    //         );
    //         shader.fragmentShader = shader.fragmentShader.replace(
    //             '#include <alphamap_fragment>',
    //             [
    //               'float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( alphaMap, vUv ).g;',
    //               'if ( broken < 0.0001 ) discard;'
    //             ].join('\n')
    //         );
    //     };
        
       
    
        
    
    //     //##################################################### object #####################################################
    //     let mesh = null;
    //     let dummy = new THREE.Object3D();
    
    
    //     function addInstancedMesh() {
    //         const geometry2 = new THREE.PlaneGeometry( .5, .5 );
    //         const geometry = _getDustGeometry(geometry2);
            
    //         mesh = new THREE.InstancedMesh(geometry, dustMaterial, particleCount);
    //         group.add(mesh);
    //         app.add(group);
    //         setInstancedMeshPositions(mesh);
            
    //     }
    //     let matrix = new THREE.Matrix4();
    //     function setInstancedMeshPositions(mesh1) {
    //         for (let i = 0; i < mesh1.count; i++) {
    //             mesh.getMatrixAt(i, matrix);
    //             dummy.scale.x = .00001;
    //             dummy.scale.y = .00001;
    //             dummy.scale.z = .00001;
    //             dummy.position.x = (Math.random()-0.5)*0.2;
    //             dummy.position.y = 0.5*(Math.random());
    //             dummy.position.z = i*0.1;
    //             // dummy.rotation.x=Math.random()*i;
    //             // dummy.rotation.y=Math.random()*i;
    //             // dummy.rotation.z=Math.random()*i;
    //             info.velocity[i] = (new THREE.Vector3(
    //                 0,
    //                 0,
    //                 -0.8-Math.random()));
    //             info.velocity[i].divideScalar(20);
    //             dummy.updateMatrix();
    //             mesh1.setMatrixAt(i, dummy.matrix);
    //         }
    //         mesh1.instanceMatrix.needsUpdate = true;
    //     }
       
    
        
    //     let sw=0;
    //     addInstancedMesh();
    //     let jumpSw=0;
    //     let highSw=0;
    //     useFrame(({timestamp}) => {
    //         if (localPlayer.position.y>2.5){
    //             highSw=1;    
    //         }
    //         else if (localPlayer.position.y<2){
    //             if(highSw===1){
    //                 jumpSw=1;
    //                 highSw=0;
    //             }    
                
    //         }
            
    //         group.position.copy(localPlayer.position);
    //         // group.rotation.copy(localPlayer.rotation);
    //         if (localPlayer.avatar) {
    //           group.position.y -= localPlayer.avatar.height;
    //           group.position.y += 0.2;
    //         }
    //         // localPlayer.getWorldDirection(dum)
    //         // dum = dum.normalize();
    //         // group.position.x+=0.3*dum.x;
    //         // group.position.z+=0.3*dum.z;
    //         group.rotation.copy(camera.rotation);
            
    //         if (mesh) {
    //             const opacityAttribute = mesh.geometry.getAttribute('opacity');
    //             const brokenAttribute = mesh.geometry.getAttribute('broken');
    //             const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
    //             for (let i = 0; i < particleCount; i++) {
    //                 mesh.getMatrixAt(i, matrix);
    //                 matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                    
    //                 //if (/*dummy.position.distanceTo(originPoint)>1.5*/ narutoRunTime>0) {
    //                 if(jumpSw==1){    
                        
    //                     opacityAttribute.setX(i, 1);
    //                     brokenAttribute.setX(i, Math.random()-0.2);
    //                     startTimesAttribute.setX(i, 1);
    //                     //if(particleEmmitCount!==-1 ){
    //                         let rand=Math.random()*1;
    //                         dummy.scale.set(rand,rand,rand)
    //                         // dummy.scale.x = 0.5+Math.random()*0.5;
    //                         // dummy.scale.y = 0.5+Math.random()*0.5;
    //                         // dummy.scale.z = 0.5+Math.random()*0.5;
                            
    //                     // }
    //                     // else{
    //                     //     dummy.scale.x = .00001;
    //                     //     dummy.scale.y = .00001;
    //                     //     dummy.scale.z = .00001;
    //                     //     //opacityAttribute.setX(i, 0.01);
    //                     // }
                        
                        
    //                     dummy.position.x = 0;
    //                     dummy.position.y = -1*(Math.random());
    //                     dummy.position.z = 0.;
                        
    //                     info.velocity[i].x=1*(Math.random()-0.5);
    //                     info.velocity[i].y=2.5+1*(Math.random());
    //                     info.velocity[i].z=1*(Math.random()-0.5);
                        
                            
    //                     info.velocity[i].divideScalar(20);
                        
    //                 }
    //                 if(dummy.position.y>=-100){
    //                     opacityAttribute.setX(i, opacityAttribute.getX(i)-0.015);
    //                     if(brokenAttribute.getX(i)<=1.0)
    //                         brokenAttribute.setX(i, brokenAttribute.getX(i)+0.015);
    //                     startTimesAttribute.setX(i, startTimesAttribute.getX(i)-0.003);
    //                     //dummy.rotation.copy(camera.rotation);
    //                     //dummy.rotation.x=timestamp*i*0.0001;
    //                     // dummy.rotation.y+=0.1*(Math.random()-0.5);
    //                     if(info.velocity[i].x<0)
    //                         dummy.rotation.z=timestamp*(i%10)*0.0001;
    //                     else
    //                         dummy.rotation.z=-timestamp*(i%10)*0.0001;
                        
    //                     dummy.scale.x*=1.02;
    //                     dummy.scale.y*=1.02;
    //                     dummy.scale.z*=1.02;
                        
                        
                        
                       
    //                     info.velocity[i].add(acc);
    //                     dummy.position.add(info.velocity[i]);
    //                     dummy.updateMatrix();
    //                     mesh.setMatrixAt(i, dummy.matrix);
    //                 }
                    
                    
    
    //             }
    //             if(jumpSw==1)
    //                 jumpSw=0;
    //             mesh.instanceMatrix.needsUpdate = true;
    //             opacityAttribute.needsUpdate = true;
    //             brokenAttribute.needsUpdate = true;
    //             startTimesAttribute.needsUpdate = true;
    
    //         }
    //         group.updateMatrixWorld();
            
    //         sw=0;
    //     });
    //   }



    //###################################################################### splash particle ######################################################################
    // {
    //     const particleCount = 6;
    //     const group=new THREE.Group();
    //     let matrix = new THREE.Matrix4();
    //     let dummy = new THREE.Object3D();
    //     let info = {
    //         velocity: [particleCount]
    //     }
    //     let acc = new THREE.Vector3(0, -0.005, 0);
    
    //     //##################################################### get Dust geometry #####################################################
    //     const identityQuaternion = new THREE.Quaternion();
    //     const _getSplashGeometry = geometry => {
    //         //console.log(geometry)
    //         const geometry2 = new THREE.BufferGeometry();
    //         ['position', 'normal', 'uv'].forEach(k => {
    //           geometry2.setAttribute(k, geometry.attributes[k]);
    //         });
    //         geometry2.setIndex(geometry.index);
            
    //         const positions = new Float32Array(particleCount * 3);
    //         const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
    //         geometry2.setAttribute('positions', positionsAttribute);
    //         const quaternions = new Float32Array(particleCount * 4);
    //         for (let i = 0; i < particleCount; i++) {
    //           identityQuaternion.toArray(quaternions, i * 4);
    //         }
    //         const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
    //         geometry2.setAttribute('quaternions', quaternionsAttribute);
    
    //         const startTimes = new Float32Array(particleCount);
    //         const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
    //         geometry2.setAttribute('startTimes', startTimesAttribute);
    
    //         const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('opacity', opacityAttribute);
    
    //         const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         brokenAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('broken', brokenAttribute);

    //         const scales = new Float32Array(particleCount);
    //         const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
    //         geometry2.setAttribute('scales', scaleAttribute);
        
    //         return geometry2;
    //     };
    
    //     //##################################################### material #####################################################
    //     const splashMaterial = new THREE.ShaderMaterial({
    //         uniforms: {
    //             uTime: {
    //                 value: 0,
    //             },
    //             opacity: {
    //                 value: 1,
    //             },
    //             uBroken: {
    //                 value: 0,
    //             },
    //             perlinnoise:{
    //                 value: splashTexture
    //             },
    //             noiseMap:{
    //                 value: noiseMap
    //             }
    //         },
    //         vertexShader: `\
                
    //             ${THREE.ShaderChunk.common}
    //             ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
    //             uniform float uTime;
        
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             attribute vec3 positions;
    //             attribute float scales;
    //             attribute vec4 quaternions;

    //             vec3 qtransform(vec3 v, vec4 q) { 
    //               return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
    //             }
            
    //             void main() {
    //             vUv=uv;
    //             vPos=position;
    //             vec3 pos = position;
    //             pos.xz*=scales;
    //             pos+=positions;
    //             pos = qtransform(pos, quaternions);
    //             //pos.y=cos(uTime/100.);
    //             vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    //             vec4 viewPosition = viewMatrix * modelPosition;
    //             vec4 projectionPosition = projectionMatrix * viewPosition;
        
    //             gl_Position = projectionPosition;
    //             ${THREE.ShaderChunk.logdepthbuf_vertex}
    //             }
    //         `,
    //         fragmentShader: `\
    //             ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    //             uniform float uTime;
    //             uniform float opacity;
    //             uniform float uBroken;
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             uniform sampler2D perlinnoise;
    //             uniform sampler2D noiseMap;
                
                
                
                
                
    //             void main() {
    //                 // vec3 ripple2 = texture2D(
    //                 //     perlinnoise,
    //                 //     mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
    //                 // ).rgb; 

    //                 vec3 noise = texture2D(
    //                     noiseMap,
    //                     mod(1.*vec2(5.*vUv.x,5.*vUv.y-uTime*1. ),1.)
    //                 ).rgb;
    //                 vec4 ripple = texture2D(
    //                     perlinnoise,
    //                     vUv
    //                 );


    //                 gl_FragColor = ripple;
    //                 if(gl_FragColor.r<0.9){
    //                     discard;
    //                 }
    //                 else{

    //                 }
    //                 float broken = abs( sin( 1.0 - mod(uTime,1.0) ) ) - noise.r;
    //                 //float broken = abs( sin( 1.0 - mod(uTime,1.0) ) ) - texture2D( noiseMap, vUv ).g;
    //                 if ( broken < 0.0001 ) discard;



                    
    //                 // if(gl_FragColor.r >= 0.65){
    //                 //    gl_FragColor =  vec4(1.,1.,1.,1.);
    //                 // }else{
    //                 //     gl_FragColor = vec4(0.,0.,1.,0.);
    //                 // }
    //                 // float broken = abs( sin( pow(1.0 - vUv.y,1.) ) ) - noise.g;
    //                 // if ( broken < 0.0001 ) discard;
    //                 // gl_FragColor.a*=opacity;
    //                 // if(uTime>0.5)
    //                 //     gl_FragColor.a=0.;
                    
    //                 //gl_FragColor=vec4(1.0,1.0,0.,1.0);
    //             ${THREE.ShaderChunk.logdepthbuf_fragment}
    //             }
    //         `,
    //         side: THREE.DoubleSide,
    //         transparent: true,
    //         depthWrite: false,
    //         blending: THREE.AdditiveBlending,
            
    //     });
        
       
    
        
    
    //     //##################################################### object #####################################################
    //     let mesh=null;
    //     const addInstancedMesh=()=>{
    //         const geometry2 = new THREE.PlaneGeometry( 3, 3 );
    //         const geometry =_getSplashGeometry(geometry2)
    //         mesh = new THREE.InstancedMesh(
    //             geometry,
    //             splashMaterial,
    //             particleCount
    //         );
    //         group.add(mesh);
    //         app.add(group);
    //         const positionsAttribute = mesh.geometry.getAttribute('positions');
    //         const scalesAttribute = mesh.geometry.getAttribute('scales');
    //         const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
    //         for (let i = 0; i < particleCount; i++) {
    //             mesh.getMatrixAt(i, matrix);
    //             matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                
                
    //             let angle = i / (particleCount-1) * Math.PI;
    //             positionsAttribute.setXYZ(i,.1* Math.sin(angle), 0, .1* Math.cos(angle));
                
    //             // let randScale = 0.7+0.5*(Math.random());
    //             scalesAttribute.setX(i, 1);
                
    //             let quaternion = new THREE.Quaternion();
    //             quaternion.setFromAxisAngle(new THREE.Vector3((Math.random()-0.5)*0.25,1,(Math.random()-0.5)*0.25),angle);
                
    //             quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
                
    //             dummy.updateMatrix();
    //             mesh.setMatrixAt(i, dummy.matrix);
    //         }
    //         mesh.instanceMatrix.needsUpdate = true;
    //         positionsAttribute.needsUpdate = true;
    //         scalesAttribute.needsUpdate = true;
    //         quaternionsAttribute.needsUpdate = true;
    //     }
    //     addInstancedMesh();
    //     app.updateMatrixWorld();
       
    //     let jumpSw=0;
    //     let highSw=0;
    //     useFrame(({timestamp}) => {
    //         if (localPlayer.position.y>2.5){
    //             highSw=1;    
    //         }
    //         else if (localPlayer.position.y<2){
    //             if(highSw===1){
    //                 jumpSw=1;
    //                 highSw=0;
    //             }    
                
    //         }
            
    //         // group.position.copy(localPlayer.position);
    //         // // group.rotation.copy(localPlayer.rotation);
    //         // if (localPlayer.avatar) {
    //         //   group.position.y -= localPlayer.avatar.height;
    //         //   group.position.y += 0.5;
    //         // }
    //         group.position.y = 1.5;
    //         // localPlayer.getWorldDirection(dum)
    //         // dum = dum.normalize();
    //         // group.position.x+=0.3*dum.x;
    //         // group.position.z+=0.3*dum.z;
    //         //group.rotation.copy(camera.rotation);
            
    //         if (mesh) {
    //             // const opacityAttribute = mesh.geometry.getAttribute('opacity');
    //             // const brokenAttribute = mesh.geometry.getAttribute('broken');
    //             // const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
    //             for (let i = 0; i < particleCount; i++) {
    //                 mesh.getMatrixAt(i, matrix);
    //                 matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                    
                    
                    

    //                 if(dummy.position.y>=-100){
    //                     // opacityAttribute.setX(i, opacityAttribute.getX(i)-0.015);
    //                     // if(brokenAttribute.getX(i)<=1.0)
    //                     //     brokenAttribute.setX(i, brokenAttribute.getX(i)+0.015);
    //                     // startTimesAttribute.setX(i, startTimesAttribute.getX(i)-0.008);
    //                     // //dummy.rotation.copy(camera.rotation);
    //                     // //dummy.rotation.x=timestamp*i*0.0001;
    //                     // // dummy.rotation.y+=0.1*(Math.random()-0.5);
    //                     // if(info.velocity[i].x<0)
    //                     //     dummy.rotation.z=timestamp*(i%10)*0.0001;
    //                     // else
    //                     //     dummy.rotation.z=-timestamp*(i%10)*0.0001;
                        
    //                     // dummy.scale.x*=1.02;
    //                     // dummy.scale.y*=1.02;
    //                     // dummy.scale.z*=1.02;
                        
                        
                        
                       
    //                     // info.velocity[i].add(acc);
    //                     // dummy.position.add(info.velocity[i]);
    //                     // dummy.updateMatrix();
    //                     // mesh.setMatrixAt(i, dummy.matrix);
    //                 }
                    
    
    //             }
    //             if(jumpSw==1){
    //                 jumpSw=0;
    //             }
    //             mesh.instanceMatrix.needsUpdate = true;
    //             // opacityAttribute.needsUpdate = true;
    //             // brokenAttribute.needsUpdate = true;
    //             // startTimesAttribute.needsUpdate = true;
    //             mesh.material.uniforms.uTime.value=timestamp/1000;
    
    //         }
    //         group.updateMatrixWorld();
    //     });
    //   }

    // //###################################################################### ripple2 ######################################################################
    // {
    //     let ripple;
    //     let group = new THREE.Group();
    //     let sw=0;
    //     (async () => {
    //         const u = `${baseUrl}/assets/torus3.glb`;
    //         ripple = await new Promise((accept, reject) => {
    //             const {gltfLoader} = useLoaders();
    //             gltfLoader.load(u, accept, function onprogress() {}, reject);

    //         });
    //         //ripple.scene.position.y=-5000;


    //         group.add(ripple.scene);
    //         app.add(group);

    //         ripple.scene.children[0].material= new THREE.ShaderMaterial({
    //             uniforms: {
    //                 uTime: {
    //                     value: 0,
    //                 },
    //                 opacity: {
    //                     value: 0,
    //                 },
    //                 avatarPos:{
    //                     value: new THREE.Vector3(0,0,0)
    //                 },
    //                 iResolution: { value: new THREE.Vector3() },
    //                 perlinnoise:{
    //                     value: wave2
    //                 }
    //             },
    //             vertexShader: `\
                    
    //                 ${THREE.ShaderChunk.common}
    //                 ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
                
                
    //                 uniform float uTime;
            
    //                 varying vec2 vUv;
    //                 varying vec3 vPos;
                
    //                 void main() {
    //                 vUv=uv.yx;
    //                 vPos=position;
    //                 vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    //                 vec4 viewPosition = viewMatrix * modelPosition;
    //                 vec4 projectionPosition = projectionMatrix * viewPosition;
            
    //                 gl_Position = projectionPosition;
    //                 ${THREE.ShaderChunk.logdepthbuf_vertex}
    //                 }
    //             `,
    //             fragmentShader: `\
    //                 ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    //                 uniform float uTime;
    //                 uniform float opacity;
    //                 varying vec2 vUv;
    //                 varying vec3 vPos;
    //                 uniform sampler2D perlinnoise;
                    
                    
                    
                    
    //                 void main() {
    //                     vec3 noisetex = texture2D(
    //                         perlinnoise,
    //                         // vec2(
    //                         //     1.*vUv.x-mod(uTime*1.,1.),
    //                         //     vUv.y*0.1
    //                         // )
    //                         mod(1.*vec2(1.*vUv.x-uTime*2.,1.*vUv.y ),1.)
    //                     ).rgb; 
            
    //                     gl_FragColor = vec4(noisetex.rgb,1.0);
                        
    //                     if(gl_FragColor.r >= 0.75){
    //                        gl_FragColor =  vec4(1.,1.,1.,0.8);
    //                     }else{
    //                         gl_FragColor = vec4(0.,0.,1.,0.);
    //                     }
    //                     gl_FragColor.a*=opacity;
    //                     //gl_FragColor *= vec4(sin(vUv.x) - 0.01);
    //                     //gl_FragColor *= vec4(smoothstep(0.01,0.928,vUv.x));
    //                     // gl_FragColor.xyz /=4.;
    //                     // gl_FragColor.b*=2.;
    //                     // gl_FragColor.a*=20.;
    //                     // if(gl_FragColor.r >= 0.5){
    //                     //     //gl_FragColor = vec4(color,(0.9-vUv.y)/3.);
    //                     // }else{
    //                     //     gl_FragColor = vec4(0.,0.,1.,0.);
    //                     // }
    //                     // gl_FragColor=vec4(1.0,0.,0.,1.0);
                        
    //                 ${THREE.ShaderChunk.logdepthbuf_fragment}
    //                 }
    //             `,
    //             //side: THREE.DoubleSide,
    //             transparent: true,
    //             depthWrite: false,
    //             blending: THREE.AdditiveBlending,
    //         });
    //         sw=1;

    //     })();
    //     app.updateMatrixWorld();
    //     let ioSw=0;
    //     let jumpSw=0;
    //     let highSw=0;
    //     useFrame(({timestamp}) => {
    //         if (localPlayer.position.y>2.5){
    //             highSw=1; 
    //             //console.log('high')   
    //         }
    //         else if (localPlayer.position.y<2){
    //             if(highSw===1){
    //                 //console.log('jump')
    //                 jumpSw=1;
    //                 highSw=0;
    //             }    

    //         }

    //         if(sw==1){
    //             ripple.scene.children[0].material.uniforms.uTime.value = timestamp /10000;
    //             if(jumpSw==1){
    //                 group.position.copy(localPlayer.position);
    //                 ripple.scene.children[0].material.uniforms.opacity.value = 0.8;
    //                 ripple.scene.scale.set(0.2,0.2,0.2);
    //                 jumpSw=0;
    //             }
    //             ripple.scene.children[0].material.uniforms.opacity.value-=0.009;
    //             ripple.scene.scale.x+=0.01;
    //             ripple.scene.scale.z+=0.01;

    //         }
            
    //         // if (localPlayer.avatar) {
    //         //     group.position.y -= localPlayer.avatar.height;
    //         //     group.position.y += 0.65;
    //         // }
    //         group.position.y=waterHeight-0.1;
    //         app.updateMatrixWorld();
    //     });
    // }

    // //###################################################################### ripple follow player ######################################################################
    // {
    //     const particleCount = 30;
    //     const dropletRipplegroup=new THREE.Group();
    
    //     //##################################################### get ripple geometry #####################################################
    //     const identityQuaternion = new THREE.Quaternion();
    //     const _getRippleGeometry = geometry => {
    //         const geometry2 = new THREE.BufferGeometry();
    //         ['position', 'normal', 'uv'].forEach(k => {
    //           geometry2.setAttribute(k, geometry.attributes[k]);
    //         });
    //         geometry2.setIndex(geometry.index);
            
    //         const positions = new Float32Array(particleCount * 3);
    //         const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
    //         geometry2.setAttribute('positions', positionsAttribute);
    //         const quaternions = new Float32Array(particleCount * 4);
    //         for (let i = 0; i < particleCount; i++) {
    //           identityQuaternion.toArray(quaternions, i * 4);
    //         }
    //         const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
    //         geometry2.setAttribute('quaternions', quaternionsAttribute);
    
    //         const waveFreq = new Float32Array(particleCount);
    //         const waveFreqAttribute = new THREE.InstancedBufferAttribute(waveFreq, 1);
    //         geometry2.setAttribute('waveFreq', waveFreqAttribute);
    
    //         const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('opacity', opacityAttribute);
    
    //         const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         brokenAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('broken', brokenAttribute);

    //         const scales = new Float32Array(particleCount);
    //         const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
    //         geometry2.setAttribute('scales', scaleAttribute);

    //         const playerRotation = new Float32Array(particleCount);
    //         const playerRotAttribute = new THREE.InstancedBufferAttribute(playerRotation, 1);
    //         geometry2.setAttribute('playerRotation', playerRotAttribute);

    //         const speed = new Float32Array(particleCount);
    //         const speedAttribute = new THREE.InstancedBufferAttribute(speed, 1);
    //         geometry2.setAttribute('speed', speedAttribute);
        
    //         return geometry2;
    //     };
    
    //     //##################################################### material #####################################################
    //     const splashMaterial = new THREE.ShaderMaterial({
    //         uniforms: {
    //             uTime: {
    //                 value: 0,
    //             },
    //             noiseMap:{
    //                 value: noiseMap
    //             }
    //         },
    //         vertexShader: `\
                
    //             ${THREE.ShaderChunk.common}
    //             ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
    //             uniform float uTime;
        
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             varying float vBroken;
    //             varying float vOpacity;
    //             varying float vWaveFreq;
    //             varying float vSpeed;
    //             attribute vec3 positions;
    //             attribute float scales;
    //             attribute float opacity;
    //             attribute float waveFreq;
    //             attribute vec4 quaternions;
    //             attribute float broken;
    //             attribute float speed;
    //             attribute float playerRotation;
    //             vec3 qtransform(vec3 v, vec4 q) { 
    //               return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
    //             }
            
    //             void main() {

    //                 mat3 rotY =
    //                     mat3(cos(playerRotation), 0.0, -sin(playerRotation), 0.0, 1.0, 0.0, sin(playerRotation), 0.0, cos(playerRotation));
    //                 mat3 rotX =
    //                     mat3(1.0, 0.0, 0.0, 0.0, cos(PI/2.), sin(PI/2.), 0.0, -sin(PI/2.), cos(PI/2.));
                    
    //                 mat3 rotZ = mat3(
    //                     cos(-PI/2.), sin(-PI/2.), 0.0,
    //                     -sin(-PI/2.), cos(-PI/2.), 0.0, 
    //                     0.0, 0.0 , 1.0
    //                 );

    //             vOpacity=opacity;
    //             vBroken=broken;
    //             vWaveFreq=waveFreq;
    //             vSpeed=speed;
    //             vUv=uv;
    //             vPos=position;
    //             vec3 pos = position;
    //             pos = qtransform(pos, quaternions);
    //             pos*=rotY;
    //             pos*=scales;
    //             pos+=positions;
    //             //pos*=rotX;
                
                
                
    //             vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    //             vec4 viewPosition = viewMatrix * modelPosition;
    //             vec4 projectionPosition = projectionMatrix * viewPosition;
        
    //             gl_Position = projectionPosition;
    //             ${THREE.ShaderChunk.logdepthbuf_vertex}
    //             }
    //         `,
    //         fragmentShader: `\
    //             ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    //             uniform float uTime;
    //             varying float vWaveFreq;
    //             varying float vBroken;
    //             varying float vOpacity;
    //             varying float vSpeed;
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             uniform sampler2D noiseMap;
    //             #define PI 3.1415926

                
    //             void main() {
                    
                                  
    //                 vec2 wavedUv = vec2(
    //                     vUv.x,
    //                     vUv.y + sin(vUv.x * (vWaveFreq+1.) * cos(uTime)) * 0.05
    //                 );
    //                 vec3 noise = texture2D(
    //                                         noiseMap,
    //                                         vec2(
    //                                             vUv.x,
    //                                             vUv.y + sin(vUv.x * (vWaveFreq+1.) * cos(uTime)) * 0.05
    //                                         )
    //                                     ).rgb;
    //                 float strength = 1.0 - step(0.01, abs(distance(wavedUv, vec2(0.5)) - 0.25));
    //                 if(vSpeed>0.1){
    //                     if(vUv.y<0.35){
    //                         strength = 0.;
    //                     }
    //                 }
                    
    //                 gl_FragColor = vec4(vec3(strength), 1.0);
    //                 gl_FragColor.a*=vOpacity;
                    
    //                 float broken = abs( sin( 1.0 - vBroken ) ) - noise.g;
    //                 //float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
    //                 if ( broken < 0.0001 ) discard;
    //             ${THREE.ShaderChunk.logdepthbuf_fragment}
    //             }
    //         `,
    //         side: THREE.DoubleSide,
    //         transparent: true,
    //         depthWrite: false,
    //         blending: THREE.AdditiveBlending,
            
    //     });
        
       
    
        
    
    //     //##################################################### object #####################################################
    //     let rippleMesh=null;
    //     let quaternion = new THREE.Quaternion();
        
    //     const addInstancedMesh2=()=>{
    //         const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
    //         const geometry =_getRippleGeometry(geometry2)
    //         rippleMesh = new THREE.InstancedMesh(
    //             geometry,
    //             splashMaterial,
    //             particleCount
    //         );
    //         dropletRipplegroup.add(rippleMesh);
    //         app.add(dropletRipplegroup);
            
    //         const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
    //         for (let i = 0; i < particleCount; i++) {
    //             quaternion.setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);
    //             quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
    //         }
    //         quaternionsAttribute.needsUpdate = true;
    //     }
    //     addInstancedMesh2();
    //     app.updateMatrixWorld();
       
    //     let jumpSw=0;
    //     let highSw=0;
    //     let currentIndex=0;
    //     let lastEmmitTime=0;
    //     let localVector = new THREE.Vector3();
    //     useFrame(({timestamp}) => {
    //         if (localPlayer.position.y>2.5){
    //             highSw=1;    
    //         }
    //         else if (localPlayer.position.y<2){
    //             if(highSw===1){
    //                 jumpSw=1;
    //                 highSw=0;
    //             }    
                
    //         }
    //         if(currentIndex>=particleCount){
    //             currentIndex=0;
    //         }
    //         let currentSpeed;
    //         if(localPlayer.avatar){
    //             currentSpeed = localVector.set(localPlayer.avatar.velocity.x, 0, localPlayer.avatar.velocity.z).length();
    //         }
    //         //console.log(currentSpeed)
            
            
            
    //         if (rippleMesh) {
    //             const opacityAttribute = rippleMesh.geometry.getAttribute('opacity');
    //             const brokenAttribute = rippleMesh.geometry.getAttribute('broken');
    //             const waveFreqAttribute = rippleMesh.geometry.getAttribute('waveFreq');
    //             const positionsAttribute = rippleMesh.geometry.getAttribute('positions');
    //             const scalesAttribute = rippleMesh.geometry.getAttribute('scales');
    //             const quaternionsAttribute = rippleMesh.geometry.getAttribute('quaternions');
    //             const speedAttribute = rippleMesh.geometry.getAttribute('speed');
    //             const playerRotationAttribute = rippleMesh.geometry.getAttribute('playerRotation');
    //             for (let i = 0; i < particleCount; i++) {
                    
    //                 // if(jumpSw===1){
    //                     //positionsAttribute.setXYZ(i,1.*Math.cos(i* Math.random()), 1.*Math.sin(i* Math.random()),0);
    //                 //     scalesAttribute.setX(i,Math.random()*0.2);
    //                 //     opacityAttribute.setX(i,0.5+0.3*Math.random());
    //                 //     waveFreqAttribute.setX(i, Math.random()*(i%10));
    //                 //     brokenAttribute.setX(i, Math.random()-0.8);
    //                 // }
                    
                    
    //                 opacityAttribute.setX(i,opacityAttribute.getX(i)-0.013);
    //                 scalesAttribute.setX(i,scalesAttribute.getX(i)+0.05);
    //                 if(brokenAttribute.getX(i)<1)
    //                     brokenAttribute.setX(i, brokenAttribute.getX(i)+0.008);
                    
    
    //             }
    //             if(timestamp - lastEmmitTime > 100  && currentSpeed>0.005){

                    
                   
                    
    //                 if(localPlayer.rotation.x!==0){
    //                     playerRotationAttribute.setX(currentIndex,Math.PI+localPlayer.rotation.y);
    //                 }
    //                 else{
    //                     playerRotationAttribute.setX(currentIndex,-localPlayer.rotation.y);
    //                 }
    //                 waveFreqAttribute.setX(currentIndex, Math.random()*(currentIndex%10));
    //                 speedAttribute.setX(currentIndex,currentSpeed);
    //                 brokenAttribute.setX(currentIndex,0.2*Math.random());
    //                 scalesAttribute.setX(currentIndex,1.+Math.random()*0.5);
    //                 opacityAttribute.setX(currentIndex,0.5+0.3*Math.random());
    //                 positionsAttribute.setXYZ(currentIndex,localPlayer.position.x, 0, localPlayer.position.z);
    //                 currentIndex++;
    //                 lastEmmitTime=timestamp;
    //             }
                
                
    //             // if(jumpSw==1){
    //             //     dropletRipplegroup.position.copy(localPlayer.position);
    //             //     jumpSw=0;
    //             // }
                
                
    //             dropletRipplegroup.position.y = waterHeight;
    //             positionsAttribute.needsUpdate = true;
    //             opacityAttribute.needsUpdate = true;
    //             scalesAttribute.needsUpdate = true;
    //             speedAttribute.needsUpdate = true;
    //             brokenAttribute.needsUpdate = true;
    //             waveFreqAttribute.needsUpdate = true;
    //             quaternionsAttribute.needsUpdate = true;
    //             playerRotationAttribute.needsUpdate = true;
    //             rippleMesh.material.uniforms.uTime.value=timestamp/1000;
    
    //         }
    //         app.updateMatrixWorld();
            
    //     });
    //   }

    //       //################################################################## splash1 follow player ###################################################################
// {
//     const particleCount = 20;
//     const group=new THREE.Group();
//     let info = {
//         velocity: [particleCount]
//     }
//     let acc = new THREE.Vector3(-0.000, -0.0001, 0.000);

//     //##################################################### get Dust geometry #####################################################
//     const identityQuaternion = new THREE.Quaternion();
//     const _getDustGeometry = geometry => {
//         //console.log(geometry)
//         const geometry2 = new THREE.BufferGeometry();
//         ['position', 'normal', 'uv'].forEach(k => {
//           geometry2.setAttribute(k, geometry.attributes[k]);
//         });
//         geometry2.setIndex(geometry.index);
        
//         // const positions = new Float32Array(particleCount * 3);
//         // const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
//         // geometry2.setAttribute('positions', positionsAttribute);
//         const quaternions = new Float32Array(particleCount * 4);
//         for (let i = 0; i < particleCount; i++) {
//           identityQuaternion.toArray(quaternions, i * 4);
//         }
//         const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
//         geometry2.setAttribute('quaternions', quaternionsAttribute);

//         const startTimes = new Float32Array(particleCount);
//         const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
//         geometry2.setAttribute('startTimes', startTimesAttribute);

//         const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
//         opacityAttribute.setUsage(THREE.DynamicDrawUsage);
//         geometry2.setAttribute('opacity', opacityAttribute);

//         const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
//         brokenAttribute.setUsage(THREE.DynamicDrawUsage);
//         geometry2.setAttribute('broken', brokenAttribute);
    
//         return geometry2;
//     };

//     //##################################################### material #####################################################
//     let dustMaterial= new THREE.MeshBasicMaterial();
//     dustMaterial.transparent=true; 
//     dustMaterial.depthWrite=false;
//     dustMaterial.alphaMap=noiseMap;
//     dustMaterial.blending= THREE.AdditiveBlending;
//     //dustMaterial.side=THREE.DoubleSide;
//     //dustMaterial.opacity=0.2;

//     const uniforms = {
//         uTime: {
//             value: 0
//         },
//     }
//     dustMaterial.onBeforeCompile = shader => {
//         shader.uniforms.uTime = uniforms.uTime;
//         shader.vertexShader = 'attribute float opacity;attribute float broken;\n varying float vOpacity; varying float vBroken; varying vec3 vPos; \n ' + shader.vertexShader;
//         shader.vertexShader = shader.vertexShader.replace(
//           '#include <begin_vertex>',
//           ['vec3 transformed = vec3( position );', 'vOpacity = opacity; vBroken = broken; vPos = position;'].join('\n')
//         );
//         shader.fragmentShader = 'uniform float uTime; varying float vBroken; varying float vOpacity; varying vec3 vPos;\n' + shader.fragmentShader;
//         shader.fragmentShader = shader.fragmentShader
//         .replace(
//             `vec4 diffuseColor = vec4( diffuse, opacity );`,
//             `
//               vec4 diffuseColor = vec4( diffuse, vOpacity);
  
//             `
//         );
//         shader.fragmentShader = shader.fragmentShader.replace(
//             '#include <alphamap_fragment>',
//             [
//               'vec3 noise = texture2D(alphaMap,mod(1.*vec2(5.*vUv.x,5.*vUv.y-uTime*1. ),1.)).rgb;',
//               'float broken = abs( sin( 1.0 - vBroken ) ) - noise.g;',
//               'if ( broken < 0.0001 ) discard;'
//             ].join('\n')
//         );
//     };
    
//     //##################################################### load glb #####################################################
//     //let dustGeometry;
//     let dustApp;
//     (async () => {
//         const u = `${baseUrl}/assets/smoke.glb`;
//         dustApp = await new Promise((accept, reject) => {
//             const {gltfLoader} = useLoaders();
//             gltfLoader.load(u, accept, function onprogress() {}, reject);
            
//         });
//         dustApp.scene.traverse(o => {
//           if (o.isMesh) {
//             addInstancedMesh(o.geometry);
//           }
//         });
        

//     })();

    

//     //##################################################### object #####################################################
//     let mesh = null;
//     let dummy = new THREE.Object3D();


//     function addInstancedMesh(dustGeometry) {
//         const geometry = _getDustGeometry(dustGeometry);
//         mesh = new THREE.InstancedMesh(geometry, dustMaterial, particleCount);
//         group.add(mesh);
//         app.add(group);
//         setInstancedMeshPositions(mesh);
        
//     }
//     let matrix = new THREE.Matrix4();
//     function setInstancedMeshPositions(mesh1) {
//         for (let i = 0; i < mesh1.count; i++) {
//             mesh.getMatrixAt(i, matrix);
//             dummy.scale.x = .00001;
//             dummy.scale.y = .00001;
//             dummy.scale.z = .00001;
//             dummy.position.x = (Math.random()-0.5)*0.2;
//             dummy.position.y = -0.2;
//             dummy.position.z = i*0.1;
//             dummy.rotation.x=Math.random()*i;
//             dummy.rotation.y=Math.random()*i;
//             dummy.rotation.z=Math.random()*i;
//             info.velocity[i] = (new THREE.Vector3(
//                 0,
//                 0,
//                 -0.8-Math.random()));
//             info.velocity[i].divideScalar(20);
//             dummy.updateMatrix();
//             mesh1.setMatrixAt(i, dummy.matrix);
//         }
//         mesh1.instanceMatrix.needsUpdate = true;
//     }
   

    
//     let jumpSw=0;
//     let highSw=0;
//     let localVector = new THREE.Vector3();
//     useFrame(({timestamp}) => {
//         if (localPlayer.position.y>2.5){
//             highSw=1;    
//         }
//         else if (localPlayer.position.y<2){
//             if(highSw===1){
//                 jumpSw=1;
//                 highSw=0;
//             }    
            
//         }
//         let currentSpeed;
//         if(localPlayer.avatar){
//             currentSpeed = localVector.set(localPlayer.avatar.velocity.x, 0, localPlayer.avatar.velocity.z).length();
//         }

//         group.position.copy(localPlayer.position);
//         group.rotation.copy(localPlayer.rotation);
//         //}
//         group.position.x += 0.15*currentDir.x;
//         group.position.z += 0.15*currentDir.z;
//         group.position.y = waterHeight;
        
    
        
//         if (mesh) {
//             const opacityAttribute = mesh.geometry.getAttribute('opacity');
//             const brokenAttribute = mesh.geometry.getAttribute('broken');
//             //const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
//             for (let i = 0; i < particleCount; i++) {
//                 mesh.getMatrixAt(i, matrix);
//                 matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                
//                 if (currentSpeed>0.2 && opacityAttribute.getX(i)<=0) {
                    
                    
//                     opacityAttribute.setX(i, Math.random());
//                     brokenAttribute.setX(i, 0.3+Math.random()*0.3);
                    
//                     dummy.scale.x = (0.02+Math.random()*0.0125);
//                     dummy.scale.y = (0.02+Math.random()*0.0125);
//                     dummy.scale.z = (0.02+Math.random()*0.0125);
                    
                    
//                     if(i%2===0)
//                         dummy.position.x = 0.125;
//                     else
//                         dummy.position.x = -0.125;
//                     dummy.position.y = 0;
//                     dummy.position.z = (Math.random()-0.5)*0.1;
                    
//                     info.velocity[i].x=0;
//                     info.velocity[i].y=0;
//                     info.velocity[i].z=0.2+Math.random();
                    
                        
//                     info.velocity[i].divideScalar(20);
                    
//                 }
                
//                 // opacityAttribute.setX(i, opacityAttribute.getX(i)-0.04);
                
                    
//                 // dummy.rotation.x+=0.1*(Math.random()-0.5);
//                 // dummy.rotation.y+=0.1*(Math.random()-0.5);
//                 // dummy.rotation.z+=0.1*(Math.random()-0.5);
//                 //if(dummy.scale.x<0.15){
//                     dummy.scale.x+=0.01;
//                     dummy.scale.y+=0.01;
//                     dummy.scale.z+=0.01;
//                 //}
//                 //else{
//                     if(brokenAttribute.getX(i)<1){
//                         brokenAttribute.setX(i, brokenAttribute.getX(i)+0.02);
//                         opacityAttribute.setX(i, opacityAttribute.getX(i)-0.0025);
//                         //dummy.position.y+=0.02
//                     }
//                     else{
//                         opacityAttribute.setX(i, 0);
//                         if(i==particleCount-1){
//                             secondSplashSw=1;
//                         }
//                     }
                        
//                 //}
                
                
                
                
//                 //acc.x=0.005*(Math.random()-0.5);
//                 //if(dummy.position.distanceTo(originPoint)>2.5 )
//                 info.velocity[i].add(acc);
//                 dummy.position.add(info.velocity[i]);
//                 dummy.updateMatrix();
//                 mesh.setMatrixAt(i, dummy.matrix);

//             }
//             //if (jumpSw===1){
//                 //jumpSw=0;
            
//             mesh.instanceMatrix.needsUpdate = true;
//             opacityAttribute.needsUpdate = true;
//             brokenAttribute.needsUpdate = true;
//             //startTimesAttribute.needsUpdate = true;

//         }
//         group.updateMatrixWorld();
        
//     });
//   }

// //###################################################################### right hand splash follow player ######################################################################
    // {
    //     const particleCount = 50;
    //     const group=new THREE.Group();
    //     const splashGroup=new THREE.Group();
    //     let matrix = new THREE.Matrix4();
    //     let dummy = new THREE.Object3D();
    //     let info = {
    //         velocity: [particleCount]
    //     }
    //     let acc = new THREE.Vector3(0, -0.002, 0);
    
    //     //##################################################### get geometry #####################################################
    //     const identityQuaternion = new THREE.Quaternion();
    //     const _getSplashGeometry = geometry => {
    //         //console.log(geometry)
    //         const geometry2 = new THREE.BufferGeometry();
    //         ['position', 'normal', 'uv'].forEach(k => {
    //           geometry2.setAttribute(k, geometry.attributes[k]);
    //         });
    //         geometry2.setIndex(geometry.index);
            
    //         const positions = new Float32Array(particleCount * 3);
    //         const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
    //         geometry2.setAttribute('positions', positionsAttribute);
    //         const quaternions = new Float32Array(particleCount * 4);
    //         for (let i = 0; i < particleCount; i++) {
    //           identityQuaternion.toArray(quaternions, i * 4);
    //         }
    //         const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
    //         geometry2.setAttribute('quaternions', quaternionsAttribute);
    
    //         const startTimes = new Float32Array(particleCount);
    //         const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
    //         geometry2.setAttribute('startTimes', startTimesAttribute);
    
    //         const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('opacity', opacityAttribute);
    
    //         const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         brokenAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('broken', brokenAttribute);

    //         const scales = new Float32Array(particleCount);
    //         const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
    //         geometry2.setAttribute('scales', scaleAttribute);
        
    //         return geometry2;
    //     };
    
    //     //##################################################### material #####################################################
    //     const splashMaterial = new THREE.ShaderMaterial({
    //         uniforms: {
    //             uTime: {
    //                 value: 0,
    //             },
    //             perlinnoise:{
    //                 value: splashTexture
    //             },
    //             noiseMap:{
    //                 value: noiseMap
    //             }
    //         },
    //         vertexShader: `\
                
    //             ${THREE.ShaderChunk.common}
    //             ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
    //             uniform float uTime;
        
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             varying float vBroken;
    //             varying float vOpacity;
    //             attribute vec3 positions;
    //             attribute float scales;
    //             attribute vec4 quaternions;
    //             attribute float broken;
    //             attribute float opacity;
    //             vec3 qtransform(vec3 v, vec4 q) { 
    //               return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
    //             }
            
    //             void main() {
    //             vBroken=broken;
    //             vOpacity=opacity;
    //             vUv=uv;
    //             vPos=position;
    //             vec3 pos = position;
    //             pos*=scales;
    //             pos+=positions;
    //             //pos = qtransform(pos, quaternions);
    //             //pos.y=cos(uTime/100.);
    //             vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    //             vec4 viewPosition = viewMatrix * modelPosition;
    //             vec4 projectionPosition = projectionMatrix * viewPosition;
        
    //             gl_Position = projectionPosition;
    //             ${THREE.ShaderChunk.logdepthbuf_vertex}
    //             }
    //         `,
    //         fragmentShader: `\
    //             ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    //             uniform float uTime;
    //             varying float vBroken;
    //             varying float vOpacity;
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             uniform sampler2D perlinnoise;
    //             uniform sampler2D noiseMap;
                
                
                
                
                
    //             void main() {
    //                 // vec3 ripple2 = texture2D(
    //                 //     perlinnoise,
    //                 //     mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
    //                 // ).rgb; 

    //                 vec3 noise = texture2D(
    //                     noiseMap,
    //                     mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
    //                 ).rgb;
    //                 vec4 ripple = texture2D(
    //                     perlinnoise,
    //                     vUv
    //                 );


    //                 gl_FragColor = ripple;
    //                 if(gl_FragColor.r<0.1){
    //                     discard;
    //                 }
    //                 else{
    //                     gl_FragColor=vec4(1.0,1.0,1.0,1.0);
    //                 }
    //                 //float broken = abs( sin( 1.0 - mod(uTime,1.0) ) ) - noise.r;
    //                 float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
    //                 if ( broken < 0.0001 ) discard;

    //                 gl_FragColor.a*=vOpacity;

                    
    //                 // if(gl_FragColor.r >= 0.65){
    //                 //    gl_FragColor =  vec4(1.,1.,1.,1.);
    //                 // }else{
    //                 //     gl_FragColor = vec4(0.,0.,1.,0.);
    //                 // }
    //                 // float broken = abs( sin( pow(1.0 - vUv.y,1.) ) ) - noise.g;
    //                 // if ( broken < 0.0001 ) discard;
    //                 // gl_FragColor.a*=opacity;
    //                 // if(uTime>0.5)
    //                 //     gl_FragColor.a=0.;
                    
    //                 //gl_FragColor=vec4(1.0,1.0,1.0,1.0);
    //             ${THREE.ShaderChunk.logdepthbuf_fragment}
    //             }
    //         `,
    //         side: THREE.DoubleSide,
    //         transparent: true,
    //         depthWrite: false,
    //         //blending: THREE.AdditiveBlending,
            
    //     });
        
       
    
        
    
    //     //##################################################### object #####################################################
    //     let mesh=null;
    //     const addInstancedMesh=()=>{
    //         const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
    //         const geometry =_getSplashGeometry(geometry2)
    //         mesh = new THREE.InstancedMesh(
    //             geometry,
    //             splashMaterial,
    //             particleCount
    //         );
    //         group.add(mesh);
    //         splashGroup.add(group)
    //         app.add(splashGroup);
    //         const positionsAttribute = mesh.geometry.getAttribute('positions');
    //         const scalesAttribute = mesh.geometry.getAttribute('scales');
    //         const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
    //         for (let i = 0; i < particleCount; i++) {
    //             mesh.getMatrixAt(i, matrix);
    //             matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                
                
    //             // let angle = i / (particleCount-1) * Math.PI;
    //             // positionsAttribute.setXYZ(i,.1* Math.sin(angle), 0, .1* Math.cos(angle));
                
    //             // let randScale = 0.7+0.5*(Math.random());
    //             // scalesAttribute.setX(i, 1);
                
    //             // let quaternion = new THREE.Quaternion();
    //             // quaternion.setFromAxisAngle(new THREE.Vector3((Math.random()-0.5)*0.25,1,(Math.random()-0.5)*0.25),angle);
                
    //             //quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
    //             info.velocity[i] = (new THREE.Vector3(
    //                 1*(Math.random()-0.5),
    //                 1*(Math.random()-0.5),
    //                 2.5+1*(Math.random())));
    //             info.velocity[i].divideScalar(20);
    //             dummy.updateMatrix();
    //             mesh.setMatrixAt(i, dummy.matrix);
    //         }
    //         mesh.instanceMatrix.needsUpdate = true;
    //         positionsAttribute.needsUpdate = true;
    //         scalesAttribute.needsUpdate = true;
    //         quaternionsAttribute.needsUpdate = true;
    //     }
    //     addInstancedMesh();
    //     app.updateMatrixWorld();
       
        
    //     useFrame(({timestamp}) => {
            
            
    //         //console.log(localPlayer.characterSfx.lastStepped[0], localPlayer.characterSfx.lastStepped[1])
            
    //         if (mesh) {
    //             const opacityAttribute = mesh.geometry.getAttribute('opacity');
    //             const brokenAttribute = mesh.geometry.getAttribute('broken');
    //             // const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
    //             const positionsAttribute = mesh.geometry.getAttribute('positions');
    //             const scalesAttribute = mesh.geometry.getAttribute('scales');
    //             for (let i = 0; i < particleCount; i++) {
                   
    //                 if(localPlayer.characterSfx.leftStep && positionsAttribute.getY(i)<-0.1 && floatOnWater){
    //                     info.velocity[i].x=0.5*(Math.random()-0.5);
    //                     info.velocity[i].y=0.25+0.1*(Math.random());
    //                     info.velocity[i].z=0.5*(Math.random()-0.5);
                        
                            
    //                     info.velocity[i].divideScalar(20);
                        
    //                     positionsAttribute.setXYZ(i, 0,0,0);
    //                     brokenAttribute.setX(i, 0.4+Math.random()*0.3);
    //                     opacityAttribute.setX(i, 1);
    //                     scalesAttribute.setX(i,Math.random()*0.4);
    //                 }
                    

    //                 if(positionsAttribute.getY(i)>=-100){
    //                     positionsAttribute.setXYZ(  i, 
    //                                                 positionsAttribute.getX(i)+info.velocity[i].x,
    //                                                 positionsAttribute.getY(i)+info.velocity[i].y,
    //                                                 positionsAttribute.getZ(i)+info.velocity[i].z
    //                                             );

    //                     opacityAttribute.setX(i, opacityAttribute.getX(i)-0.055);
    //                     if(brokenAttribute.getX(i)<1.0)
    //                         brokenAttribute.setX(i, brokenAttribute.getX(i)*1.02);
    //                     scalesAttribute.setX(scalesAttribute.getX(i)+0.01);
                        
    //                     info.velocity[i].add(acc);
                      
    //                 }
                    
    
    //             }
               
    //             splashGroup.position.copy(localPlayer.position);
    //             // group.position.x-=0.5*currentDir.x;
    //             // group.position.z-=0.5*currentDir.z;
    //             splashGroup.rotation.copy(localPlayer.rotation);
    //             splashGroup.position.y = waterHeight;

    //             group.position.x=0.125;
    //             group.rotation.copy(camera.rotation);
    //             if(localPlayer.rotation.x==0){
    //                 group.rotation.y-=localPlayer.rotation.y;
    //             }
    //             else{
    //                 if(localPlayer.rotation.y>0){
    //                     group.rotation.y+=(localPlayer.rotation.y-Math.PI);
    //                 }
                        
    //                 else{
    //                     group.rotation.y+=(localPlayer.rotation.y+Math.PI);
    //                 }
    //             }
    //             //group.rotation.copy(localPlayer.rotation);
    //             mesh.instanceMatrix.needsUpdate = true;
    //             positionsAttribute.needsUpdate = true;
    //             opacityAttribute.needsUpdate = true;
    //             brokenAttribute.needsUpdate = true;
    //             scalesAttribute.needsUpdate = true;
    //             // startTimesAttribute.needsUpdate = true;
    //             mesh.material.uniforms.uTime.value=timestamp/1000;
    
    //         }
    //         group.updateMatrixWorld();
    //     });
    //   }
    //   //###################################################################### left hand splash follow player ######################################################################
    // {
    //     const particleCount = 50;
    //     const group=new THREE.Group();
    //     const splashGroup=new THREE.Group();
    //     let matrix = new THREE.Matrix4();
    //     let dummy = new THREE.Object3D();
    //     let info = {
    //         velocity: [particleCount]
    //     }
    //     let acc = new THREE.Vector3(0, -0.002, 0);
    
    //     //##################################################### get geometry #####################################################
    //     const identityQuaternion = new THREE.Quaternion();
    //     const _getSplashGeometry = geometry => {
    //         //console.log(geometry)
    //         const geometry2 = new THREE.BufferGeometry();
    //         ['position', 'normal', 'uv'].forEach(k => {
    //           geometry2.setAttribute(k, geometry.attributes[k]);
    //         });
    //         geometry2.setIndex(geometry.index);
            
    //         const positions = new Float32Array(particleCount * 3);
    //         const positionsAttribute = new THREE.InstancedBufferAttribute(positions, 3);
    //         geometry2.setAttribute('positions', positionsAttribute);
    //         const quaternions = new Float32Array(particleCount * 4);
    //         for (let i = 0; i < particleCount; i++) {
    //           identityQuaternion.toArray(quaternions, i * 4);
    //         }
    //         const quaternionsAttribute = new THREE.InstancedBufferAttribute(quaternions, 4);
    //         geometry2.setAttribute('quaternions', quaternionsAttribute);
    
    //         const startTimes = new Float32Array(particleCount);
    //         const startTimesAttribute = new THREE.InstancedBufferAttribute(startTimes, 1);
    //         geometry2.setAttribute('startTimes', startTimesAttribute);
    
    //         const opacityAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         opacityAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('opacity', opacityAttribute);
    
    //         const brokenAttribute = new THREE.InstancedBufferAttribute(new Float32Array(particleCount), 1);
    //         brokenAttribute.setUsage(THREE.DynamicDrawUsage);
    //         geometry2.setAttribute('broken', brokenAttribute);

    //         const scales = new Float32Array(particleCount);
    //         const scaleAttribute = new THREE.InstancedBufferAttribute(scales, 1);
    //         geometry2.setAttribute('scales', scaleAttribute);
        
    //         return geometry2;
    //     };
    
    //     //##################################################### material #####################################################
    //     const splashMaterial = new THREE.ShaderMaterial({
    //         uniforms: {
    //             uTime: {
    //                 value: 0,
    //             },
    //             perlinnoise:{
    //                 value: splashTexture
    //             },
    //             noiseMap:{
    //                 value: noiseMap
    //             }
    //         },
    //         vertexShader: `\
                
    //             ${THREE.ShaderChunk.common}
    //             ${THREE.ShaderChunk.logdepthbuf_pars_vertex}
            
            
    //             uniform float uTime;
        
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             varying float vBroken;
    //             varying float vOpacity;
    //             attribute vec3 positions;
    //             attribute float scales;
    //             attribute vec4 quaternions;
    //             attribute float broken;
    //             attribute float opacity;
    //             vec3 qtransform(vec3 v, vec4 q) { 
    //               return v + 2.0*cross(cross(v, q.xyz ) + q.w*v, q.xyz);
    //             }
            
    //             void main() {
    //             vBroken=broken;
    //             vOpacity=opacity;
    //             vUv=uv;
    //             vPos=position;
    //             vec3 pos = position;
    //             pos*=scales;
    //             pos+=positions;
    //             //pos = qtransform(pos, quaternions);
    //             //pos.y=cos(uTime/100.);
    //             vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    //             vec4 viewPosition = viewMatrix * modelPosition;
    //             vec4 projectionPosition = projectionMatrix * viewPosition;
        
    //             gl_Position = projectionPosition;
    //             ${THREE.ShaderChunk.logdepthbuf_vertex}
    //             }
    //         `,
    //         fragmentShader: `\
    //             ${THREE.ShaderChunk.logdepthbuf_pars_fragment}
    //             uniform float uTime;
    //             varying float vBroken;
    //             varying float vOpacity;
    //             varying vec2 vUv;
    //             varying vec3 vPos;
    //             uniform sampler2D perlinnoise;
    //             uniform sampler2D noiseMap;
                
                
                
                
                
    //             void main() {
    //                 // vec3 ripple2 = texture2D(
    //                 //     perlinnoise,
    //                 //     mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
    //                 // ).rgb; 

    //                 vec3 noise = texture2D(
    //                     noiseMap,
    //                     mod(1.*vec2(2.*vUv.x,2.*vUv.y-uTime*5. ),1.)
    //                 ).rgb;
    //                 vec4 ripple = texture2D(
    //                     perlinnoise,
    //                     vUv
    //                 );


    //                 gl_FragColor = ripple;
    //                 if(gl_FragColor.r<0.1){
    //                     discard;
    //                 }
    //                 else{
    //                     gl_FragColor=vec4(1.0,1.0,1.0,1.0);
    //                 }
    //                 //float broken = abs( sin( 1.0 - mod(uTime,1.0) ) ) - noise.r;
    //                 float broken = abs( sin( 1.0 - vBroken ) ) - texture2D( noiseMap, vUv ).g;
    //                 if ( broken < 0.0001 ) discard;

    //                 gl_FragColor.a*=vOpacity;

                    
    //                 // if(gl_FragColor.r >= 0.65){
    //                 //    gl_FragColor =  vec4(1.,1.,1.,1.);
    //                 // }else{
    //                 //     gl_FragColor = vec4(0.,0.,1.,0.);
    //                 // }
    //                 // float broken = abs( sin( pow(1.0 - vUv.y,1.) ) ) - noise.g;
    //                 // if ( broken < 0.0001 ) discard;
    //                 // gl_FragColor.a*=opacity;
    //                 // if(uTime>0.5)
    //                 //     gl_FragColor.a=0.;
                    
    //                 //gl_FragColor=vec4(1.0,1.0,1.0,1.0);
    //             ${THREE.ShaderChunk.logdepthbuf_fragment}
    //             }
    //         `,
    //         side: THREE.DoubleSide,
    //         transparent: true,
    //         depthWrite: false,
    //         //blending: THREE.AdditiveBlending,
            
    //     });
        
       
    
        
    
    //     //##################################################### object #####################################################
    //     let mesh=null;
    //     const addInstancedMesh=()=>{
    //         const geometry2 = new THREE.PlaneGeometry( 0.5, 0.5 );
    //         const geometry =_getSplashGeometry(geometry2)
    //         mesh = new THREE.InstancedMesh(
    //             geometry,
    //             splashMaterial,
    //             particleCount
    //         );
    //         group.add(mesh);
    //         splashGroup.add(group)
    //         app.add(splashGroup);
    //         const positionsAttribute = mesh.geometry.getAttribute('positions');
    //         const scalesAttribute = mesh.geometry.getAttribute('scales');
    //         const quaternionsAttribute = mesh.geometry.getAttribute('quaternions');
    //         for (let i = 0; i < particleCount; i++) {
    //             mesh.getMatrixAt(i, matrix);
    //             matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
                
                
    //             // let angle = i / (particleCount-1) * Math.PI;
    //             // positionsAttribute.setXYZ(i,.1* Math.sin(angle), 0, .1* Math.cos(angle));
                
    //             // let randScale = 0.7+0.5*(Math.random());
    //             // scalesAttribute.setX(i, 1);
                
    //             // let quaternion = new THREE.Quaternion();
    //             // quaternion.setFromAxisAngle(new THREE.Vector3((Math.random()-0.5)*0.25,1,(Math.random()-0.5)*0.25),angle);
                
    //             //quaternionsAttribute.setXYZW(i,quaternion.x,quaternion.y,quaternion.z,quaternion.w);
    //             info.velocity[i] = (new THREE.Vector3(
    //                 1*(Math.random()-0.5),
    //                 1*(Math.random()-0.5),
    //                 2.5+1*(Math.random())));
    //             info.velocity[i].divideScalar(20);
    //             dummy.updateMatrix();
    //             mesh.setMatrixAt(i, dummy.matrix);
    //         }
    //         mesh.instanceMatrix.needsUpdate = true;
    //         positionsAttribute.needsUpdate = true;
    //         scalesAttribute.needsUpdate = true;
    //         quaternionsAttribute.needsUpdate = true;
    //     }
    //     addInstancedMesh();
    //     app.updateMatrixWorld();
       
    //     let localVector = new THREE.Vector3();
    //     useFrame(({timestamp}) => {
            
           
           
            
    //         if (mesh) {
    //             const opacityAttribute = mesh.geometry.getAttribute('opacity');
    //             const brokenAttribute = mesh.geometry.getAttribute('broken');
    //             // const startTimesAttribute = mesh.geometry.getAttribute('startTimes');
    //             const positionsAttribute = mesh.geometry.getAttribute('positions');
    //             const scalesAttribute = mesh.geometry.getAttribute('scales');
    //             for (let i = 0; i < particleCount; i++) {
                   
    //                 if(currentSpeed>0.2 && !localPlayer.characterSfx.leftStep && positionsAttribute.getY(i)<-0.1 && floatOnWater){
    //                     info.velocity[i].x=0.5*(Math.random()-0.5);
    //                     info.velocity[i].y=0.25+0.1*(Math.random());
    //                     info.velocity[i].z=0.5*(Math.random()-0.5);
                        
                            
    //                     info.velocity[i].divideScalar(20);
                        
    //                     positionsAttribute.setXYZ(i, 0,0,0);
    //                     brokenAttribute.setX(i, 0.4+Math.random()*0.3);
    //                     opacityAttribute.setX(i, 1);
    //                     scalesAttribute.setX(i,Math.random()*0.4);
    //                 }
                    

    //                 if(positionsAttribute.getY(i)>=-100){
    //                     positionsAttribute.setXYZ(  i, 
    //                                                 positionsAttribute.getX(i)+info.velocity[i].x,
    //                                                 positionsAttribute.getY(i)+info.velocity[i].y,
    //                                                 positionsAttribute.getZ(i)+info.velocity[i].z
    //                                             );

    //                     opacityAttribute.setX(i, opacityAttribute.getX(i)-0.055);
    //                     if(brokenAttribute.getX(i)<1.0)
    //                         brokenAttribute.setX(i, brokenAttribute.getX(i)*1.02);
    //                     scalesAttribute.setX(scalesAttribute.getX(i)+0.01);
                        
    //                     info.velocity[i].add(acc);
                      
    //                 }
                    
    
    //             }
               
    //             splashGroup.position.copy(localPlayer.position);
    //             // group.position.x-=0.5*currentDir.x;
    //             // group.position.z-=0.5*currentDir.z;
    //             splashGroup.rotation.copy(localPlayer.rotation);
    //             splashGroup.position.y = waterHeight;

    //             group.position.x=-0.125;
    //             group.rotation.copy(camera.rotation);
    //             if(localPlayer.rotation.x==0){
    //                 group.rotation.y-=localPlayer.rotation.y;
    //             }
    //             else{
    //                 if(localPlayer.rotation.y>0){
    //                     group.rotation.y+=(localPlayer.rotation.y-Math.PI);
    //                 }
                        
    //                 else{
    //                     group.rotation.y+=(localPlayer.rotation.y+Math.PI);
    //                 }
    //             }
    //             //group.rotation.copy(localPlayer.rotation);
    //             mesh.instanceMatrix.needsUpdate = true;
    //             positionsAttribute.needsUpdate = true;
    //             opacityAttribute.needsUpdate = true;
    //             brokenAttribute.needsUpdate = true;
    //             scalesAttribute.needsUpdate = true;
    //             // startTimesAttribute.needsUpdate = true;
    //             mesh.material.uniforms.uTime.value=timestamp/1000;
    
    //         }
    //         group.updateMatrixWorld();
    //     });
    //   }
      