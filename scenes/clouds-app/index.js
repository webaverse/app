/* eslint-disable arrow-parens */
/* eslint-disable semi */
/* eslint-disable object-curly-spacing */
/* eslint-disable linebreak-style */
import metaversefile from 'metaversefile';
import * as THREE from 'three';
import { cloudFragment, cloudVertex } from './shaders/cloudShader';

const { useApp, useFrame, useCleanup, usePhysics, useLoaders, useClouds } =
  metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1'); // points to the index.js location
const physicsIds = []; // keeping track of physics objects for cleanup

export default (e) => {
  const app = useApp();
  app.name = 'clouds';

  const physics = usePhysics();
  const clouds = useClouds();

  const cloudSize = 4;

  {
    // texture
    const cloudData = new Uint8Array(cloudSize * cloudSize * cloudSize);
    console.log(clouds.generateTexture());
    const cloudTex = new THREE.DataTexture3D(
      cloudData,
      cloudSize,
      cloudSize,
      cloudSize
    );
    cloudTex.format = THREE.RedFormat;
    cloudTex.type = THREE.UnsignedByteType;
    cloudTex.minFilter = THREE.LinearFilter;
    cloudTex.magFilter = THREE.LinearFilter;
    // cloudTex.minFilter = THREE.NearestFilter;
    // cloudTex.magFilter = THREE.NearestFilter;
    cloudTex.flipY = false;
    cloudTex.needsUpdate = true;
    cloudTex.generateMipmaps = false;
    const textureViewerGeometry = new THREE.PlaneGeometry(4, 4);

    const textureViewer = new THREE.Mesh(
      textureViewerGeometry,
      new THREE.ShaderMaterial({
        vertexColors: true,
        vertexShader: cloudVertex,
        fragmentShader: cloudFragment,
        transparent: true,
        uniforms: {
          uVolume: { value: cloudTex },
        },
      })
    );
    const textureViewerWire = new THREE.Mesh(
      textureViewerGeometry,
      new THREE.MeshStandardMaterial({ color: 'green', wireframe: true })
    );
    app.add(textureViewer);
    app.add(textureViewerWire);
  }

  useFrame(() => {});

  useCleanup(() => {
    for (const physicsId of physicsIds) {
      physics.removeGeometry(physicsId);
    }
  });

  return app;
};
