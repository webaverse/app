import protooClient from './protoo-client/build.js';
import mediasoupClient from './mediasoup-client/build.js';
import bowser from './bowser/src/bowser.js';
// import Logger from './Logger.js';
// import { getProtooUrl } from './urlFactory.js';
// import * as cookiesManager from './cookiesManager.js';
// import * as requestActions from './redux/requestActions';
// import * as stateActions from './redux/stateActions';

function deviceInfo() {
  const ua = navigator.userAgent;
  const browser = bowser.getParser(ua);
  let flag;

  if (browser.satisfies({chrome: '>=0', chromium: '>=0'})) flag = 'chrome';
  else if (browser.satisfies({firefox: '>=0'})) flag = 'firefox';
  else if (browser.satisfies({safari: '>=0'})) flag = 'safari';
  else if (browser.satisfies({opera: '>=0'})) flag = 'opera';
  else if (browser.satisfies({'microsoft edge': '>=0'})) flag = 'edge';
  else flag = 'unknown';

  return {
    flag,
    name: browser.getBrowserName(),
    version: browser.getBrowserVersion(),
  };
}
const logger = {
  debug() {
    // console.log(Array.from(arguments).join(','));
  },
  error() {
    console.error(Array.from(arguments).join(','));
  },
};

const ICE_SERVERS = [
  {urls: 'stun:stun.stunprotocol.org:3478'},
  {urls: 'stun:stun1.l.google.com:19302'},
  {urls: 'stun:stun2.l.google.com:19302'},
  {urls: 'stun:stun3.l.google.com:19302'},
  {urls: 'stun:stun4.l.google.com:19302'},
];
const VIDEO_CONSTRAINS = {
  qvga: {width: {ideal: 320}, height: {ideal: 240}},
  vga: {width: {ideal: 640}, height: {ideal: 480}},
  hd: {width: {ideal: 1280}, height: {ideal: 720}},
};

const PC_PROPRIETARY_CONSTRAINTS = {
  optional: [{googDscp: true}],
};

// Used for simulcast webcam video.
const WEBCAM_SIMULCAST_ENCODINGS = [
  {scaleResolutionDownBy: 4, maxBitrate: 500000},
  {scaleResolutionDownBy: 2, maxBitrate: 1000000},
  {scaleResolutionDownBy: 1, maxBitrate: 5000000},
];

// Used for VP9 webcam video.
const WEBCAM_KSVC_ENCODINGS = [{scalabilityMode: 'S3T3_KEY'}];

// Used for simulcast screen sharing.
const SCREEN_SHARING_SIMULCAST_ENCODINGS = [
  {scaleResolutionDownBy: 1, dtx: true, maxBitrate: 1500000},
  {scaleResolutionDownBy: 1, dtx: true, maxBitrate: 6000000},
];

// Used for VP9 screen sharing.
const SCREEN_SHARING_SVC_ENCODINGS = [{scalabilityMode: 'S3T3', dtx: true}];

const EXTERNAL_VIDEO_SRC = '/resources/videos/video-audio-stereo.mp4';

let store;

export default class RoomClient extends EventTarget {
  /**
   * @param  {Object} data
   * @param  {Object} data.store - The Redux store.
   */
  static init(data) {
    store = data.store;
  }

  constructor({
    url,
    // roomId,
    // peerId,
    displayName,
    device = deviceInfo(),
    handlerName,
    useSimulcast,
    useSharingSimulcast,
    forceTcp,
    produce = false,
    consume = false,
    forceH264,
    forceVP9,
    svc,
    datachannel = true,
    externalVideo,
  }) {
    super();

    logger.debug('constructor()', url, displayName, device.flag);

    // Closed flag.
    // @type {Boolean}
    this._closed = false;

    // Display name.
    // @type {String}
    this._displayName = displayName;

    // Device info.
    // @type {Object}
    this._device = device;

    // Whether we want to force RTC over TCP.
    // @type {Boolean}
    this._forceTcp = forceTcp;

    // Whether we want to produce audio/video.
    // @type {Boolean}
    this._produce = produce;

    // Whether we should consume.
    // @type {Boolean}
    this._consume = consume;

    // Whether we want DataChannels.
    // @type {Boolean}
    this._useDataChannel = datachannel;

    // Force H264 codec for sending.
    this._forceH264 = Boolean(forceH264);

    // Force VP9 codec for sending.
    this._forceVP9 = Boolean(forceVP9);

    // External video.
    // @type {HTMLVideoElement}
    this._externalVideo = null;

    // MediaStream of the external video.
    // @type {MediaStream}
    this._externalVideoStream = null;

    // Next expected dataChannel test number.
    // @type {Number}
    this._nextDataChannelTestNumber = 0;

    if (externalVideo) {
      this._externalVideo = document.createElement('video');

      this._externalVideo.controls = true;
      this._externalVideo.muted = true;
      this._externalVideo.loop = true;
      this._externalVideo.setAttribute('playsinline', '');
      this._externalVideo.src = EXTERNAL_VIDEO_SRC;

      this._externalVideo
        .play()
        .catch((error) => logger.warn('externalVideo.play() failed:%o', error));
    }

    // Custom mediasoup-client handler name (to override default browser
    // detection if desired).
    // @type {String}
    this._handlerName = handlerName;

    // Whether simulcast should be used.
    // @type {Boolean}
    this._useSimulcast = useSimulcast;

    // Whether simulcast should be used in desktop sharing.
    // @type {Boolean}
    this._useSharingSimulcast = useSharingSimulcast;

    // Protoo URL.
    // @type {String}
    this._protooUrl = url;

    // protoo-client Peer instance.
    // @type {protooClient.Peer}
    this._protoo = null;

    // mediasoup-client Device instance.
    // @type {mediasoupClient.Device}
    this._mediasoupDevice = null;

    // mediasoup Transport for sending.
    // @type {mediasoupClient.Transport}
    this._sendTransport = null;

    // mediasoup Transport for receiving.
    // @type {mediasoupClient.Transport}
    this._recvTransport = null;

    // Local mic mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._micProducer = null;

    // Local webcam mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._webcamProducer = null;

    // Local share mediasoup Producer.
    // @type {mediasoupClient.Producer}
    this._shareProducer = null;

    // Local chat DataProducer.
    // @type {mediasoupClient.DataProducer}
    this._chatDataProducer = null;

    // Local bot DataProducer.
    // @type {mediasoupClient.DataProducer}
    this._botDataProducer = null;

    // mediasoup Consumers.
    // @type {Map<String, mediasoupClient.Consumer>}
    this._consumers = new Map();

    // mediasoup DataConsumers.
    // @type {Map<String, mediasoupClient.DataConsumer>}
    this._dataConsumers = new Map();

    // Map of webcam MediaDeviceInfos indexed by deviceId.
    // @type {Map<String, MediaDeviceInfos>}
    this._webcams = new Map();

    // Local Webcam.
    // @type {Object} with:
    // - {MediaDeviceInfo} [device]
    // - {String} [resolution] - 'qvga' / 'vga' / 'hd'.
    this._webcam = {
      device: null,
      resolution: 'hd',
    };

    // Set custom SVC scalability mode.
    if (svc) {
      WEBCAM_KSVC_ENCODINGS[0].scalabilityMode = `${svc}_KEY`;
      SCREEN_SHARING_SVC_ENCODINGS[0].scalabilityMode = svc;
    }
  }

  close() {
    if (this._closed) return;

    this._closed = true;

    logger.debug('close()');

    // Close protoo Peer
    this._protoo.close();

    // Close mediasoup Transports.
    if (this._sendTransport) this._sendTransport.close();

    if (this._recvTransport) this._recvTransport.close();
  }

  join() {
    return new Promise((resolve, reject) => {
      const protooTransport = new protooClient.WebSocketTransport(
        this._protooUrl,
      );

      this._protoo = new protooClient.Peer(protooTransport);

      this._protoo.on('open', () => {
        this._joinRoom().then(resolve, reject);
      });

      this._protoo.on('failed', () => {
        console.warn({
          type: 'error',
          text: 'WebSocket connection failed',
        });
        reject(new Error('protoo connection failed'));
      });

      this._protoo.on('disconnected', () => {
        console.log({
          type: 'error',
          text: 'WebSocket disconnected',
        });

        // Close mediasoup Transports.
        if (this._sendTransport) {
          this._sendTransport.close();
          this._sendTransport = null;
        }

        if (this._recvTransport) {
          this._recvTransport.close();
          this._recvTransport = null;
        }
      });

      this._protoo.on('close', () => {
        if (this._closed) return;

        this.close();
      });

      // eslint-disable-next-line no-unused-vars
      this._protoo.on('request', async (request, accept, reject) => {
        logger.debug(
          'proto "request" event [method:%s, data:%o]',
          request.method,
          request.data,
        );

        switch (request.method) {
          case 'newConsumer': {
            if (!this._consume) {
              reject(403, 'I do not want to consume');

              break;
            }

            const {peerId, producerId, id, kind, appData} = request.data;

            try {
              const consumer = await this._recvTransport.consume({
                id,
                producerId,
                kind,
                rtpParameters, // this is undefined
                appData: {...appData, peerId}, // Trick.
              });

              // Store in the map.
              this._consumers.set(consumer.id, consumer);

              consumer.on('transportclose', () => {
                this._consumers.delete(consumer.id);

                this.dispatchEvent(
                  new MessageEvent('removereceivestream', {
                    data: {
                      peerId,
                      consumer,
                      appData,
                    },
                  }),
                );
              });

              mediasoupClient.parseScalabilityMode(
                consumer.rtpParameters.encodings[0].scalabilityMode,
              );

              // We are ready. Answer the protoo request so the server will
              // resume this Consumer (which was paused for now if video).
              accept();

              // If audio-only mode is enabled, pause it.

              this.dispatchEvent(
                new MessageEvent('addreceivestream', {
                  data: {
                    peerId,
                    consumer,
                    appData,
                  },
                }),
              );
            } catch (error) {
              logger.error('"newConsumer" request failed:%o', error);

              throw error;
            }

            break;
          }

          case 'newDataConsumer': {
            if (!this._consume) {
              reject(403, 'I do not want to data consume');

              break;
            }

            if (!this._useDataChannel) {
              reject(403, 'I do not want DataChannels');

              break;
            }

            const {
              peerId, // NOTE: Null if bot.
              dataProducerId,
              id,
              sctpStreamParameters,
              label,
              protocol,
              appData,
            } = request.data;

            try {
              const dataConsumer = await this._recvTransport.consumeData({
                id,
                dataProducerId,
                sctpStreamParameters,
                label,
                protocol,
                // appData : { ...appData, peerId } // Trick.
              });

              // Store in the map.
              this._dataConsumers.set(dataConsumer.id, dataConsumer);

              dataConsumer.on('transportclose', () => {
                this._dataConsumers.delete(dataConsumer.id);
              });

              dataConsumer.on('open', () => {
                logger.debug('DataConsumer "open" event');

                this.dispatchEvent(
                  new MessageEvent('addreceive', {
                    data: {
                      peerId,
                      label,
                      dataConsumer,
                      appData,
                    },
                  }),
                );
              });

              dataConsumer.on('close', () => {
                logger.warn('DataConsumer "close" event');

                this._dataConsumers.delete(dataConsumer.id);

                this.dispatchEvent(
                  new MessageEvent('removereceive', {
                    data: {
                      peerId,
                      label,
                      dataConsumer,
                      appData,
                    },
                  }),
                );
              });

              dataConsumer.on('error', (error) => {
                logger.error('DataConsumer "error" event:%o', error);
              });

              dataConsumer.on('message', (message) => {
                logger.debug(
                  'DataConsumer "message" event [streamId:%d]',
                  dataConsumer.sctpStreamParameters.streamId,
                );
              });

              // TODO: REMOVE
              window.DC = dataConsumer;

              // We are ready. Answer the protoo request.
              accept();
            } catch (error) {
              logger.error('"newDataConsumer" request failed:%o', error);

              throw error;
            }

            break;
          }
        }
      });

      this._protoo.on('notification', (notification) => {
        // console.log('got notification', notification, notification.method);

        logger.debug(
          'proto "notification" event [method:%s, data:%o]',
          notification.method,
          notification.data,
        );

        switch (notification.method) {
          case 'producerScore': {
            const {producerId, score} = notification.data;

            break;
          }

          case 'newPeer': {
            this.dispatchEvent(
              new MessageEvent(notification.method, {
                data: notification.data,
              }),
            );

            break;
          }

          case 'peerClosed': {
            this.dispatchEvent(
              new MessageEvent(notification.method, {
                data: notification.data,
              }),
            );

            break;
          }

          case 'peerDisplayNameChanged': {
            break;
          }

          case 'downlinkBwe': {
            logger.debug("'downlinkBwe' event:%o", notification.data);

            break;
          }

          case 'consumerClosed': {
            const {consumerId} = notification.data;
            const consumer = this._consumers.get(consumerId);

            if (!consumer) break;

            consumer.close();
            this._consumers.delete(consumerId);

            break;
          }

          case 'consumerPaused': {
            const {consumerId} = notification.data;
            const consumer = this._consumers.get(consumerId);

            if (!consumer) break;

            consumer.pause();

            break;
          }

          case 'consumerResumed': {
            const {consumerId} = notification.data;
            const consumer = this._consumers.get(consumerId);

            if (!consumer) break;

            consumer.resume();

            break;
          }

          case 'consumerLayersChanged': {
            const {consumerId, spatialLayer, temporalLayer} = notification.data;
            const consumer = this._consumers.get(consumerId);

            if (!consumer) break;

            break;
          }

          case 'consumerScore': {
            const {consumerId, score} = notification.data;

            break;
          }

          case 'dataConsumerClosed': {
            const {dataConsumerId} = notification.data;
            const dataConsumer = this._dataConsumers.get(dataConsumerId);

            if (!dataConsumer) break;

            dataConsumer.close();
            this._dataConsumers.delete(dataConsumerId);

            const {peerId} = dataConsumer.appData;

            break;
          }

          case 'activeSpeaker': {
            const {peerId} = notification.data;

            break;
          }

          case 'initState':
          case 'updateState':
          case 'status':
          case 'pose':
          case 'chat': {
            this.dispatchEvent(
              new MessageEvent(notification.method, {
                data: notification.data,
              }),
            );

            break;
          }

          default: {
            logger.error(
              'unknown protoo notification.method "%s"',
              notification.method,
            );
          }
        }
      });
    });
  }

  async enableMic(mediaStream) {
    logger.debug('enableMic()');

    if (this._micProducer) return;

    let track;

    try {
      track = mediaStream.getAudioTracks()[0];

      this._micProducer = await this._sendTransport.produce({
        track,
        codecOptions: {
          opusStereo: 1,
          opusDtx: 1,
        },
        // NOTE: for testing codec selection.
        // codec : this._mediasoupDevice.rtpCapabilities.codecs
        // 	.find((codec) => codec.mimeType.toLowerCase() === 'audio/pcma')
      });

      this._micProducer.on('transportclose', () => {
        this._micProducer = null;
      });

      this._micProducer.on('trackended', () => {
        this.disableMic().catch(() => {});
      });
    } catch (error) {
      logger.error('enableMic() | failed:%o', error);

      if (track) track.stop();
    }
  }

  async disableMic() {
    logger.debug('disableMic()');

    if (!this._micProducer) return;

    this._micProducer.close();

    /* store.dispatch(
			stateActions.removeProducer(this._micProducer.id)); */

    try {
      await this._protoo.request('closeProducer', {
        producerId: this._micProducer.id,
      });
    } catch (error) {}

    this._micProducer = null;
  }

  async muteMic() {
    logger.debug('muteMic()');

    this._micProducer.pause();

    try {
      await this._protoo.request('pauseProducer', {
        producerId: this._micProducer.id,
      });

      store.dispatch(stateActions.setProducerPaused(this._micProducer.id));
    } catch (error) {
      logger.error('muteMic() | failed: %o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error pausing server-side mic Producer: ${error}`,
        }),
      );
    }
  }

  async unmuteMic() {
    logger.debug('unmuteMic()');

    this._micProducer.resume();

    try {
      await this._protoo.request('resumeProducer', {
        producerId: this._micProducer.id,
      });

      store.dispatch(stateActions.setProducerResumed(this._micProducer.id));
    } catch (error) {
      logger.error('unmuteMic() | failed: %o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error resuming server-side mic Producer: ${error}`,
        }),
      );
    }
  }

  async enableWebcam() {
    logger.debug('enableWebcam()');

    if (this._webcamProducer) return;
    else if (this._shareProducer) await this.disableShare();

    if (!this._mediasoupDevice.canProduce('video')) {
      logger.error('enableWebcam() | cannot produce video');

      return;
    }

    let track;
    let device;

    /* store.dispatch(
			stateActions.setWebcamInProgress(true)); */

    try {
      if (!this._externalVideo) {
        await this._updateWebcams();
        device = this._webcam.device;

        const {resolution} = this._webcam;

        if (!device) throw new Error('no webcam devices');

        logger.debug('enableWebcam() | calling getUserMedia()');

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: {ideal: device.deviceId},
            ...VIDEO_CONSTRAINS[resolution],
          },
        });

        track = stream.getVideoTracks()[0];
      } else {
        device = {label: 'external video'};

        const stream = await this._getExternalVideoStream();

        track = stream.getVideoTracks()[0].clone();
      }

      let encodings;
      let codec;
      const codecOptions = {
        videoGoogleStartBitrate: 1000,
      };

      if (this._forceH264) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === 'video/h264',
        );

        if (!codec) {
          throw new Error('desired H264 codec+configuration is not supported');
        }
      } else if (this._forceVP9) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === 'video/vp9',
        );

        if (!codec) {
          throw new Error('desired VP9 codec+configuration is not supported');
        }
      }

      if (this._useSimulcast) {
        // If VP9 is the only available video codec then use SVC.
        const firstVideoCodec =
          this._mediasoupDevice.rtpCapabilities.codecs.find(
            (c) => c.kind === 'video',
          );

        if (
          (this._forceVP9 && codec) ||
          firstVideoCodec.mimeType.toLowerCase() === 'video/vp9'
        ) {
          encodings = WEBCAM_KSVC_ENCODINGS;
        } else {
          encodings = WEBCAM_SIMULCAST_ENCODINGS;
        }
      }

      this._webcamProducer = await this._sendTransport.produce({
        track,
        encodings,
        codecOptions,
        codec,
      });

      /* store.dispatch(stateActions.addProducer(
				{
					id            : this._webcamProducer.id,
					deviceLabel   : device.label,
					type          : this._getWebcamType(device),
					paused        : this._webcamProducer.paused,
					track         : this._webcamProducer.track,
					rtpParameters : this._webcamProducer.rtpParameters,
					codec         : this._webcamProducer.rtpParameters.codecs[0].mimeType.split('/')[1]
				})); */

      this._webcamProducer.on('transportclose', () => {
        this._webcamProducer = null;
      });

      this._webcamProducer.on('trackended', () => {
        store.dispatch(
          requestActions.notify({
            type: 'error',
            text: 'Webcam disconnected!',
          }),
        );

        this.disableWebcam().catch(() => {});
      });
    } catch (error) {
      logger.error('enableWebcam() | failed:%o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error enabling webcam: ${error}`,
        }),
      );

      if (track) track.stop();
    }

    /* store.dispatch(
			stateActions.setWebcamInProgress(false)); */
  }

  async disableWebcam() {
    logger.debug('disableWebcam()');

    if (!this._webcamProducer) return;

    this._webcamProducer.close();

    store.dispatch(stateActions.removeProducer(this._webcamProducer.id));

    try {
      await this._protoo.request('closeProducer', {
        producerId: this._webcamProducer.id,
      });
    } catch (error) {
      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error closing server-side webcam Producer: ${error}`,
        }),
      );
    }

    this._webcamProducer = null;
  }

  async changeWebcam() {
    logger.debug('changeWebcam()');

    store.dispatch(stateActions.setWebcamInProgress(true));

    try {
      await this._updateWebcams();

      const array = Array.from(this._webcams.keys());
      const len = array.length;
      const deviceId = this._webcam.device
        ? this._webcam.device.deviceId
        : undefined;
      let idx = array.indexOf(deviceId);

      if (idx < len - 1) idx++;
      else idx = 0;

      this._webcam.device = this._webcams.get(array[idx]);

      logger.debug(
        'changeWebcam() | new selected webcam [device:%o]',
        this._webcam.device,
      );

      // Reset video resolution to HD.
      this._webcam.resolution = 'hd';

      if (!this._webcam.device) throw new Error('no webcam devices');

      // Closing the current video track before asking for a new one (mobiles do not like
      // having both front/back cameras open at the same time).
      this._webcamProducer.track.stop();

      logger.debug('changeWebcam() | calling getUserMedia()');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: {exact: this._webcam.device.deviceId},
          ...VIDEO_CONSTRAINS[this._webcam.resolution],
        },
      });

      const track = stream.getVideoTracks()[0];

      await this._webcamProducer.replaceTrack({track});

      store.dispatch(
        stateActions.setProducerTrack(this._webcamProducer.id, track),
      );
    } catch (error) {
      logger.error('changeWebcam() | failed: %o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Could not change webcam: ${error}`,
        }),
      );
    }

    store.dispatch(stateActions.setWebcamInProgress(false));
  }

  async changeWebcamResolution() {
    logger.debug('changeWebcamResolution()');

    store.dispatch(stateActions.setWebcamInProgress(true));

    try {
      switch (this._webcam.resolution) {
        case 'qvga':
          this._webcam.resolution = 'vga';
          break;
        case 'vga':
          this._webcam.resolution = 'hd';
          break;
        case 'hd':
          this._webcam.resolution = 'qvga';
          break;
        default:
          this._webcam.resolution = 'hd';
      }

      logger.debug('changeWebcamResolution() | calling getUserMedia()');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: {exact: this._webcam.device.deviceId},
          ...VIDEO_CONSTRAINS[this._webcam.resolution],
        },
      });

      const track = stream.getVideoTracks()[0];

      await this._webcamProducer.replaceTrack({track});

      store.dispatch(
        stateActions.setProducerTrack(this._webcamProducer.id, track),
      );
    } catch (error) {
      logger.error('changeWebcamResolution() | failed: %o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Could not change webcam resolution: ${error}`,
        }),
      );
    }

    store.dispatch(stateActions.setWebcamInProgress(false));
  }

  async enableShare() {
    logger.debug('enableShare()');

    if (this._shareProducer) return;
    else if (this._webcamProducer) await this.disableWebcam();

    if (!this._mediasoupDevice.canProduce('video')) {
      logger.error('enableShare() | cannot produce video');

      return;
    }

    let track;

    store.dispatch(stateActions.setShareInProgress(true));

    try {
      logger.debug('enableShare() | calling getUserMedia()');

      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
          displaySurface: 'monitor',
          logicalSurface: true,
          cursor: true,
          width: {max: 1920},
          height: {max: 1080},
          frameRate: {max: 30},
        },
      });

      // May mean cancelled (in some implementations).
      if (!stream) {
        store.dispatch(stateActions.setShareInProgress(true));

        return;
      }

      track = stream.getVideoTracks()[0];

      let encodings;
      let codec;
      const codecOptions = {
        videoGoogleStartBitrate: 1000,
      };

      if (this._forceH264) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === 'video/h264',
        );

        if (!codec) {
          throw new Error('desired H264 codec+configuration is not supported');
        }
      } else if (this._forceVP9) {
        codec = this._mediasoupDevice.rtpCapabilities.codecs.find(
          (c) => c.mimeType.toLowerCase() === 'video/vp9',
        );

        if (!codec) {
          throw new Error('desired VP9 codec+configuration is not supported');
        }
      }

      if (this._useSharingSimulcast) {
        // If VP9 is the only available video codec then use SVC.
        const firstVideoCodec =
          this._mediasoupDevice.rtpCapabilities.codecs.find(
            (c) => c.kind === 'video',
          );

        if (
          (this._forceVP9 && codec) ||
          firstVideoCodec.mimeType.toLowerCase() === 'video/vp9'
        ) {
          encodings = SCREEN_SHARING_SVC_ENCODINGS;
        } else {
          encodings = SCREEN_SHARING_SIMULCAST_ENCODINGS.map((encoding) => ({
            ...encoding,
            dtx: true,
          }));
        }
      }

      this._shareProducer = await this._sendTransport.produce({
        track,
        encodings,
        codecOptions,
        codec,
        appData: {
          share: true,
        },
      });

      store.dispatch(
        stateActions.addProducer({
          id: this._shareProducer.id,
          type: 'share',
          paused: this._shareProducer.paused,
          track: this._shareProducer.track,
          rtpParameters: this._shareProducer.rtpParameters,
          codec:
            this._shareProducer.rtpParameters.codecs[0].mimeType.split('/')[1],
        }),
      );

      this._shareProducer.on('transportclose', () => {
        this._shareProducer = null;
      });

      this._shareProducer.on('trackended', () => {
        store.dispatch(
          requestActions.notify({
            type: 'error',
            text: 'Share disconnected!',
          }),
        );

        this.disableShare().catch(() => {});
      });
    } catch (error) {
      logger.error('enableShare() | failed:%o', error);

      if (error.name !== 'NotAllowedError') {
        store.dispatch(
          requestActions.notify({
            type: 'error',
            text: `Error sharing: ${error}`,
          }),
        );
      }

      if (track) track.stop();
    }

    store.dispatch(stateActions.setShareInProgress(false));
  }

  async disableShare() {
    logger.debug('disableShare()');

    if (!this._shareProducer) return;

    this._shareProducer.close();

    store.dispatch(stateActions.removeProducer(this._shareProducer.id));

    try {
      await this._protoo.request('closeProducer', {
        producerId: this._shareProducer.id,
      });
    } catch (error) {
      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error closing server-side share Producer: ${error}`,
        }),
      );
    }

    this._shareProducer = null;
  }

  async enableAudioOnly() {
    logger.debug('enableAudioOnly()');

    store.dispatch(stateActions.setAudioOnlyInProgress(true));

    this.disableWebcam();

    for (const consumer of this._consumers.values()) {
      if (consumer.kind !== 'video') continue;

      this._pauseConsumer(consumer);
    }

    store.dispatch(stateActions.setAudioOnlyState(true));

    store.dispatch(stateActions.setAudioOnlyInProgress(false));
  }

  async disableAudioOnly() {
    logger.debug('disableAudioOnly()');

    store.dispatch(stateActions.setAudioOnlyInProgress(true));

    if (
      !this._webcamProducer &&
      this._produce /* &&
			(cookiesManager.getDevices() || {}).webcamEnabled */
    ) {
      this.enableWebcam();
    }

    for (const consumer of this._consumers.values()) {
      if (consumer.kind !== 'video') continue;

      this._resumeConsumer(consumer);
    }

    store.dispatch(stateActions.setAudioOnlyState(false));

    store.dispatch(stateActions.setAudioOnlyInProgress(false));
  }

  async muteAudio() {
    logger.debug('muteAudio()');

    store.dispatch(stateActions.setAudioMutedState(true));
  }

  async unmuteAudio() {
    logger.debug('unmuteAudio()');

    store.dispatch(stateActions.setAudioMutedState(false));
  }

  setState(key, value) {
    if (this._closed) return;

    this._protoo.notify('setState', {
      key,
      value,
    });
  }

  deleteState(key, value) {
    if (this._closed) return;

    this._protoo.notify('deleteState', {
      key,
    });
  }

  async restartIce() {
    logger.debug('restartIce()');

    store.dispatch(stateActions.setRestartIceInProgress(true));

    try {
      if (this._sendTransport) {
        const iceParameters = await this._protoo.request('restartIce', {
          transportId: this._sendTransport.id,
        });

        await this._sendTransport.restartIce({iceParameters});
      }

      if (this._recvTransport) {
        const iceParameters = await this._protoo.request('restartIce', {
          transportId: this._recvTransport.id,
        });

        await this._recvTransport.restartIce({iceParameters});
      }

      store.dispatch(
        requestActions.notify({
          text: 'ICE restarted',
        }),
      );
    } catch (error) {
      logger.error('restartIce() | failed:%o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `ICE restart failed: ${error}`,
        }),
      );
    }

    store.dispatch(stateActions.setRestartIceInProgress(false));
  }

  async setMaxSendingSpatialLayer(spatialLayer) {
    logger.debug('setMaxSendingSpatialLayer() [spatialLayer:%s]', spatialLayer);

    try {
      if (this._webcamProducer) {
        await this._webcamProducer.setMaxSpatialLayer(spatialLayer);
      } else if (this._shareProducer) {
        await this._shareProducer.setMaxSpatialLayer(spatialLayer);
      }
    } catch (error) {
      logger.error('setMaxSendingSpatialLayer() | failed:%o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error setting max sending video spatial layer: ${error}`,
        }),
      );
    }
  }

  async setConsumerPreferredLayers(consumerId, spatialLayer, temporalLayer) {
    logger.debug(
      'setConsumerPreferredLayers() [consumerId:%s, spatialLayer:%s, temporalLayer:%s]',
      consumerId,
      spatialLayer,
      temporalLayer,
    );

    try {
      await this._protoo.request('setConsumerPreferredLayers', {
        consumerId,
        spatialLayer,
        temporalLayer,
      });

      store.dispatch(
        stateActions.setConsumerPreferredLayers(
          consumerId,
          spatialLayer,
          temporalLayer,
        ),
      );
    } catch (error) {
      logger.error('setConsumerPreferredLayers() | failed:%o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error setting Consumer preferred layers: ${error}`,
        }),
      );
    }
  }

  async setConsumerPriority(consumerId, priority) {
    logger.debug(
      'setConsumerPriority() [consumerId:%s, priority:%d]',
      consumerId,
      priority,
    );

    try {
      await this._protoo.request('setConsumerPriority', {consumerId, priority});

      store.dispatch(stateActions.setConsumerPriority(consumerId, priority));
    } catch (error) {
      logger.error('setConsumerPriority() | failed:%o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error setting Consumer priority: ${error}`,
        }),
      );
    }
  }

  async requestConsumerKeyFrame(consumerId) {
    logger.debug('requestConsumerKeyFrame() [consumerId:%s]', consumerId);

    try {
      await this._protoo.request('requestConsumerKeyFrame', {consumerId});

      store.dispatch(
        requestActions.notify({
          text: 'Keyframe requested for video consumer',
        }),
      );
    } catch (error) {
      logger.error('requestConsumerKeyFrame() | failed:%o', error);

      store.dispatch(
        requestActions.notify({
          type: 'error',
          text: `Error requesting key frame for Consumer: ${error}`,
        }),
      );
    }
  }

  async enableChatDataProducer(appData = {}) {
    logger.debug('enableChatDataProducer()');

    if (!this._useDataChannel) return;

    try {
      // Create chat DataProducer.
      this._chatDataProducer = await this._sendTransport.produceData({
        ordered: true, // false,
        // maxRetransmits : 1,
        label: 'chat',
        priority: 'medium',
        appData,
        // appData        : { info: 'my-chat-DataProducer' }
      });

      this._chatDataProducer.on('transportclose', () => {
        this._chatDataProducer = null;
      });

      this._chatDataProducer.on('open', () => {
        logger.debug('chat DataProducer "open" event');
      });

      this._chatDataProducer.on('close', () => {
        logger.error('chat DataProducer "close" event');

        const {_chatDataProducer} = this;
        this._chatDataProducer = null;

        this.dispatchEvent(
          new MessageEvent('removesend', {
            data: {
              dataProducer: _chatDataProducer,
            },
          }),
        );
      });

      this._chatDataProducer.on('error', (error) => {
        logger.error('chat DataProducer "error" event:%o', error);
      });

      this._chatDataProducer.on('bufferedamountlow', () => {
        logger.debug('chat DataProducer "bufferedamountlow" event');
      });

      this.dispatchEvent(
        new MessageEvent('addsend', {
          data: {
            dataProducer: this._chatDataProducer,
          },
        }),
      );
    } catch (error) {
      logger.error('enableChatDataProducer() | failed:%o', error);

      throw error;
    }
  }

  async enableBotDataProducer() {
    logger.debug('enableBotDataProducer()');

    if (!this._useDataChannel) return;

    try {
      // Create chat DataProducer.
      this._botDataProducer = await this._sendTransport.produceData({
        ordered: true, // false,
        // maxPacketLifeTime : 2000,
        label: 'bot',
        priority: 'medium',
        appData: {info: 'my-bot-DataProducer'},
      });

      this._botDataProducer.on('transportclose', () => {
        this._botDataProducer = null;
      });

      this._botDataProducer.on('open', () => {
        logger.debug('bot DataProducer "open" event');
      });

      this._botDataProducer.on('close', () => {
        logger.error('bot DataProducer "close" event');

        this._botDataProducer = null;
      });

      this._botDataProducer.on('error', (error) => {
        logger.error('bot DataProducer "error" event:%o', error);
      });

      this._botDataProducer.on('bufferedamountlow', () => {
        logger.debug('bot DataProducer "bufferedamountlow" event');
      });
    } catch (error) {
      logger.error('enableBotDataProducer() | failed:%o', error);

      throw error;
    }
  }

  async sendChatMessage(text) {
    logger.debug('sendChatMessage() [text:"%s]', text);

    if (!this._chatDataProducer) {
      return;
    }

    try {
      this._chatDataProducer.send(text);
    } catch (error) {
      logger.error('chat DataProducer.send() failed:%o', error);
    }
  }

  async sendBotMessage(text) {
    logger.debug('sendBotMessage() [text:"%s]', text);

    if (!this._botDataProducer) {
      return;
    }

    try {
      this._botDataProducer.send(text);
    } catch (error) {
      logger.error('bot DataProducer.send() failed:%o', error);
    }
  }

  async changeDisplayName(displayName) {
    logger.debug('changeDisplayName() [displayName:"%s"]', displayName);

    // Store in cookie.
    // cookiesManager.setUser({ displayName });

    try {
      await this._protoo.request('changeDisplayName', {displayName});

      this._displayName = displayName;
    } catch (error) {
      logger.error('changeDisplayName() | failed: %o', error);
    }
  }

  async getSendTransportRemoteStats() {
    logger.debug('getSendTransportRemoteStats()');

    if (!this._sendTransport) return;

    return this._protoo.request('getTransportStats', {
      transportId: this._sendTransport.id,
    });
  }

  async getRecvTransportRemoteStats() {
    logger.debug('getRecvTransportRemoteStats()');

    if (!this._recvTransport) return;

    return this._protoo.request('getTransportStats', {
      transportId: this._recvTransport.id,
    });
  }

  async getAudioRemoteStats() {
    logger.debug('getAudioRemoteStats()');

    if (!this._micProducer) return;

    return this._protoo.request('getProducerStats', {
      producerId: this._micProducer.id,
    });
  }

  async getVideoRemoteStats() {
    logger.debug('getVideoRemoteStats()');

    const producer = this._webcamProducer || this._shareProducer;

    if (!producer) return;

    return this._protoo.request('getProducerStats', {producerId: producer.id});
  }

  async getConsumerRemoteStats(consumerId) {
    logger.debug('getConsumerRemoteStats()');

    const consumer = this._consumers.get(consumerId);

    if (!consumer) return;

    return this._protoo.request('getConsumerStats', {consumerId});
  }

  async getChatDataProducerRemoteStats() {
    logger.debug('getChatDataProducerRemoteStats()');

    const dataProducer = this._chatDataProducer;

    if (!dataProducer) return;

    return this._protoo.request('getDataProducerStats', {
      dataProducerId: dataProducer.id,
    });
  }

  async getBotDataProducerRemoteStats() {
    logger.debug('getBotDataProducerRemoteStats()');

    const dataProducer = this._botDataProducer;

    if (!dataProducer) return;

    return this._protoo.request('getDataProducerStats', {
      dataProducerId: dataProducer.id,
    });
  }

  async getDataConsumerRemoteStats(dataConsumerId) {
    logger.debug('getDataConsumerRemoteStats()');

    const dataConsumer = this._dataConsumers.get(dataConsumerId);

    if (!dataConsumer) return;

    return this._protoo.request('getDataConsumerStats', {dataConsumerId});
  }

  async getSendTransportLocalStats() {
    logger.debug('getSendTransportLocalStats()');

    if (!this._sendTransport) return;

    return this._sendTransport.getStats();
  }

  async getRecvTransportLocalStats() {
    logger.debug('getRecvTransportLocalStats()');

    if (!this._recvTransport) return;

    return this._recvTransport.getStats();
  }

  async getAudioLocalStats() {
    logger.debug('getAudioLocalStats()');

    if (!this._micProducer) return;

    return this._micProducer.getStats();
  }

  async getVideoLocalStats() {
    logger.debug('getVideoLocalStats()');

    const producer = this._webcamProducer || this._shareProducer;

    if (!producer) return;

    return producer.getStats();
  }

  async getConsumerLocalStats(consumerId) {
    const consumer = this._consumers.get(consumerId);

    if (!consumer) return;

    return consumer.getStats();
  }

  async applyNetworkThrottle({uplink, downlink, rtt, secret}) {
    logger.debug(
      'applyNetworkThrottle() [uplink:%s, downlink:%s, rtt:%s]',
      uplink,
      downlink,
      rtt,
    );

    try {
      await this._protoo.request('applyNetworkThrottle', {
        uplink,
        downlink,
        rtt,
        secret,
      });
    } catch (error) {
      logger.error('applyNetworkThrottle() | failed:%o', error);
    }
  }

  async resetNetworkThrottle({silent = false, secret}) {
    logger.debug('resetNetworkThrottle()');

    try {
      await this._protoo.request('resetNetworkThrottle', {secret});
    } catch (error) {
      if (!silent) {
        logger.error('resetNetworkThrottle() | failed:%o', error);
      }
    }
  }

  async _joinRoom() {
    logger.debug('_joinRoom()');

    try {
      // Join now into the room.
      // NOTE: Don't send our RTP capabilities if we don't want to consume.
      await this._protoo.request('join', {
        displayName: this._displayName,
        device: this._device,
        rtpCapabilities: undefined,
        sctpCapabilities: undefined,
      });

      this.dispatchEvent(
        new MessageEvent('join', {
          data: {
            // peerId: me.id,
          },
        }),
      );
    } catch (error) {
      logger.error('_joinRoom() failed:%o', error);

      this.close();
    }
  }

  async _updateWebcams() {
    logger.debug('_updateWebcams()');

    // Reset the list.
    this._webcams = new Map();

    logger.debug('_updateWebcams() | calling enumerateDevices()');

    const devices = await navigator.mediaDevices.enumerateDevices();

    for (const device of devices) {
      if (device.kind !== 'videoinput') continue;

      this._webcams.set(device.deviceId, device);
    }

    const array = Array.from(this._webcams.values());
    const len = array.length;
    const currentWebcamId = this._webcam.device
      ? this._webcam.device.deviceId
      : undefined;

    logger.debug('_updateWebcams() [webcams:%o]', array);

    if (len === 0) this._webcam.device = null;
    else if (!this._webcams.has(currentWebcamId)) {
      this._webcam.device = array[0];
    }
  }

  _getWebcamType(device) {
    if (/(back|rear)/i.test(device.label)) {
      logger.debug('_getWebcamType() | it seems to be a back camera');

      return 'back';
    } else {
      logger.debug('_getWebcamType() | it seems to be a front camera');

      return 'front';
    }
  }

  async _pauseConsumer(consumer) {
    if (consumer.paused) return;

    try {
      await this._protoo.request('pauseConsumer', {consumerId: consumer.id});

      consumer.pause();
    } catch (error) {
      logger.error('_pauseConsumer() | failed:%o', error);
    }
  }

  async _resumeConsumer(consumer) {
    if (!consumer.paused) return;

    try {
      await this._protoo.request('resumeConsumer', {consumerId: consumer.id});

      consumer.resume();
    } catch (error) {
      logger.error('_resumeConsumer() | failed:%o', error);
    }
  }

  async _getExternalVideoStream() {
    if (this._externalVideoStream) return this._externalVideoStream;

    if (this._externalVideo.readyState < 3) {
      await new Promise((resolve) =>
        this._externalVideo.addEventListener('canplay', resolve),
      );
    }

    if (this._externalVideo.captureStream) {
      this._externalVideoStream = this._externalVideo.captureStream();
    } else if (this._externalVideo.mozCaptureStream) {
      this._externalVideoStream = this._externalVideo.mozCaptureStream();
    } else throw new Error('video.captureStream() not supported');

    return this._externalVideoStream;
  }
}
