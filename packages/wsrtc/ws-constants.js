export const channelCount = 1;
export const sampleRate = 48000;
export const bitrate = 60000;
export const frameSize = 20;
export const voiceOptimization = true;
// export const metadataPrefix = 'metadata';
// export const roomEntitiesPrefix = 'entities';
export const MESSAGE = (() => {
  let i = 1;
  return {
    INIT: i++,
    AUDIO: i++,
    STATE_UPDATE: i++,
    STATE_REFRESH: i++,
  };
})();
export const TYPE = (() => {
  let i = 1;
  return {
    INT: i++,
    FLOAT: i++,
    STRING: i++,
    UINT32ARRAY: i++,
    FLOAT32ARRAY: i++,
    UINT8ARRAY: i++,
  };
})();