import { Object3D, Vector3 } from 'three'

const { random, sqrt, PI, cos, sin } = Math


export function sampleCylinder(uniform, minRadius, radius, height) {
  // generates a random direction
  const dir = new Vector3(random() - 0.5, 0.0, random() - 0.5).normalize()
  // generates a random distance, with min distance
  const distance = uniform ? sqrt(random() * (radius - minRadius)) : random() * (radius - minRadius)
  return dir.clone().multiplyScalar(distance + minRadius).add(new Vector3(0, random() * height - height / 2, 0))
}

export function sampleRing(distance, per) {
  const theta = (per != null ? per : random()) * 2 * PI
  // generates a random direction
  const dir = new Vector3(cos(theta), 0.0, sin(theta)).normalize()
  return dir.clone().multiplyScalar(distance)
}


export function sampleTorus(uniform, radius, minHeight, height) {
  const distHeight = uniform ? sqrt(random() * (height - minHeight)) : random() * (height - minHeight)

  const dir = new Vector3(random() - 0.5, random() - 0.5, 0.0).normalize()
  const location = dir.clone().multiplyScalar(distHeight + minHeight).add(new Vector3(radius, 0, 0))
  // rotate location around by theta
  const parent = new Object3D()
  const obj = new Object3D()
  parent.add(obj)
  obj.position.copy(location)
  parent.rotation.y = random() * 2 * PI
  const res = new Vector3()
  obj.getWorldPosition(res)
  return res
}

export function sampleSphere(uniform, minRadius, radius) {
  // generates a random direction
  const dir = new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize()
  // generates a random distance, with min distance
  const distance = uniform ? sqrt(random() * (radius - minRadius)) : random() * (radius - minRadius)
  return dir.clone().multiplyScalar(distance + minRadius)
}

export function sampleArea(min, max) {
  const dist = max.clone().sub(min)
  dist.x *= random()
  dist.y *= random()
  dist.z *= random()

  return min.clone().add(dist)
}

export function sampleCone(uniform, startTheta = 0, thetaDist = PI, height) {
  const theta = random() * PI * 0.5
  const phi = random() * 2 * PI
  const temp = new Vector3(cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta))
  return temp.multiplyScalar(height)
}

export function circleDirection(angle) {
  const theta = random() * PI * angle
  const phi = random() * 2 * PI
  return new Vector3(cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta))
}