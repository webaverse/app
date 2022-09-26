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
};
const performanceTrackerFnSymbol = Symbol('performanceTrackerFn');

const numSnapshots = 10;

class PerformanceTracker extends EventTarget {
  constructor() {
    super();

    this.enabled = debug.enabled;
    this.gpuQueries = new Map();
    this.cpuResults = new Map();
    this.gpuResults = new Map();
    this.currentCpuObject = null;
    this.currentGpuObject = null;
    this.prefix = '';

    this.snapshots = Array(numSnapshots).fill(null);
    this.snapshotIndex = 0;
    this.lastSnapshotTime = 0;

    debug.addEventListener('enabledchange', e => {
      this.enabled = e.data.enabled;
    });
  }

  startCpuObject(id, name) {
    if (!this.enabled) return;

    if (name === undefined) {
      name = id;
    }

    if (this.prefix) {
      name = [this.prefix, name].join('/');
    }

    if (this.currentCpuObject?.id !== id) {
      if (this.currentCpuObject) {
        this.endCpuObject();
      }

      let currentCpuObject = this.cpuResults.get(name);
      if (!currentCpuObject) {
        const now = performance.now();
        currentCpuObject = {
          id,
          name,
          startTime: now,
          endTime: now,
        };
        this.cpuResults.set(name, currentCpuObject);
      }
      this.currentCpuObject = currentCpuObject;
    }
  }

  endCpuObject() {
    if (!this.enabled) return;

    this.currentCpuObject.endTime = performance.now();
    this.currentCpuObject = null;
  }

  startGpuObject(id, name) {
    if (!this.enabled) return;

    if (name === undefined) {
      name = id;
    }

    if (this.prefix) {
      name = [this.prefix, name].join('/');
    }

    if (this.currentGpuObject?.id !== id) {
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
          id,
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

  setCpuPrefix(cpuPrefix) {
    if (!this.enabled) return;

    this.cpuPrefix = cpuPrefix;
  }

  setGpuPrefix(gpuPrefix) {
    if (!this.enabled) return;

    this.gpuPrefix = gpuPrefix;
  }

  decorateApp(app) {
    const self = this;
    const _makeOnBeforeRender = fn => {
      const resultFn = function() {
        self.startGpuObject(app.modulesHash, app.name);
        fn && fn.apply(this, arguments);
      };
      resultFn[performanceTrackerFnSymbol] = true;
      return resultFn;
    };
    const _makeOnAfterRender = fn => {
      const resultFn = function() {
        if (self.currentGpuObject?.id === app.modulesHash) {
          self.endGpuObject();
        }
        fn && fn.apply(this, arguments);
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
    };
    const _traverse = o => {
      _decorateObject(o);

      for (const child of o.children) {
        if (!child.isApp) {
          _traverse(child);
        }
      }
    };
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
        gl.deleteQuery(query);
      }

      // cleanup
      this.gpuQueries.delete(object);
    }
  }

  getSmoothedSnapshot() {
    const cpu = new Map();
    const gpu = new Map();

    for (const snapshot of this.snapshots) {
      if (snapshot) {
        for (const [name, object] of snapshot.cpuResults) {
          let current = cpu.get(name);
          if (!current) {
            current = {
              name,
              time: 0,
              count: 0,
            };
            cpu.set(name, current);
          }
          current.time += object.endTime - object.startTime;
          current.count++;
        }
        for (const [name, object] of snapshot.gpuResults) {
          let current = gpu.get(name);
          if (!current) {
            current = {
              name,
              time: 0,
              count: 0,
            };
            gpu.set(name, current);
          }
          current.time += object.time;
          current.count++;
        }
      }
    }

    const cpuResults = Array.from(cpu.values())
      .map(o => {
        return {
          name: o.name,
          time: o.time / o.count,
        };
      }).sort((a, b) => b.time - a.time);
    const gpuResults = Array.from(gpu.values()).map(o => {
      return {
        name: o.name,
        time: o.time / o.count,
      };
    }).sort((a, b) => b.time - a.time);
    return {
      cpuResults,
      gpuResults,
    };
  }

  scheduleSnapshot() {
    if (!this.enabled) return;

    (async () => {
      const {cpuResults, gpuResults} = this;

      await this.waitForGpuResults(gpuResults);

      const snapshot = {
        cpuResults,
        gpuResults,
      };
      this.snapshots[this.snapshotIndex] = snapshot;
      this.snapshotIndex = (this.snapshotIndex + 1) % numSnapshots;

      const now = performance.now();
      if ((now - this.lastSnapshotTime) > 1000) {
        // console.log('get smoothed snapshot');
        const snapshot = this.getSmoothedSnapshot();
        this.dispatchEvent(new MessageEvent('snapshot', {
          data: snapshot,
        }));
        this.lastSnapshotTime = now;
      }
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
