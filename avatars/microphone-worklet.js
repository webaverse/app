const numTicks = 1;

let tick = 0;
let sampleSum = 0;
let numSamples = 0;
let muted = true;
let emitVolume = false;
let emitBuffer = false;

// console.log('load worklet');

class VolumeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // console.log('cons volume processor');

    this.port.addEventListener('message', e => {
      const data = JSON.parse(e.data);
      const {method} = data;
      if (method === 'options') {
        const {args} = data;
        // console.log('worklet got message', {method, args});
        if (args.muted !== undefined) {
          muted = args.muted;
        }
        if (args.emitVolume !== undefined) {
          emitVolume = args.emitVolume;
        }
        if (args.emitBuffer !== undefined) {
          emitBuffer = args.emitBuffer;
        }
      }
    });
    this.port.start();
  }
  process(inputs, outputs) {
    // console.log('got process', inputs, outputs, emitBuffer);
    
    const channels = inputs[0];
    // const output = outputs[0];

    if (emitVolume) {
      {
        const i = 0;
        const samples = channels[i];
        for (let j = 0; j < samples.length; j++) {
          sampleSum += Math.abs(samples[j]);
        }
        numSamples += samples.length;
      }

      if (++tick >= numTicks) {
        const value = sampleSum / numSamples;
        this.port.postMessage({
          method: 'volume',
          data: value,
        });

        tick = 0;
        sampleSum = 0;
        numSamples = 0;
      }
    }

    if (!muted) {
      for (let i = 0; i < outputs.length; i++) {
        const input = inputs[i];
        const output = outputs[i];

        for (let channel = 0; channel < output.length; channel++) {
          // console.log('got output 1', output, input);
          // console.log('got output 2', output[channel], input[channel]);
          output[channel] && input[channel] &&
            output[channel].set(input[channel]);
        }
      }
    }

    if (emitBuffer) {
      const i = 0;
      const samples = channels[i];
      if (samples) {
        this.port.postMessage({
          method: 'buffer',
          data: samples,
        }, [samples.buffer]);
      }
    }

    return true;
  }
}
registerProcessor('volume-processor', VolumeProcessor);