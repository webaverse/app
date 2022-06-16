import * as THREE from 'three';

import metaversefile from 'metaversefile';
const {useApp, useFrame, useLocalPlayer, useCameraManager, useLoaders, useInternals, usePhysics, useCleanup, getAppByPhysicsId} = metaversefile;
const baseUrl = import.meta.url.replace(/(\/)[^\/\\]*$/, '$1');


export default () => {
    const app = useApp();
    const localPlayer = useLocalPlayer();
    const cameraManager = useCameraManager();
    const {renderer, camera} = useInternals();
    const textureLoader = new THREE.TextureLoader()

    
    //############################################################ trace water surface ########################################################################
    {
        function createPlaneStencilGroup( geometry, plane, renderOrder ) {

            const group = new THREE.Group();
            const baseMat = new THREE.MeshBasicMaterial();
            baseMat.depthWrite = false;
            baseMat.depthTest = false;
            baseMat.colorWrite = false;
            baseMat.stencilWrite = true;
            baseMat.stencilFunc = THREE.AlwaysStencilFunc;

            // back faces
            const mat0 = baseMat.clone();
            mat0.side = THREE.BackSide;
            mat0.clippingPlanes = [ plane ];
            mat0.stencilFail = THREE.IncrementWrapStencilOp;
            mat0.stencilZFail = THREE.IncrementWrapStencilOp;
            mat0.stencilZPass = THREE.IncrementWrapStencilOp;

            const mesh0 = new THREE.Mesh( geometry, mat0 );
            mesh0.renderOrder = renderOrder;
            group.add( mesh0 );

            // front faces
            const mat1 = baseMat.clone();
            mat1.side = THREE.FrontSide;
            mat1.clippingPlanes = [ plane ];
            mat1.stencilFail = THREE.DecrementWrapStencilOp;
            mat1.stencilZFail = THREE.DecrementWrapStencilOp;
            mat1.stencilZPass = THREE.DecrementWrapStencilOp;

            const mesh1 = new THREE.Mesh( geometry, mat1 );
            mesh1.renderOrder = renderOrder;

            group.add( mesh1 );

            return group;

        }
        const planes = [
            new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 0 ),
            new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0 ),
            new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 0 )
        ];
        
        const geometry = new THREE.TorusKnotGeometry( 0.4, 0.15, 220, 60 );
        const object = new THREE.Group();
        app.add( object );

        const planeObjects = [];
		const planeGeom = new THREE.PlaneGeometry( 4, 4 );

        for ( let i = 0; i < 3; i ++ ) {

            const poGroup = new THREE.Group();
            const plane = planes[ i ];
            const stencilGroup = createPlaneStencilGroup( geometry, plane, i + 1 );

            // plane is clipped by the other clipping planes
            const planeMat =
                new THREE.MeshStandardMaterial( {

                    color: 0xE91E63,
                    metalness: 0.1,
                    roughness: 0.75,
                    clippingPlanes: planes.filter( p => p !== plane ),

                    stencilWrite: true,
                    stencilRef: 0,
                    stencilFunc: THREE.NotEqualStencilFunc,
                    stencilFail: THREE.ReplaceStencilOp,
                    stencilZFail: THREE.ReplaceStencilOp,
                    stencilZPass: THREE.ReplaceStencilOp,

                } );
            const po = new THREE.Mesh( planeGeom, planeMat );
            po.onAfterRender = function ( renderer ) {

                renderer.clearStencil();

            };

            po.renderOrder = i + 1.1;

            object.add( stencilGroup );
            poGroup.add( po );
            planeObjects.push( po );
            app.add( poGroup );

        }
        const material = new THREE.MeshStandardMaterial( {

            color: 0xFFC107,
            metalness: 0.1,
            roughness: 0.75,
            clippingPlanes: planes,
            clipShadows: true,
            shadowSide: THREE.DoubleSide,

        } );
        const clippedColorFront = new THREE.Mesh( geometry, material );
        clippedColorFront.castShadow = true;
        clippedColorFront.renderOrder = 6;
        object.add( clippedColorFront );
        renderer.shadowMap.enabled = true;
        renderer.localClippingEnabled = true;
        
        const constant = 0.2;
        useFrame(({timestamp}) => {
            object.rotation.x = timestamp / 1000;
			object.rotation.y = timestamp / 2000;
            for ( let i = 0; i < planeObjects.length; i ++ ) {

                const plane = planes[ i ];
                plane.constant = constant;
                const po = planeObjects[ i ];
                plane.coplanarPoint( po.position );
                po.lookAt(
                    po.position.x - plane.normal.x,
                    po.position.y - plane.normal.y,
                    po.position.z - plane.normal.z,
                );

            }
            app.updateMatrixWorld();
        });
    }
   
  app.setComponent('renderPriority', 'low');
  
  return app;
};


