import React, {Fragment, useState, useRef} from 'react';
import * as THREE from 'three';
import {Canvas, useFrame, useThree} from '@react-three/fiber';

function Box(props) {
  // This reference will give us direct access to the THREE.Mesh object
  const mesh = useRef()
  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false)
  const [active, setActive] = useState(false)
  // Subscribe this component to the render-loop, rotate the mesh every frame
  /* useFrame((state, delta) => {
    mesh.current.rotation.x += 0.01;
  }); */
  if (props.animate) {
    useFrame((state, delta) => {
      const t = 2000;
      const f = (Date.now() % t) / t;
      mesh.current.position.x = Math.cos(f * Math.PI * 2);
      mesh.current.position.y = 2 + Math.sin(f * Math.PI * 2);
    });
  }
  // Return the view, these are regular Threejs elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={mesh}
      // scale={active ? 1.5 : 1}
      onClick={(event) => setActive(!active)}
      onPointerOver={(event) => setHover(true)}
      onPointerOut={(event) => setHover(false)}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={props.color} roughness={1} metalness={0} />
    </mesh>
  )
}
/* function Camera(props) {
  const ref = useRef()
  const set = useThree(state => state.set)
  // Make the camera known to the system
  useEffect(() => void set({ camera: ref.current }), [])
  // Update it every frame
  useFrame(() => ref.current.updateMatrixWorld())
  return <perspectiveCamera ref={ref} {...props} />
} */

const Floor = ({app}) => {
  const h = 0.1;
  const position = [0, -h/2, 0];
  const scale = [10, h, 10];
  
  const PhysicsBox = app.physics.Box;
  
  return (
    <Fragment>
      <Box
        position={position}
        scale={scale}
        color={0x0049ef4}
      />
      <PhysicsBox
        position={position}
        scale={scale.map(n => n * 1.05)}
      />
    </Fragment>
  );
};

const lightQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, -1, -1).normalize()).toArray();
const render = ({app}) => {
  // console.log('render', r, React, r === React);
  return (
    <Fragment>
      {/* <ambientLight /> */}
      <directionalLight position={[10, 10, 10]} quaternion={lightQuaternion} />
      <Box position={[0, 1, 0]} color="hotpink" animate />
		  {/* <Floor
        app={app}
      /> */}
    </Fragment>
  );
};
export default render;
