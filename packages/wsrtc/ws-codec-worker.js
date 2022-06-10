import libopus from './libopusjs/libopus.wasm.js';
import {channelCount, sampleRate, bitrate, frameSize, voiceOptimization} from './ws-constants.js';

function floatTo16Bit(inputArray){
  const output = new Int16Array(inputArray.length);
  for (let i = 0; i < inputArray.length; i++){
    const s = Math.max(-1, Math.min(1, inputArray[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}
function int16ToFloat32(inputArray) {
  const output = new Float32Array(inputArray.length);
  for (let i = 0; i < inputArray.length; i++) {
    const int = inputArray[i];
    const float = (int >= 0x8000) ? -(0x10000 - int) / 0x8000 : int / 0x7FFF;
    output[i] = float;
  }
  return output;
}

onmessage = e => {
  const mode = e.data;
  switch (mode) {
    case 'encode': {
      onmessage = e => {};
      
      (async () => {
        await libopus.waitForReady();
        const enc = new libopus.Encoder(channelCount, sampleRate, bitrate, frameSize, voiceOptimization);
        onmessage = e => {
          const samples = floatTo16Bit(e.data);
          enc.input(samples);
          
          let output;
          while (output = enc.output()) {
            output = output.slice();
            postMessage({
              data: output,
              timestamp: 0, // fake
              duration: 1, // fake
            }, [output.buffer]);
          }
        }
      })();
      break;
    }
    case 'decode': {
      onmessage = e => {};
      
      (async () => {
        await libopus.waitForReady();
        const dec = new libopus.Decoder(channelCount, sampleRate);
        onmessage = e => {
          dec.input(e.data);

          let output;
          while (output = dec.output()) {
            const result2 = int16ToFloat32(output);
            postMessage(result2, [result2.buffer]);
          }
        };
      })();
      break;
    }
  }
};