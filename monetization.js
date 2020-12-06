export default (instanceId) => {
  if (!instanceId) { return; }

  /* Handle Default Web Monetization Events */
  const monetizationStartHandler = (e) => {
    const INSTANCE_ID = instanceId;

    if (!e.detail.instanceId) {
      console.log("stopped");
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    } else if (e.detail.instanceId === INSTANCE_ID) {
      console.log("matches id----");
      e.stopPropagation();
      e.stopImmediatePropagation();
    } else {
      console.log("final else INSTANCE_ID:", INSTANCE_ID, "e.detail.instanceId:", e.detail.instanceId);
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }
  const monetizationStopHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
  const monetizationPendingHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
  const monetizationProgressHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
  if (document.monetization) {
    document.monetization.addEventListener('monetizationstart', e => { monetizationStartHandler(e) })
    document.monetization.addEventListener('monetizationstop', e => { monetizationStopHandler(e) })
    document.monetization.addEventListener('monetizationpending', e => { monetizationPendingHandler(e) })
    document.monetization.addEventListener('monetizationprogress', e => { monetizationProgressHandler(e) })
  }
}
