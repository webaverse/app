import metaversefile from 'metaversefile';
const {useApp, usePhysics, useCleanup, useFrame, useActivate, useLoaders} = metaversefile;

export default () => {
    const app = useApp();

    setTimeout(() => {
      var evt = new CustomEvent("cEvent", {detail: "Any Object Here"});
      window.dispatchEvent(evt);
    }, 40 * 1000)
    //Dispatch an event
    
    return app;
  };