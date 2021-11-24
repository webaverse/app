import '/face-tracking/holistic/holistic.js';
// window.Holistic = Holistic;
console.log('worker listening for message 0');

// document.body.style.backgroundColor = '#0F0';

/* setTimeout(() => {
  for(;;) {}
}, 1000); */

/* setInterval(() => {
  console.log('still alive');
}, 2000); */

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
  // modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  refineFaceLandmarks: true,
  // minDetectionConfidence: 0.5,
  // minTrackingConfidence: 0.5,
});
holistic.onResults(results => {
  const {
    faceLandmarks,
    poseLandmarks,
    ea,
    rightHandLandmarks,
    leftHandLandmarks,
  } = results;

  // console.timeEnd('lol');
  
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
  });
});
/* holistic.g.D = {
  canvas: null,
  lol: 'zol',
}; */

console.log('worker listening for message 1');
let messagePort;
window.addEventListener('message', e => {
  // console.log('worker got message', e);
  if (e.data?._webaverse) {
    messagePort = e.data.messagePort;
    // console.log('worker got message', messagePort, e);
    messagePort.onmessage = async e => {
      // console.time('frame');
      // console.log('message port got message', e);
      const image = e.data.image;
      if (image) {
        // console.time('lol');
        // requestAnimationFrame(async () => {
          await holistic.send({
            image,
          });
        // });
      } else {
        postMessage({
          error: 'no image provided',
          result: null,
        });
      }
      // console.timeEnd('frame');
    };
  }
});
console.log('worker listening for message 2');

// this hack is needed to make the browser think the iframe is active
const _fakeRaf = () => {
  requestAnimationFrame(_fakeRaf);
};
_fakeRaf();