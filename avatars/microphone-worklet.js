const numTicks = 1;

let tick = 0;
let sampleSum = 0;
let numSamples = 0;
let muted = true;
let emitVolume = false;
let emitBuffer = false;

const queue = [];
let queueLength = 0;
const maxQueueLength = 4000;
class VolumeProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.port.addEventListener('message', e => {
      const data = JSON.parse(e.data);
      const {method} = data;
      if (method === 'options') {
        const {args} = data;
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
    const _emitVolume = () => {
      {
        for (const channels of inputs) {
          for (const samples of channels) {
            for (let j = 0; j < samples.length; j++) {
              sampleSum += Math.abs(samples[j]);
            }
            numSamples += samples.length;
          }
        }
      }

      if (++tick >= numTicks) {
        const value = numSamples > 0 ? (sampleSum / numSamples) : 0;
        this.port.postMessage({
          method: 'volume',
          data: value,
        });

        tick = 0;
        sampleSum = 0;
        numSamples = 0;
      }
    };
    emitVolume && _emitVolume();

    // merge the channels
    const sampleLength = (inputs && inputs[0] && inputs[0][0] && inputs[0][0].length) ?? 0;
    if (sampleLength > 0) {
      const _mergeOutput = () => {
        const mergedChannels = Array(2);
        for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
          const mergedChannel = new Float32Array(sampleLength);
          mergedChannels[channelIndex] = mergedChannel;
          
          for (const channels of inputs) {
            for (const samples of channels) {
              for (let j = 0; j < samples.length; j++) {
                mergedChannel[j] += samples[j] / channels.length;
              }
            }
          }
        }

        queue.push(mergedChannels);
        queueLength += sampleLength;

        while (queueLength > maxQueueLength) {
          const channels = queue.shift();
          queueLength -= channels[0].length;
          for (let i = 0; i < outputs.length; i++) {
            const output = outputs[i];
            for (let channelIndex = 0; channelIndex < output.length; channelIndex++) {
              output[channelIndex] && output[channelIndex].set(mergedChannels[channelIndex]);
            }
          }
        }
      };
      !muted && _mergeOutput();

      const _emitBuffer = () => {
        const mergedSamples = new Float32Array(sampleLength);
        for (const channels of inputs) {
          for (const samples of channels) {
            for (let j = 0; j < samples.length; j++) {
              mergedSamples[j] += samples[j] / channels.length;
            }
          }
        }
        this.port.postMessage({
          method: 'buffer',
          data: mergedSamples,
        }, [mergedSamples.buffer]);
      };
      emitBuffer && _emitBuffer();
    }

    return true;
  }
}
registerProcessor('volume-processor', VolumeProcessor);