import metaversefile from 'metaversefile';
const {useApp, usePhysics, useCleanup, useFrame, useActivate, useLoaders} = metaversefile;

export default () => {
    const app = useApp();

    //Dispatch an event
    var evt = new CustomEvent("cEvent", {detail: "Any Object Here"});
    window.dispatchEvent(evt);
    
    return app;
  };