import * as THREE from 'three';
import SilkShader from './shaders/SilkShader.js';
import DebugShader from './shaders/DebugShader.js';
import metaversefile from 'metaversefile';

const {useApp, useFrame, useLoaders, usePhysics, useCleanup} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 


export default () => {  

    const app = useApp();
    const physics = usePhysics();
    const physicsIds = [];
    
    //console.log( 'texture path: ' + baseUrl + "textures/silk/silk-contrast-noise.png" );
    //console.log( 'SilkShader = ' + SilkShader.vertexShader )

    const createShaderMaterial = () => {

        let testSilkTexture = new THREE.TextureLoader().load( baseUrl + "textures/silk/silk-contrast-noise.png" );
        testSilkTexture.wrapS = testSilkTexture.wrapT = THREE.RepeatWrapping;

        SilkShader.uniforms.noiseImage.value = testSilkTexture;

        const silkShaderMat = new THREE.ShaderMaterial({
            uniforms: SilkShader.uniforms,
            vertexShader: SilkShader.vertexShader,
            fragmentShader: SilkShader.fragmentShader,
            side: THREE.DoubleSide,
        })

        //return silkShaderMat;
        //return new THREE.MeshNormalMaterial();

        let debugMat = new THREE.ShaderMaterial( {
            vertexShader: DebugShader.vertexShader,
            fragmentShader: DebugShader.fragmentShader,
            side: THREE.DoubleSide
        });

        return debugMat;

    }

    const silkShaderMaterial = createShaderMaterial();

    const loadModel = ( params ) => {

        return new Promise( ( resolve, reject ) => {
                
            //const loader = new GLTFLoader();
            const { gltfLoader } = useLoaders();
            const { dracoLoader } = useLoaders();
            gltfLoader.setDRACOLoader( dracoLoader );
    
            gltfLoader.load( params.filePath + params.fileName, function( gltf ) {
    
                let numVerts = 0;
    
                gltf.scene.traverse( function ( child ) {

                    const physicsId = physics.addGeometry( child );
                    physicsIds.push( physicsId );
    
                    if ( child.isMesh ) {
    
                        numVerts += child.geometry.index.count / 3;  
    
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
    
                console.log( `SF ground modelLoaded() -> ${ params.fileName } num verts: ` + numVerts );
    
                gltf.scene.position.set( params.pos.x, params.pos.y, params.pos.z  );

                resolve( gltf.scene );     
            });
        })
    }

    loadModel( { 
        filePath: baseUrl,
        fileName: 'GroundOnly_V2_galad.glb',
        pos: { x: 0, y: 0, z: 0 },
    } ).then ( 
        result => {
            app.add( result );
        }
    )

    useFrame(( { timestamp } ) => {
        //console.log( 'timestamp ', silkShaderMaterial.uniforms.noiseImage );
        //silkShaderMaterial.uniforms.time.value += 0.02;
    });

    useCleanup(() => {
      for (const physicsId of physicsIds) {
       physics.removeGeometry(physicsId);
      }
    });

    return app;
}