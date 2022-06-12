import * as THREE from 'three';
import metaversefile from 'metaversefile';


const {useApp, useFrame, useLoaders, usePhysics, useCleanup, useLocalPlayer, useActivate} = metaversefile;

const baseUrl = import.meta.url.replace(/(\/)[^\/\/]*$/, '$1'); 


export default () => {  

    const app = useApp();
    //################################################### glb #########################################################
    {
        let campFire = null;
        const physics = usePhysics();
        const physicsIds = [];
        (async () => {
            const u = `${baseUrl}/assets/campFire.glb`;
            campFire = await new Promise((accept, reject) => {
                const {gltfLoader} = useLoaders();
                gltfLoader.load(u, accept, function onprogress() {}, reject);
                
            });
            
            app.add(campFire.scene);
            let physicsId;
            physicsId = physics.addGeometry(campFire.scene);
            physicsIds.push(physicsId)
            app.updateMatrixWorld();
    
    
        })();
    
        
        
    
        // useFrame(( { timeStamp } ) => {
        //   if(prop){
        //     prop.rotation.x = -1.570799097288404; 
        //     prop.rotation.y += -1.4884504324181542; 
        //     prop.rotation.z = -3.141592653589793; 
        //   }
        //   app.updateMatrixWorld();
        // });
    
        
        useCleanup(() => {
          for (const physicsId of physicsIds) {
            physics.removeGeometry(physicsId);
          }
        });
    }
    

    return app;
}