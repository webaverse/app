import '/face-tracking/holistic/holistic.js';
// window.Holistic = Holistic;
console.log('worker listening for message 0');

document.body.style.backgroundColor = '#0F0';

const locateFile = file => {
  // console.log('find file', file, `/face-tracking/holistic/${file}`);
  return `/face-tracking/holistic/${file}`;
};
const holistic = new Holistic({
  locateFile,
});
// holistic = new Holistic();
holistic.setOptions({
  // staticImageMode: true,
  modelComplexity: 2,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  refineFaceLandmarks: true,
  // minDetectionConfidence: 0.9,
  // minTrackingConfidence: 0.9,
});
holistic.onResults(results => {
  const {
    faceLandmarks,
    poseLandmarks,
    ea,
    rightHandLandmarks,
    leftHandLandmarks,
  } = results;

  // console.log('got results', results);
  messagePort.postMessage({
    error: null,
    result: {
      faceLandmarks,
      poseLandmarks,
      ea,
      rightHandLandmarks,
      leftHandLandmarks,
    },
  })
});
/* holistic.g.D = {
  canvas: null,
  lol: 'zol',
}; */

// console.log('worker listening for message 1');
let messagePort;
window.addEventListener('message', e => {
  if (e.data?._webaverse) {
    messagePort = e.data.messagePort;
    // console.log('worker got message', messagePort, e);
    messagePort.onmessage = async e => {
      // console.log('message port got message', e);
      const image = e.data.image;
      if (image) {
        // console.log('send image for processing', image);
        await holistic.send({
          image,
        });
      } else {
        postMessage({
          error: 'no image provided',
          result: null,
        });
      }
    };
  }
});
console.log('worker listening for message 2');