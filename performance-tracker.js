import {getRenderer} from './renderer.js';
import debug from './debug.js';
import {waitForFrame} from './util.js';

const getGl = () => getRenderer().getContext();
let ext = null;
const getExt = () => {
  if (ext === null) {
    const gl = getGl();
    ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  }
  return ext;
}
const performanceTrackerFnSymbol = Symbol('performanceTrackerFn');

class PerformanceTracker extends EventTarget {
  constructor () {
    super();

    this.enabled = debug.enabled;
    this.gpuQueries = new Map();
    this.cpuResults = new Map();
    this.gpuResults = new Map();
    this.currentGpuObject = null;
    this.prefix = '';

    debug.addEventListener('enabledchange', e => {
      this.enabled = e.data.enabled;
    });
  }
  startGpuObject(name) {
    if (!this.enabled) return;
    
    if (this.prefix) {
      name = [this.prefix, name].join('/');
    }

    if (this.currentGpuObject?.name !== name) {
      const gl = getGl();
      const ext = getExt();

      if (this.currentGpuObject) {
        this.endGpuObject();
      }

      const query = gl.createQuery();
      gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    
      let currentGpuObject = this.gpuResults.get(name);
      if (!currentGpuObject) {
        currentGpuObject = {
          name,
          time: 0,
        };
        this.gpuResults.set(name, currentGpuObject);
      }
      this.currentGpuObject = currentGpuObject;

      let qs = this.gpuQueries.get(this.currentGpuObject);
      if (!qs) {
        qs = [];
        this.gpuQueries.set(this.currentGpuObject, qs);
      }
      qs.push(query);
    }
  }
  endGpuObject() {
    if (!this.enabled) return;

    const gl = getGl();
    gl.endQuery(ext.TIME_ELAPSED_EXT);
    this.currentGpuObject = null;
  }
  startFrame() {
    if (!this.enabled) return;

    this.dispatchEvent(new MessageEvent('startframe'));
  }
  setPrefix(prefix) {
    if (!this.enabled) return;

    this.prefix = prefix;
  }
  decorateApp(app) {
    const _makeOnBeforeRender = fn => {
      const resultFn = () => {
        this.startGpuObject(app.name);
        fn && fn();
      };
      resultFn[performanceTrackerFnSymbol] = true;
      return resultFn;
    };
    const _makeOnAfterRender = fn => {
      const resultFn = () => {
        if (this.currentGpuObject?.name === name) {
          this.endGpuObject();
        }
        fn && fn();
      };
      resultFn[performanceTrackerFnSymbol] = true;
      return resultFn;
    };

    const _decorateObject = o => {
      if (o.isMesh) {
        if (!o.onBeforeRender?.[performanceTrackerFnSymbol]) {
          o.onBeforeRender = _makeOnBeforeRender(o.onBeforeRender);
        }
        if (!o.onAfterRender?.[performanceTrackerFnSymbol]) {
          o.onAfterRender = _makeOnAfterRender(o.onAfterRender);
        }
      }
    }
    const _traverse = o => {
      _decorateObject(o);
      
      for (const child of o.children) {
        if (!child.isApp) {
          _traverse(child);
        }
      }
    }
    _traverse(app);
  }
  async waitForGpuResults(gpuResults) {
    const renderer = getRenderer();
    const gl = renderer.getContext();

    for (const [name, object] of gpuResults) {
      const qs = this.gpuQueries.get(object);
      for (const query of qs) {
        // wait for query result
        for (;;) {
          const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
          if (available) {
            break;
          } else {
            await waitForFrame();
          }
        }

        // sum query result
        object.time += gl.getQueryParameter(query, gl.QUERY_RESULT);
        
        // cleanup
        // gl.deleteQuery(query);
      }

      // cleanup
      this.gpuQueries.delete(object);
    }
  }
  scheduleSnapshot() {
    if (!this.enabled) return;

    (async () => {
      const {cpuResults, gpuResults} = this;

      await this.waitForGpuResults(gpuResults);

      this.dispatchEvent(new MessageEvent('snapshot', {
        data: {
          cpuResults,
          gpuResults,
        },
      }));
    })();
  }
  endFrame() {
    if (!this.enabled) return;

    if (this.currentGpuObject) {
      this.endGpuObject();
    }

    this.scheduleSnapshot();

    this.cpuResults = new Map();
    this.gpuResults = new Map();

    // this.dispatchEvent(new MessageEvent('endframe'));
  }
}
const performanceTracker = new PerformanceTracker();
export default performanceTracker;