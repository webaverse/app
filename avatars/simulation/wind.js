import * as THREE from 'three';
import Simplex from '../../simplex-noise.js';
import metaversefile from 'metaversefile';

const simplex = new Simplex();
let windDirection = new THREE.Vector3();
const windPosition = new THREE.Vector3();
const windNoisePos = new THREE.Vector3();
const localVector2 = new THREE.Vector3();
const zeroVector3 = new THREE.Vector3();

const update = (timestamp, headPosition, springBoneManager) => {
  const winds = metaversefile.getWinds();
  const timeS = timestamp / 1000;

  const inWindZone = () => {
    for (let i = 0; i < winds.length; i++) {
      if (winds[i].windType === 'spherical' || winds[i].windType === 'central') {
        windPosition.set(winds[i].position[0], winds[i].position[1], winds[i].position[2]);
        if (headPosition.distanceTo(windPosition) <= winds[i].radius) {
          return i;
        }
      }
    }
    return -1;
  };

  const _handleNoWind = () => {
    for (const joint of springBoneManager.joints) {
      joint.settings.gravityDir = zeroVector3;
      joint.settings.gravityPower = 0;
    }
  };
  const _handleDirectional = (wind) => {
    windDirection.set(wind.direction[0], wind.direction[1], wind.direction[2]);
    const windForce = wind.windForce !== undefined ? wind.windForce : 0;
    const noiseScale = wind.noiseScale !== undefined ? wind.noiseScale : 0;
    const windFrequency = wind.windFrequency !== undefined ? wind.windFrequency : 0;
    const windSpeed = timeS * windFrequency;

    for (const joint of springBoneManager.joints) {
      const worldPos = localVector2.setFromMatrixPosition(joint.bone.matrixWorld);
      windNoisePos.x = worldPos.x * noiseScale + windSpeed;
      windNoisePos.y = worldPos.y * noiseScale + windSpeed;
      windNoisePos.z = worldPos.z * noiseScale + windSpeed;
      let windNoise = simplex.noise3D(windNoisePos.x, windNoisePos.y, windNoisePos.z);
      windNoise = (windNoise + 1) / 2;

      joint.settings.gravityDir.normalize().lerp(windDirection.normalize(), 0.5);
      joint.settings.gravityPower = windNoise * windForce;
    }
  };
  const _handleSpherical = (wind) => {
    windDirection.set(wind.direction[0], wind.direction[1], wind.direction[2]);
    const windForce = wind.windForce ?? 0;
    const noiseScale = wind.noiseScale ?? 0;
    const windFrequency = wind.windFrequency ?? 0;
    const windSpeed = timeS * windFrequency;

    for (const joint of springBoneManager.joints) {
      const worldPos = localVector2.setFromMatrixPosition(joint.bone.matrixWorld);
      windNoisePos.x = worldPos.x * noiseScale + windSpeed;
      windNoisePos.y = worldPos.y * noiseScale + windSpeed;
      windNoisePos.z = worldPos.z * noiseScale + windSpeed;
      let windNoise = simplex.noise3D(windNoisePos.x, windNoisePos.y, windNoisePos.z);
      windNoise = (windNoise + 1) / 2;

      joint.settings.gravityDir.normalize().lerp(windDirection.normalize(), 0.5);
      joint.settings.gravityPower =
        windNoise * (windForce * (1.1 - headPosition.distanceTo(windPosition) / wind.radius));
    }
  };
  const _handleCentral = (wind) => {
    const windForce = wind.windForce ?? 0;
    const noiseScale = wind.noiseScale ?? 0;
    const windFrequency = wind.windFrequency ?? 0;
    const windSpeed = timeS * windFrequency;

    for (const joint of springBoneManager.joints) {
      const worldPos = localVector2.setFromMatrixPosition(joint.bone.matrixWorld);
      windNoisePos.x = worldPos.x * noiseScale + windSpeed;
      windNoisePos.y = worldPos.y * noiseScale + windSpeed;
      windNoisePos.z = worldPos.z * noiseScale + windSpeed;
      let windNoise = simplex.noise3D(windNoisePos.x, windNoisePos.y, windNoisePos.z);
      windNoise = (windNoise + 1) / 2;

      windDirection.x = headPosition.x - windPosition.x;
      windDirection.z = headPosition.z - windPosition.z;
      windDirection.y = wind.direction[1];

      joint.settings.gravityDir.normalize().lerp(windDirection.normalize(), 0.5);
      joint.settings.gravityPower =
        windNoise * (windForce * (1.1 - headPosition.distanceTo(windPosition) / wind.radius));
    }
  };
  if (winds && winds.length > 0) {
    let windIndex = inWindZone();
    if (windIndex !== -1) {
      if (winds[windIndex].windType === 'spherical') _handleSpherical(winds[windIndex]);
      else if (winds[windIndex].windType === 'central') _handleCentral(winds[windIndex]);
    } else {
      for (const wind of winds) {
        if (wind.windType === 'directional') {
          _handleDirectional(wind);
          break;
        }
      }
    }
  } else {
    _handleNoWind();
  }
};
export {update};
