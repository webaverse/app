import * as THREE from 'three';
import metaversefile from 'metaversefile'
import { TerrainManager } from './terrain-manager.js';
import { Water } from './Water.js'
import { Sky } from './Sky.js'

const { useFrame, useLocalPlayer, useLoaders, useUi, usePhysics, useCleanup, useGeometryUtils } = metaversefile;


export default () => {

    const physics = usePhysics();
    const geometryUtils = useGeometryUtils();

    const rootScene = new THREE.Object3D();


    const terrainManager = new TerrainManager(128, 2, geometryUtils);
    const terrain = terrainManager.mesh;

    let physicsIdChunkIdPairs = [];

    let chunkIdMeshPairs = terrainManager.getInitialChunkMeshes();

    chunkIdMeshPairs.forEach(pair => {

        if (!!pair[1]) {
            const physicsId = physics.addGeometry(pair[1]);
            physicsIdChunkIdPairs.push({ physicsId: physicsId, chunkId: pair[0] });
        }
    });

    terrainManager.onRemoveChunks = async (chunkIds) => {
        physicsIdChunkIdPairs.filter(pair => chunkIds.includes(pair.chunkId))
        .forEach(pair => {
            physics.removeGeometry(pair.physicsId);
        });

        physicsIdChunkIdPairs = physicsIdChunkIdPairs.filter(pair => !chunkIds.includes(pair.chunkId));
    };

    terrainManager.onAddChunk = async (chunkId) => {
        const mesh = terrainManager.getChunkMesh(chunkId);
        if (!!mesh) {
            const physicsId = physics.addGeometry(mesh);
            physicsIdChunkIdPairs.push({ physicsId: physicsId, chunkId: chunkId });
        }
    };

    rootScene.add(terrain);

    const player = useLocalPlayer();
    player.position.y = 100;
    terrainManager.updateCenter(player.position);
    terrainManager.updateChunk();

    useFrame(() => {

        terrainManager.updateCenter(player.position);
        terrainManager.updateChunk();
    });

    rootScene.add(new THREE.AxesHelper(1000))



    player.position.y = 150;
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);

    const water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(`${import.meta.url.replace(/(\/)[^\/]*$/, '$1')}/textures/waternormals.jpg`, function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            // fog: scene.fog !== undefined
        }
    );
    water.material.uniforms.size.value = 10;

    water.rotation.x = - Math.PI / 2;
    water.position.y = 65;


    rootScene.add(water);


    const sky = new Sky();
    sky.scale.setScalar(10000);
    rootScene.add(sky);

    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    const parameters = {
        elevation: 30,
        azimuth: 180
    };
    const sunPosition = new THREE.Vector3;

    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    sunPosition.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sunPosition);
    water.material.uniforms['sunDirection'].value.copy(sunPosition).normalize();

    return rootScene;
}
