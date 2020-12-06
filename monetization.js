  export default (instanceId) => {
    if (!instanceId) { return; }

    const monetizationStartHandler = (e) => {
      console.log("e:", e.detail);
      console.log("instanceId:", instanceId);

      if (e.detail.instanceId === instanceId) {
        console.log("!!! starting monetization id=", instanceId);
      } else {
        console.log("no id -- but starting monetization id=", instanceId);
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    const monetizationStopHandler = (e) => {
      if (e.instanceId === instanceId) {

      } else {

      }
    }
    const monetizationPendingHandler = (e) => {
      if (e.instanceId === instanceId) {

      } else {

      }
    }
    const monetizationProgressHandler = (e) => {
      if (e.instanceId === instanceId) {

      } else {

      }
    }

    if (!document.monetization) {
      document.monetization = document.createElement('div');
    }

    document.monetization.addEventListener('monetizationstart', e => { monetizationStartHandler(e) })
    document.monetization.addEventListener('monetizationstop', e => { monetizationStopHandler(e) })
    document.monetization.addEventListener('monetizationpending', e => { monetizationPendingHandler(e) })
    document.monetization.addEventListener('monetizationprogress', e => { monetizationProgressHandler(e) })
  }
