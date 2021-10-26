import {Vector3,TextureLoader,Mesh,BoxGeometry,MeshBasicMaterial} from 'three';
// import {scene, renderer, camera, runtime, world, physics, ui, app, appManager} from 'app';
import metaversefile from 'metaversefile';
const {useApp, usePhysics, useCleanup, useActivate, removeApp} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1');	


export default () => {
	
    const app = useApp();
	const physics = usePhysics();
	
	let physicsIds = [];

    const imagePath = baseUrl+"textures/x.png";


    function addTexuredBox(texture)
    {
        const geometry = new BoxGeometry( 1, 1, 1 );
        let material = null;
        if (texture)
        {
            material = new MeshBasicMaterial( { map: texture } );
        }
        else
        {
            material = new MeshBasicMaterial( {color: 0xff0000} );
        }
    
        const mesh = new Mesh( geometry, material );
        app.add(mesh);
    
        const physicsId = physics.addGeometry(mesh);
        physicsIds.push(physicsId);
    }
    

    const textureX = new TextureLoader().load( imagePath,
        function ( texture ) {
            addTexuredBox(texture);
        },
    
        undefined,
    
        function ( err ) {
            addTexuredBox(null);
        });

	
	let activateCb = () => {
        //console.log("no-fill activate action");
        //app.destroy();
        removeApp(app);
	};
	useActivate(() => {
		activateCb && activateCb();
	});
	
	useCleanup(() => {
		for (const physicsId of physicsIds) {
			physics.removeGeometry(physicsId);
		}
	});


  return app;
};
