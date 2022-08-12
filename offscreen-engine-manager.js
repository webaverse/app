import {
  OffscreenEngineProxy,
  // OffscreenEngineDirect,
} from './offscreen-engine.js';

// const isOffscreenEngine = location.pathname === '/engine.html';
// const offscreenEngineManager = isOffscreenEngine ? new OffscreenEngineDirect() : new OffscreenEngineProxy();
const offscreenEngineManager = new OffscreenEngineProxy();
export default offscreenEngineManager;