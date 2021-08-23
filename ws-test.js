window.addEventListener('click', async e => {
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  const audioTracks = mediaStream.getAudioTracks();
  const audioTrack = audioTracks[0];
  const audioTrackSettings = audioTrack.getSettings();
  const audio = (new MediaStreamTrackProcessor(audioTrack)).readable;
  console.log('got media', audioTrack, audioTrack.getSettings(), audio);

  function muxAndSend(encodedChunk) {
    // console.log('got chunk', encodedChunk);
    const r = audioDecoder.decode(encodedChunk);
    console.log('got r', r);
  }
  function onEncoderError(err) {
    console.warn(err);
  }
  function readAndEncode(reader, encoder) {
    reader.read().then((result) => {
      // App handling for stream closure.
      if (result.done) {
        return;
      }

      // Encode!
      encoder.encode(result.value);

      // Keep reading until the stream closes.
      readAndEncode(reader, encoder);
    });
  }

  const audioEncoder = new AudioEncoder({
    output: muxAndSend,
    error: onEncoderError,
  });
  await audioEncoder.configure({
    codec: 'opus',
    numberOfChannels: audioTrackSettings.channelCount,
    sampleRate: audioTrackSettings.sampleRate,
    /* tuning: {
      bitrate: 60_000,
    }, */
  });

  function demuxAndPlay(encodedChunk) {
    console.log('demux encodedChunk', encodedChunk);
  }
  function onDecoderError(err) {
    console.warn(err);
  }

  const audioDecoder = new AudioDecoder({
    output: demuxAndPlay,
    error: onDecoderError,
  });
  await audioDecoder.configure({
    codec: 'opus',
    numberOfChannels: audioTrackSettings.channelCount,
    sampleRate: audioTrackSettings.sampleRate,
    /* tuning: {
      bitrate: 60_000,
    }, */
  });  
  
  readAndEncode(audio.getReader(), audioEncoder);
});