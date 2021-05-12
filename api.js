import physicsManager from './physics-manager.js';

function Box(props) {
  useEffect(() => {
    physicsManager.addBoxGeometry();
    return () => {
    };
  }, []);
  return (<div />);
}

const physics = {
  addBoxGeometry: physicsManager.addBoxGeometry.bind(physicsManager),
  removeGeometry: physicsManager.removeGeometry.bind(physicsManager),
  Box,
};
export {
  physics,
};